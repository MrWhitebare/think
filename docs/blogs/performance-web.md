# 前端性能优化

::: tip 前言
生产环境中有一个多选框模块，如果数量小于5，选择速度很快；但是随着多选项选项达到20个以上，多选框组件响应非常缓慢。我使用console.time也没有找到性能异常的原因。
:::

## 想到浏览器performance工具

Chrome DevTools 的 Performance 工具是性能分析和优化的利器，因为它可以记录每一段代码的耗时，进而分析出性能瓶颈，然后做针对性的优化。

## 查看调用堆栈

我发现`_onStoreIds`方法耗时很久，进一步查询发现`addCluster`耗时很久，最后锁定问题**循环添加cluster图层，而leaflet.markercluster**提供了`addLayers`。

### 优化前，多次批量调用addLayer，导致浏览器绘制失帧
![🔥图优化前](/images/fire.png)

### 优化后，使用addLayers批量添加图层，解决卡顿问题
![🔥图优化后](/images/fire2.png)