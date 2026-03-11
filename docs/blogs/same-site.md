# 记录一次iframe嵌入的问题

::: tip 前情提要
在safari浏览器中，我的主页面域名为 a.berg.com,子页面 b.berg.com通过iframe嵌入主页面，子页面通过cookie鉴权，不能正常打开子页面

但是在chrome浏览器中，主域名和子域名的根域名是一致的，可以正常打开的。
:::

## 通过gemini得知

在 Safari 浏览器中，默认情况下无法正常打开该子页面。

即使 a.berg.com 和 b.berg.com 属于同一父域名，在 Safari 的 ITP（智能反跟踪） 机制下，b.berg.com 在 iframe 中仍被视为第三方内容，其 Cookie 会被默认阻止，导致鉴权失败。

### 为什么无法正常打开

- ITP 限制： Safari 默认启用“阻止跨站跟踪”，这会拦截所有在 iframe 等第三方上下文中携带的 Cookie。
- SameSite 属性： 即使你设置了 SameSite=None; Secure，Safari 依然可能因为 ITP 策略拒绝在跨站 iframe 中发送该 Cookie。
- 跨站判定： 根据 Apple Webkit 官方说明，只要域名（eTLD+1）之外的子域不同且处于嵌入状态，就被严格限制访问其存储空间。

### 解决方案

- 使用 Storage Access API (推荐)：

这是 Apple 官方提供的标准做法。子页面需要调用 document.requestStorageAccess()。

流程： 用户必须先与子页面有过交互（如点击），浏览器会弹出确认框询问用户是否允许 b.berg.com 使用 Cookie。

- 改为同源 (最稳妥)：

将子页面通过 Nginx 反向代理挂载到主页面的路径下，例如 ://a.berg.com。这样变为完全同源，彻底绕过所有跨站限制。

- 引导用户跳转：

先让用户在顶层窗口（Top-level context）直接访问一次 b.berg.com 完成登录。在某些旧版 Safari ITP 规则下，这可能赋予该域名暂时的“已交互”权限，但并不持久。

- 使用 Token 替代 Cookie：

如果可能，通过 postMessage 将鉴权 Token 从主页面传递给子页面，存放在 localStorage 或内存中，而不依赖浏览器的自动 Cookie 机制。

## 记忆的错乱，safari的cookie策略和chrome策略不同

::: warning 提示
这是一个非常经典且容易混淆的坑。在 “同源策略” 和 “浏览器 Cookie 策略” 中，对“同域”的定义是不一样的。
即使是 a.berg.com 和 b.berg.com，在 Safari 看来也属于跨站（Cross-site），理由如下：
:::

### “同源” vs “同站” 的区别

- 同源 (Same-Origin): 要求 协议 + 域名 + 端口 完全一致。a.berg.com 和 b.berg.com 域名不同，所以它们是跨源的。
- 同站 (Same-Site): 只要 有效顶级域名+1 (eTLD+1) 一致（即都是 berg.com），在 Chrome 等浏览器中通常被视为“同站”。

### 为什么 Safari 依然拦截？

虽然它们属于同一个二级域名（berg.com），但 Safari 的 ITP (Intelligent Tracking Prevention) 机制非常严格：

1. 第三方上下文限制： 当 b.berg.com 嵌入在 a.berg.com 的 iframe 中时，对于当前页面来说，b 就是第三方。
2. 默认阻止： Safari 为了防止跨站追踪，默认会隔离所有在 iframe 中运行的域名的存储权限（Cookie、LocalStorage 等）。
3. 不看 eTLD+1： 哪怕是子域名，只要不是当前地址栏显示的那个精确域名，Safari 都有可能限制其在 iframe 里的 Cookie 读写，除非该域名已经获得了“存储访问权限”。

### 如何验证？

检查 Safari 的设置：

- 设置 -> 隐私 -> 阻止跨站跟踪 (Prevent Cross-Site Tracking)。
- 默认这个选项是勾选的。只要它开启，b.berg.com 在 iframe 里就拿不到鉴权 Cookie。

### 总结

你记的“二级域名相同”在处理 跨域 AJAX 请求（通过设置 domain）或某些浏览器的 SameSite=Lax 策略时是有效的，但在 Safari 的 iframe 场景下，这种“亲戚关系”并不好使。

## chrome的浏览器策略

在 Chrome 中测试成功是正常的，因为 Chrome 目前对“同站”（Same-Site）的定义比 Safari 宽松得多。

### 核心差异：对“同站”定义的严苛程度

- Chrome 的逻辑 (Same-Site):

Chrome 主要看 eTLD+1（有效顶级域名 + 1）。对于 a.berg.com 和 b.berg.com，它们的 eTLD+1 都是 berg.com。

1. 在 Chrome 看来，它们属于同站
2. 因此，默认的 SameSite=Lax 规则通常允许在子域名之间的 iframe 中携带 Cookie

- Safari 的逻辑 (ITP 机制):

Safari 的 ITP (Intelligent Tracking Prevention) 不仅仅看域名后缀，它有一套更复杂的“跨站跟踪”判定算法。

1. Safari 默认开启 “阻止跨站跟踪”
2. 在 Safari 眼里，只要 iframe 的域名与地址栏的域名不完全一致，它就会被标记为“第三方上下文”。为了防止潜在的跟踪行为，Safari 会默认拦截该 iframe 访问或发送任何 Cookie

### 为什么在 Chrome 能过，Safari 挂掉

| 特性                    | Chrome (默认)                  | Safari (默认)                                     |
| ----------------------- | ------------------------------ | ------------------------------------------------- |
| **子域名判定**    | 视为“自己人”（Same-Site）    | 视为“外人”（Cross-Site/Third-party）            |
| **iframe Cookie** | 允许（只要是同站子域）         | **拦截** （除非用户手动允许或使用特定 API） |
| **ITP 限制**      | 较弱，主要防跨站（不同顶级域） | **极强** ，子域名也会受限                   |

## IOS系统上飞书的浏览器内核

在 iOS 系统上，飞书（Lark）自带的浏览器内核是 WebKit。

这是由苹果公司的系统政策决定的。在 iOS 平台上，苹果强制要求所有第三方应用（包括飞书、微信、Chrome 等）在内嵌网页或提供浏览器功能时，必须使用系统提供的 WKWebView 组件，其底层渲染引擎统一为 WebKit。

### 关键细节

- 统一性：由于 iOS 的封闭性，飞书在 iOS 上的网页渲染效果与系统自带的 Safari 浏览器 高度一致。

- ITP 限制：正因为飞书使用的是 WebKit 内核，它同样会受到前文提到的 ITP（智能反跟踪） 机制影响，导致在 iframe 中跨域 Cookie 默认无法使用。

- 版本说明：虽然飞书会根据不同版本对 H5 容器进行优化，但底层引擎始终无法脱离 WebKit 框架。

**苹果是真霸道啊。**

::: info 总结
“永远不要相信浏览器的默认行为，尤其是当它涉及到跨站、嵌入和 Apple 设备时。”
:::
