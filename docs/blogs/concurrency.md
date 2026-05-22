# 记录一次并发问题

## 背景概述

在系统开发中，当菜单与职位的关联关系（TMenuPosition）发生变更时，需要将受影响职位的全量权限同步至第三方权限系统（GeoQ）。由于原实现方案对“读写一致性”与“分布式锁作用域”的控制存在偏差，导致在多线程并发或两笔后台请求物理时间线交错时，触发了权限脏写（数据倒退）问题。

本报告对该漏洞成因进行深度复盘，并结合 `Redisson` 的底层原理提供架构重构方案。


## 问题核心根源分析：“锁写不锁读”导致时序崩塌

原代码的逻辑设计为：先在锁外部批量读取数据库中的全量权限，随后进入 for 循环并在分布式锁的保护下将数据推送到第三方 GeoQ。

这种设计存在致命的竞态条件（Race Condition），因为“读取最新权限”与“加锁写入第三方”这两个动作割裂了。分布式锁本身无法拦截或挂起还未走到锁这一行的线程，导致后进来的请求在没有触碰锁之前，就已经在外面读取了不一致的数据。

### 漏洞现场还原（双请求时序交错）

假设原职位拥有权限 [A, B]。两位管理员几乎同时在后台操作：

- 请求 1 (T1)：将权限变更为 [A, B, C]（新增 C）

- 请求 2 (T2)：将权限变更为 [A, B, D]（新增 D）

即便这两笔请求不属于大流量高并发，只要满足以下特定物理时间线，漏洞就会立刻暴露：

- T1 成功 Commit DB $\rightarrow$ 此时本地数据库权限为 [A, B, C]。

- T2 紧接着 Commit DB $\rightarrow$ 本地数据库最新权限被覆盖为 [A, B, D]。

- T2 触发 doAfterCommit 并执行读库（锁外部）：由于 T2 刚提交，它成功查到了当前最新全量权限 [A, B, D]。紧接着，T2 由于微小的网络波动或 CPU 线程切换被操作系统暂时挂起。

- T1 触发 doAfterCommit 并执行读库（锁外部）：由于 T2 已经提交，T1 在外面同样查到了 [A, B, D]。

- T1 顺利向前推进并夺取分布式锁：将手中持有的 [A, B, D] 推送给 GeoQ，随后释放锁。

- 被挂起的 T2 恢复执行：它向前抢锁并顺利拿到锁（因为 T1 已释放）。

- 致命一击：如果此时有第三个请求 T3 已经把数据库改成了 [A, B, E]，T2 依然会拿着老早前在锁外面查到的历史脏数据 [A, B, D] 强行全量覆盖 GeoQ。

最终结果：本地数据库中已经是最新版权限 [A, B, E]，但第三方系统 GeoQ 被旧版本数据 [A, B, D] 强行覆盖倒退，两端状态彻底脱节。

## 核心探讨：分布式锁能挂起线程吗？

在分析该问题时，必须理清分布式锁对本地 JVM 线程的真实控制力局限：

结论：分布式锁本身并不能直接挂起物理线程。

### 锁的本质：它只是一个状态标记

跨机器的分布式锁（如 Redis、ZooKeeper）本质上只是一个全局共享变量。当线程执行 lock.tryLock() 时，它只是向远程 Redis 发送了一条命令（如 Lua 脚本或 SET NX），询问：“这个标记被别人占了吗？”。Redis 顶多返回 1（成功）或 0（失败）。Redis 无法直接触碰 JVM 内部，更没有资格操控本地操作系统的物理线程生命周期。

### Redisson 让线程“原地等待”的底层黑科技

既然分布式锁不能挂起线程，为什么我们在调用 lock.tryLock(5, TimeUnit.SECONDS) 时，线程确实会“停在那里不动”呢？这并不是 Redis 的功能，而是 Redisson 框架在本地 JVM 层面通过复杂的并发工具进行妥协和封装的结果：

- 初次抢锁失败：线程发送 Lua 脚本到 Redis 发现锁已被占用，抢锁失败。

- 订阅释放信号（Pub/Sub）：Redisson 不会盲目采用 while(true) 循环去疯狂刷 Redis（自旋锁非常浪费 CPU 和网络带宽）。它会利用 Redis 的 Pub/Sub（发布订阅）功能，向 Redis 订阅该锁的释放事件通道。

- 本地真正挂起（AQS / Semaphore）：订阅成功后，Redisson 内部会使用基于 AQS 架构的本地并发工具 Semaphore（信号量），调用 semaphore.tryAcquire(timeout)。此时，本地物理线程被真正挂起（进入 WAITING 状态），交出 CPU 执行权。

- 触发唤醒：当占有锁的那个分布式请求执行完，调用 unlock() 时，Redis 会发布一条锁释放的消息。Redisson 的本地监听器收到通知后，会让 Semaphore 释放一个信号，唤醒刚才挂起的本地线程。线程重新睁开眼，再次向 Redis 发起抢锁请求。

## 为什么原代码没防住？

因为在原代码的逻辑中，并发线程在执行读库（listPermissionsByPosition）时，还没有走到 lock.tryLock() 那一行。
分布式锁背后的“Redis 订阅 + 本地 Semaphore 信号量”根本没有机会去挂起这个线程。线程在没有任何阻挡的情况下，在外面高高兴兴地把脏数据读完了，锁的拦截作用形同虚设。

### 重构后的代码实现

```java
/**
 * 批量同步受影响职位到 GeoQ 权限系统
 * <p>将“读库”与“写外部”共同移入分布式锁临界区，彻底杜绝并发时序导致的数据倒退漏洞</p>
 *
 * @param positionIds 受影响的职位ID集合
 */
private void syncToGeoQBatch(Set<Long> positionIds) {
    // 1. 批量查询职位基础信息（职位本身的 GeoqRoleId 属于静态配置，可放在锁外批量查）
    List<TPosition> positions = positionService.list(new LambdaQueryWrapper<TPosition>()
            .in(TPosition::getId, positionIds)
            .select(TPosition::getId, TPosition::getGeoqRoleId));
    Map<Long, TPosition> positionMap = positions.stream()
            .collect(Collectors.toMap(TPosition::getId, p -> p));

    // 2. 纵向遍历每个受影响的职位，依次建立严格的锁隔离临界区
    for (Long positionId : positionIds) {
        try {
            TPosition position = positionMap.get(positionId);
            if (position == null || position.getGeoqRoleId() == null) {
                log.debug("职位 {} 不存在或未关联 GeoQ 角色，跳过同步", positionId);
                continue;
            }

            String lockKey = "lock:sync:geoq:pos:" + positionId;
            RLock lock = redissonClient.getLock(lockKey);

            boolean isLocked = false;
            try {
                // 🚀 【关键改动 1】先拿锁！拿不到锁绝不睁眼看数据库。
                // 显式设定业务兜底锁过期时间 60 秒，防止第三方接口死锁导致看门狗无限续期、锁死线程
                isLocked = lock.tryLock(5, 60, TimeUnit.SECONDS);
                if (!isLocked) {
                    // 5秒内没排到队，说明有并发线程正在刷新。由于它是在锁内读的库，它一定会刷到最新的全量权限
                    // 当前线程直接跳过是绝对安全的，避免无谓的重复刷新
                    log.warn("获取职位 {} 的 Redisson 锁超时，已有并发线程在处理最新数据，跳过本次同步", positionId);
                    continue;
                }

                // 🚀 【关键改动 2】在分布式锁内部进行全量权限查询！
                // 100% 保证：谁先抢到锁并通过本地 Semaphore 挂起他人，谁才能看到这一刻数据库里的全量真相同步
                List<PositionPermissionDTO> currentPermissions = menuMapper.listPermissionsByPosition(Collections.singleton(positionId));
                List<String> permissions = currentPermissions.stream()
                        .map(PositionPermissionDTO::getPermission)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

                Integer roleId = position.getGeoqRoleId().intValue();
                
                // 🚀 【关键改动 3】同步第三方与本地缓存清理闭环
                geoQTOrgRoleFuncService.refreshFuncMapping(appConfig.getOrgId(), roleId, permissions);
                userAuthService.clearRoleFunRightCache(appConfig.getOrgId(), roleId);
                
                log.info("成功在分布式锁内同步 GeoQ 权限并清理缓存，职位ID: {}", positionId);

            } catch (InterruptedException e) {
                log.error("Redisson 等待锁期间被中断，职位ID: {}", positionId, e);
                Thread.currentThread().interrupt(); // 恢复中断状态
            } finally {
                // 严格校验锁的持有状态，安全释放
                if (isLocked && lock.isHeldByCurrentThread()) {
                    lock.unlock();
                    log.debug("成功释放 Redisson 锁, key: {}", lockKey);
                }
            }
        } catch (Exception e) {
            log.error("联动同步 GeoQ 权限发生系统级异常，职位ID: {}", positionId, e);
        }
    }
}
```

## 总结与反思

- 分布式核心金律：“若不锁读，只锁写，等于没锁。” 当外部状态完全依赖数据库作为计算基准源时，“读库 $\rightarrow$ 计算 $\rightarrow$ 写入” 的全链路必须处于同一个分布式锁的临界区内。

- 正确认知工具限制：明确分布式锁只是“信号标记”，真正执行物理线程挂起的是本地的 JVM 工具。只有理清两者的边界，才能准确判断锁的作用域。

- 并发不等于高并发：很多逻辑脏写甚至不需要上千 QPS 的大流量，只需要 2 条普通的物理请求在特定的 CPU 时间片下发生交错就会爆发。在面对跨网络的第三方最终一致性同步时，严谨的时序控制永远是第一要素。
