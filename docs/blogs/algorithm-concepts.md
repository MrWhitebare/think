---
title: 算法基础概念与技巧
lang: zh
---

# 算法基础概念与技巧

记录刷题中反复遇到的基础工具：循环索引、贪心、双指针、动态规划，以及等差数列求和。理解每种方法成立的条件，比记住代码模板更重要。

## 一、用取余处理循环索引

在环形数组、循环队列或轮转序列中，索引越过边界后需要回到另一端。设数组长度为 $n$，有效下标是 $0$ 到 $n-1$。

### 向前和向后移动

下一个位置和上一个位置分别是：

$$
\text{next}(i) = (i + 1) \bmod n, \qquad
\text{previous}(i) = (i - 1 + n) \bmod n
$$

例如，$n=5$ 时，下标 $4$ 的下一个位置是 $(4+1)\bmod 5=0$；下标 $0$ 的上一个位置是 $(0-1+5)\bmod 5=4$。

如果一次移动多个位置，偏移量为 $k$（正数向后、负数向前），目标下标是：

$$
\text{index} = (i + k) \bmod n
$$

需要留意：不同语言对负数取余的定义不同。Java 的 `%` 结果可能为负数，因此可以用 `Math.floorMod`：

```java
int nextIndex = Math.floorMod(index + offset, length);
```

这里要求 `length > 0`。在数学表达或采用非负模运算的语言中，也可以把结果规范化为 `((index + offset) % length + length) % length`。

## 二、贪心算法

贪心算法每一步都选择当前看来最有利的方案，希望这些局部选择最终组成全局最优解。它的优点通常是实现简单、效率高；难点是证明局部选择不会破坏全局最优。

### 核心思考框架

遇到一道可能适合贪心的题，可以按下面的顺序分析：

#### 1. 能否把问题拆成连续的决策？

观察题目是否能按位置、时间或阶段逐步处理，例如从左到右扫描数组、沿路线经过各个站点，或逐步扩展当前能到达的范围。这只是发现候选思路的线索，并不能证明题目适合贪心；很多 DP 和单调栈问题同样是按顺序处理的。比如“每日温度”通常使用单调栈，而不是因为逐日扫描就归为贪心。

#### 2. 明确每一步的局部选择

把“当前看起来最好”写成可以执行的规则，并说明每一步维护的状态或不变量。比如：

- **加油站**：从候选起点出发，一旦累计油量首次变为负数，就把下一站作为新候选起点，并清空当前累计油量。
- **盛水容器**：比较左右边界后，移动较矮的一侧。
- **跳跃游戏 I**：从左向右扫描，并维护当前所有可达位置中最远能到达的下标。

只说“选更好的”还不够；规则必须具体到能判断何时选择、如何更新状态。

#### 3. 证明局部选择不会错过全局最优

这是贪心最关键、也最容易出错的一步。常见证明方式包括：

- **交换论证**：从一个最优解出发，把其中的选择替换成贪心选择，并证明替换后仍然是最优解。活动安排问题中，结束更早的活动可以替换最优解里结束较晚的第一个活动，为后续活动留下至少同样多的时间。
- **排除不可能的候选**：证明某些选择不可能成为最优解的一部分，因此可以安全跳过。盛水容器中，若左侧边界较矮，那么任何仍使用这条矮边界的容器，宽度都不会比当前更大，高度也不会超过这条矮边界；继续保留它不可能得到更大面积，所以可以移动左指针。
- **归纳或保持不变量**：证明每一步之后，当前状态仍保留某个最优解所需的信息。加油站问题中，假设候选起点到站点 `i` 的累计油量首次为负，而且从候选起点到 `i` 之前的累计油量都非负，那么这段区间中的任何站点都无法作为新起点到达 `i`；因此可以整体跳过，并从 `i + 1` 继续。还需结合总油量判断是否有解。

如果暂时找不到证明，可以先尝试构造反例：枚举小规模输入、检查边界情况，观察局部规则是否会丢掉更优解。找不到反例不等于证明正确；它只是帮助检验猜想，最终仍要说明为什么所有输入都成立。

### 示例：最多安排多少个互不重叠的活动

给定若干活动，每个活动有开始时间和结束时间，求最多能参加多少个互不重叠的活动。把活动表示为半开区间 `[start, end)`，相邻活动允许首尾相接，即下一个活动满足 `start >= 上一个活动的 end`。

策略是：**每次选择结束时间最早、且与已选活动兼容的活动。**

```text
按结束时间从早到晚排序
selectedEnd = 负无穷
count = 0

遍历每个活动：
    如果活动的开始时间 >= selectedEnd：
        选择该活动
        selectedEnd = 活动的结束时间
        count += 1
```

### 为什么这个贪心策略成立

设贪心选择的第一个活动是 $g$，某个最优解选择的第一个活动是 $o$。因为 $g$ 的结束时间最早，所以 `end(g) <= end(o)`。把最优解中的 $o$ 替换为 $g$，不会减少后续可安排的活动数量，因为所有能接在 $o$ 后面的活动也都能接在结束更早或相同的 $g$ 后面。替换后仍然存在一个最优解包含 $g$；对剩余活动重复这个论证，就能得到该策略的正确性。

排序耗时 $O(n\log n)$，扫描耗时 $O(n)$。这类证明常称为**交换论证**。贪心并非对所有优化问题都适用；如果找不到类似的正确性证明，应考虑动态规划等方法。

### 贪心和动态规划怎么区分

“每一步只有一个显然更好的选择就用贪心；有多种选择就用 DP”可以作为很粗略的直觉，但不能当成判定规则。贪心题也可能有很多候选活动，关键是能否证明某个局部选择安全；DP 题也不一定要枚举所有完整方案，而是把规模较小的子问题组织起来，避免重复计算。

更可靠的判断方式是：

- 如果能证明每一步的选择都可以安全固定，并把剩余问题缩小为同类问题，贪心通常更直接。
- 如果某一步的不同选择会导向不同的后续状态，暂时无法安全排除其中任何一种，就考虑用 DP 表示状态并比较转移结果。

例如，**跳跃游戏 I**只问能否到达终点，可以维护最远可达位置；**跳跃游戏 II**问最少跳几次，虽然也能用 DP 定义“到达每个位置的最少步数”，但还可以用贪心线性扫描：把当前一次跳跃能覆盖的范围看作一层，在这一层中找出下一层能到达的最远边界，走到当前层边界时再增加跳数。这个贪心过程类似按层遍历，而不是任意挑一个看起来最远的位置就结束。

## 三、双指针

双指针用两个位置标记遍历状态，通过有规律地移动指针，减少重复扫描。常见模式包括：

- **两端向中间**：两个指针从序列两端出发，适用于有序数组的配对问题、回文判断等。
- **同向快慢指针**：快指针负责扫描，慢指针标记待写入或待保留的位置，适用于原地去重、移除元素等。
- **不同序列各一个指针**：同步遍历两个有序序列，适用于归并和交集问题。

### 示例：有序数组中的两数之和

数组已经按升序排列，寻找两个数，使它们的和等于 `target`。令 `left` 指向开头、`right` 指向末尾：

```text
当 left < right 时：
    sum = nums[left] + nums[right]
    如果 sum == target：找到答案
    如果 sum < target：left 向右移动
    如果 sum > target：right 向左移动
```

当和偏小时，固定较大的右侧数、再减小左侧数只会让和更小，所以应该增大 `left`；当和偏大时则相反。每次至少移动一个指针，因此时间复杂度为 $O(n)$，额外空间为 $O(1)$。

这个方法依赖数组有序带来的单调性。若数组无序，不能直接用这套移动规则；应先排序（但要考虑排序后如何保留原下标），或改用哈希表等方法。写双指针时，先明确循环不变量和指针移动后哪些候选解可以安全排除。

## 四、从递归推导递推式，再转成动态规划

动态规划通常从一个递归问题开始。递归表达“规模较大的问题如何由更小的问题组成”，随后把其中反复计算的子问题保存下来：可以用记忆化递归自顶向下计算，也可以按依赖顺序自底向上填表。

### 示例：爬楼梯

每次可以爬 $1$ 阶或 $2$ 阶，求爬到第 $n$ 阶有多少种不同方法。定义 $f(n)$ 为到达第 $n$ 阶的方法数。最后一步要么从 $n-1$ 阶爬 $1$ 阶来，要么从 $n-2$ 阶爬 $2$ 阶来，因此：

$$
f(n) = f(n-1) + f(n-2)
$$

边界条件是 $f(0)=1$、$f(1)=1$。$f(0)=1$ 表示什么也不做有一种空方案，便于统一处理递推边界。

直接递归会重复计算相同的 $f(n)$，时间复杂度为指数级。把递推式改写成自底向上的 DP：

```java
int climbStairs(int n) {
    int[] ways = new int[n + 1];
    ways[0] = 1;
    ways[1] = 1;

    for (int step = 2; step <= n; step++) {
        ways[step] = ways[step - 1] + ways[step - 2];
    }

    return ways[n];
}
```

该实现假设 `n >= 1`，符合常见爬楼梯题目的输入范围。DP 数组把每个子问题的答案保存一次，因此时间复杂度为 $O(n)$，空间复杂度为 $O(n)$。由于每一步只依赖前两步，还可以只保留两个变量，把额外空间优化到 $O(1)$。

从递归转为 DP 时，可以依次确认：

1. **状态**：要保存的子问题是什么？这里是“到第 `step` 阶的方法数”。
2. **选择与转移**：最后一步有哪些可能？每种选择对应哪些更小的状态？
3. **边界**：最小规模的答案是什么？
4. **计算顺序**：先算哪些状态，才能保证转移所需的状态已经算出？

## 五、等差数列求和

等差数列的首项为 $a_1$，公差为 $d$，项数为 $n$，第 $n$ 项是：

$$
a_n = a_1 + (n-1)d
$$

把数列正着写、再倒着写后逐项相加，每一对都是 $a_1+a_n$，一共有 $n$ 对。因此：

$$
2S_n = n(a_1+a_n), \qquad
S_n = \frac{n(a_1+a_n)}{2}
$$

代入第 $n$ 项，也可以写成：

$$
S_n = \frac{n\bigl(2a_1+(n-1)d\bigr)}{2}
$$

例如，$1+2+\cdots+100 = \frac{100(1+100)}{2}=5050$。刷题中常用它快速计算连续整数或等差序列的总和，也可以用于推导循环累计次数。若用整数类型实现，注意乘法可能先溢出；可以先转为足够宽的整数类型再计算。

## 六、Math 的取整方法

以下是 JavaScript `Math` 中常用的取整方法。关键区别在于：`floor` 和 `ceil` 按数轴方向取整，`trunc` 朝零截断；负数时它们的结果尤其容易混淆。

| 方法 | 作用 | `3.7` | `3.2` | `-3.7` | `-3.2` |
| --- | --- | ---: | ---: | ---: | ---: |
| `Math.floor` | 向下取整，取不大于原数的最大整数 | `3` | `3` | `-4` | `-4` |
| `Math.ceil` | 向上取整，取不小于原数的最小整数 | `4` | `4` | `-3` | `-3` |
| `Math.round` | 取最近的整数；恰好 `.5` 时向正无穷方向取整 | `4` | `3` | `-4` | `-3` |
| `Math.trunc` | 直接去掉小数部分，向 `0` 截断 | `3` | `3` | `-3` | `-3` |

特别注意，`Math.floor(-3.2)` 是 `-4`，而 `Math.trunc(-3.2)` 是 `-3`：前者向更小的方向取整，后者只移除小数部分。`Math.round` 也不完全等同于日常所说的“逢五远离零”，例如 `Math.round(-3.5)` 的结果是 `-3`。

## 七、数组 `indexOf` 的第二个参数

`indexOf` 的形式是 `array.indexOf(searchElement, fromIndex)`。第二个参数 `fromIndex` 指定**从哪个下标开始向右搜索**，该位置也会参与比较；它不会让搜索方向反过来。

```js
const colors = ["red", "blue", "green", "blue"];

colors.indexOf("blue");      // 1，从下标 0 开始
colors.indexOf("blue", 2);   // 3，从下标 2 开始
colors.indexOf("blue", -2);  // 3，从倒数第 2 个位置（下标 2）开始
colors.indexOf("blue", -1);  // 3，只检查最后一个位置
colors.indexOf("blue", 4);   // -1，起始位置已超出数组范围
```

规则可以概括为：

- 省略 `fromIndex` 时，从 `0` 开始。
- `fromIndex >= array.length` 时，不会开始搜索，返回 `-1`。
- `fromIndex < 0` 时，从 `array.length + fromIndex` 开始；如果结果仍小于 `0`，就从 `0` 开始。

例如数组长度为 `4` 时，`fromIndex = -2` 会换算成下标 `4 + (-2) = 2`。此外，`indexOf` 使用严格相等比较，因此 `indexOf(NaN)` 找不到 `NaN`；需要检查是否包含某值时，可以使用 `includes`。

## 八、JavaScript `Set` 基础用法

### 核心概念

`Set` 是只保存值的集合，成员具有唯一性，并按插入顺序迭代。它不能像数组一样通过下标访问，例如 `set[0]` 不会取得第一个成员；需要按顺序遍历，或先转换成数组。

判断成员是否重复时，`Set` 使用 **SameValueZero** 比较规则：

- `NaN` 与 `NaN` 被视为相同，因此集合中最多有一个 `NaN`。
- `+0` 与 `-0` 被视为相同。
- 对象按引用判断；两个内容相同但分别创建的对象仍是不同成员。

```js
const values = new Set([1, 2, 2, NaN, NaN]);
console.log([...values]); // [1, 2, NaN]

const objects = new Set([{}, {}]);
console.log(objects.size); // 2：两个对象引用不同
```

### 创建与常用 API

```js
const numbers = new Set([1, 2, 3, 3]); // Set {1, 2, 3}

numbers.add(4).add(5); // 添加成员，返回 Set 本身，可链式调用
numbers.has(3);        // true：判断是否存在
numbers.delete(2);     // true：删除成功；不存在则返回 false
numbers.size;          // 4：成员数量，不是 length
numbers.clear();       // 清空集合
```

### 遍历

```js
const letters = new Set(["a", "b"]);

for (const letter of letters) {
    console.log(letter);
}

letters.keys();    // 与 values() 一样，返回成员迭代器
letters.values();  // 返回成员迭代器；默认迭代器也是它
letters.entries(); // 返回 [value, value] 形式的迭代器
letters.forEach((value, key, set) => {
    // Set 中 key 与 value 相同；第三个参数是集合本身
});
```

### 数学集合运算

现代 JavaScript 提供集合运算方法，返回新集合，不会修改原集合：

```js
const a = new Set([1, 2, 3]);
const b = new Set([3, 4, 5]);

a.union(b);                // 并集：Set {1, 2, 3, 4, 5}
a.intersection(b);         // 交集：Set {3}
a.difference(b);           // 差集：Set {1, 2}
a.symmetricDifference(b);  // 对称差集：Set {1, 2, 4, 5}

a.isSubsetOf(b);    // 是否为子集
a.isSupersetOf(b);  // 是否为超集
a.isDisjointFrom(b); // 是否与另一个集合不相交
```

这些方法在较新的 JavaScript 运行环境中可用；如果项目需要支持较旧的浏览器或 Node.js 版本，应先检查兼容性，必要时使用循环或辅助函数实现。

### 常见用途与性能取舍

**数组去重**：集合保留首次插入顺序，适用于需要按原有顺序去重的简单场景。

```js
const items = [1, 2, 2, 3, 4, 4];
const uniqueItems = [...new Set(items)]; // [1, 2, 3, 4]
```

**频繁成员查询**：`Array.includes` 需要逐项检查，时间复杂度通常为 $O(n)$；`Set.has` 在常见实现中通常更快，适合重复查询。但 ECMAScript 规范没有承诺 `Set.has` 必定是 $O(1)$，而且 `Set` 会占用额外内存，构造集合本身也有成本。只查少量几次时，直接用数组可能更简单；大量重复查询或需要维护唯一成员时，再考虑 `Set`。

### `WeakSet` 简介

`WeakSet` 是面向对象引用的集合：成员只能是对象，以及现代规范支持的未注册 `Symbol`。它对成员使用弱引用，因此如果对象在其他地方不再被引用，垃圾回收可以回收它；`WeakSet` 不会因为保存该对象而阻止回收。

由于成员可能随时被回收，`WeakSet` 不可遍历，也没有 `size`。它只提供 `add`、`has`、`delete` 等操作，适合记录对象是否已处理，或保存与对象生命周期绑定的临时标记。普通 `Set` 则会强引用成员，并支持遍历和查询 `size`。

## 九、JavaScript `Map` 基础用法

`Map` 用来保存键值对。与普通对象不同，`Map` 的键可以是任意类型，包括数字、对象和函数；遍历时会按照键值对的插入顺序进行。对已有键再次调用 `set` 会更新值但不改变其顺序；删除后重新添加，则会排到末尾。

`Map` 的键使用 **SameValueZero** 规则比较：`NaN` 可以匹配 `NaN`，`+0` 与 `-0` 被视为相同；对象键则按引用判断，内容相同的两个对象仍是不同的键。

### 初始化与增删改查

```js
const userMap = new Map();
const objectKey = { id: 1 };

userMap.set("name", "张三"); // 新增键值对，返回 Map 本身，可链式调用
userMap.set(404, "Not Found");
userMap.set(objectKey, "对象也可以作为键");
userMap.set("name", "李四"); // 键已存在：更新值，不增加 size

userMap.get("name");     // "李四"；键不存在时返回 undefined
userMap.has("name");     // true：判断键是否存在
userMap.delete(404);     // 删除成功返回 true，不存在则返回 false
userMap.size;            // 当前键值对数量
// userMap.clear();      // 清空所有键值对
```

如果某个键对应的值可能是 `undefined`，不要只用 `get` 判断键是否存在：

```js
const values = new Map([["result", undefined]]);

values.get("result");  // undefined
values.has("result");  // true
values.has("missing"); // false
```

### 遍历

`Map` 默认迭代器与 `entries()` 相同，产出 `[key, value]`。遍历顺序是插入顺序。

```js
const roles = new Map([
    ["id", 101],
    ["role", "admin"]
]);

for (const [key, value] of roles) {
    console.log(`${key}: ${value}`);
}

for (const key of roles.keys()) {
    console.log(key);
}

for (const value of roles.values()) {
    console.log(value);
}

roles.forEach((value, key, map) => {
    console.log(key, value);
});
```

`keys()`、`values()` 和 `entries()` 返回可迭代对象，不是数组。`forEach` 回调的参数顺序是 `(value, key, map)`，与 `for...of` 解构得到的 `[key, value]` 顺序不同。

### 与数组和普通对象互转

```js
const entries = [...roles];
// [["id", 101], ["role", "admin"]]

const roleObject = Object.fromEntries(roles);
// { id: 101, role: "admin" }

const mapFromObject = new Map(Object.entries({ a: 1, b: 2 }));
// Map { "a" => 1, "b" => 2 }
```

`Object.fromEntries` 会把键转换为对象属性键，因此不同的 `Map` 键可能转换成同一个属性名，例如数字 `1` 和字符串 `"1"`。对象作为键时也会被转成属性名，而不再保留对象引用语义。只有在键适合表示为字符串或 `Symbol`，且转换后不会冲突时，才适合转成普通对象。反过来，`Object.entries` 只读取对象自身可枚举的字符串键属性，不包括 `Symbol` 属性。

## 十、混用 `||` 与算术运算时明确加括号

JavaScript 中 `+`、`-` 的优先级高于逻辑或 `||`。因此，表达式：

```js
const total = alpha[char] || 0 + beta[char] || 0;
```

会按下面的方式分组，而不是先分别给两个查表结果补默认值再相加：

```js
const total = alpha[char] || (0 + beta[char]) || 0;
```

如果意图是将两个值相加，并在缺失时分别使用 `0`，要明确写出括号：

```js
const total = (alpha[char] || 0) + (beta[char] || 0);
```

还可以用空值合并运算符 `??` 表达更精确的默认值规则：只有 `null` 或 `undefined` 才使用默认值，`0`、`false` 和空字符串都会保留。

```js
const total = (alpha[char] ?? 0) + (beta[char] ?? 0);
```

如果需求本身是判断字符是否为元音，可以直接用 `Set` 表示元音集合，并让函数返回 `0` 或 `1`，避免用普通对象做字典查找时遇到原型链属性：

```js
const vowels = new Set(["a", "e", "i", "o", "u"]);

function isVowel(char) {
    return vowels.has(char.toLowerCase()) ? 1 : 0;
}

const total = isVowel(leftChar) + isVowel(rightChar);
```

记法：**逻辑运算与算术运算混写时，按意图给子表达式加括号；用 `??` 表示“仅缺值时回退”，用 `||` 表示“任意假值时回退”。**

## 十一、二分查找：区间定义必须一致

二分查找适用于**有序数组**。每轮比较中间元素，并排除一半不可能包含答案的区间。最常见的错误不是取中点，而是区间定义、循环条件和边界更新没有保持一致，导致死循环或漏查元素。

### 闭区间写法：`[left, right]`

闭区间包含左右端点。若 `nums[mid]` 已经比较过且不等于目标，就应排除 `mid` 本身：

- 目标更小：`right = mid - 1`
- 目标更大：`left = mid + 1`
- 因为 `left === right` 时仍有一个元素待检查，循环条件必须是 `left <= right`

```ts
function search(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length - 1;

    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2);

        if (nums[mid] === target) {
            return mid;
        }
        if (nums[mid] > target) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }

    return -1;
}
```

### 左闭右开写法：`[left, right)`

左端点包含，右端点不包含。此时初始 `right` 是 `nums.length`，循环条件是 `left < right`。当中间值大于目标时，可以令 `right = mid`，因为新的右边界仍然不包含在区间内；当中间值小于目标时，仍需令 `left = mid + 1` 排除已经检查过的 `mid`。

```ts
function search(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length;

    while (left < right) {
        const mid = left + Math.floor((right - left) / 2);

        if (nums[mid] === target) {
            return mid;
        }
        if (nums[mid] > target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    return -1;
}
```

两种写法都正确，但不能混搭：

| 区间定义 | `right` 初值 | 循环条件 | 排除中间元素时的更新 |
| --- | --- | --- | --- |
| 闭区间 `[left, right]` | `n - 1` | `left <= right` | `right = mid - 1` 或 `left = mid + 1` |
| 左闭右开 `[left, right)` | `n` | `left < right` | `right = mid` 或 `left = mid + 1` |

### 两个典型错误

**错误一：`left = mid` 或闭区间中的 `right = mid` 可能不推进边界。** 当 `left` 和 `right` 相邻时，向下取整的 `mid` 可能等于 `left`。若执行 `left = mid`，区间完全不变，循环就会卡住。闭区间中比较过 `mid` 后应排除它，使用 `left = mid + 1` 或 `right = mid - 1`。左闭右开写法的 `right = mid` 是例外，因为 `mid` 被设置成不包含的右边界。

**错误二：闭区间用 `left < right` 会漏查最后一个元素。** 例如 `left = 0`、`right = 0` 时，区间 `[0, 0]` 仍包含一个待检查的元素，但 `left < right` 不成立。因此闭区间必须使用 `left <= right`。

### 中点写法与验证用例

常见写法 `left + Math.floor((right - left) / 2)` 避免了直接计算 `left + right`。JavaScript 的数组下标范围内通常不会遇到整数溢出，但 Java、C++ 等固定宽度整数环境中，`left + right` 可能溢出；使用差值写法更稳妥。

每次实现后至少检查普通命中、未命中、单元素和相邻双元素：

```text
nums = [-1, 0, 3, 5, 9, 12], target = 9  ->  4
nums = [-1, 0, 3, 5, 9, 12], target = 2  -> -1
nums = [5], target = 5                  ->  0
nums = [1, 3], target = 3               ->  1
```

### `lower_bound` 与 `upper_bound`

对于升序数组：

- `lower_bound(x)`：第一个 **大于或等于** `x` 的位置，也就是第一个满足 `nums[i] >= x` 的下标。
- `upper_bound(x)`：第一个 **大于** `x` 的位置，也就是第一个满足 `nums[i] > x` 的下标。

两者都是插入位置，取值范围为 `0` 到 `nums.length`；如果数组中不存在符合条件的元素，结果就是 `nums.length`。继续沿用闭区间二分模板，核心区别只有比较时是否跳过等于 `x` 的元素：

```ts
function lowerBound(nums: number[], x: number): number {
    let left = 0;
    let right = nums.length - 1;

    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2);
        if (nums[mid] < x) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return left;
}

function upperBound(nums: number[], x: number): number {
    let left = 0;
    let right = nums.length - 1;

    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2);
        if (nums[mid] <= x) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return left;
}
```

| 查找边界 | 左指针前进条件 | 返回位置 |
| --- | --- | --- |
| `lower_bound(x)` | `nums[mid] < x` | 第一个 `>= x` 的位置 |
| `upper_bound(x)` | `nums[mid] <= x` | 第一个 `> x` 的位置 |

要跳过等于 `x` 的元素，就把左指针前进条件写成 `nums[mid] <= x`。相同的边界查找逻辑也适用于其他可排序类型，但比较规则必须与排序时使用的顺序一致。

### 用边界查找实现 `searchRange` 和计数

相同目标值在升序数组中的范围是半开区间 `[lowerBound(x), upperBound(x))`。因此，最后一个目标值的位置是 `upperBound(x) - 1`，目标值的个数则是两个边界之差：

```ts
function searchRange(nums: number[], target: number): number[] {
    const start = lowerBound(nums, target);
    if (start === nums.length || nums[start] !== target) {
        return [-1, -1];
    }

    return [start, upperBound(nums, target) - 1];
}

function countOccurrences(nums: number[], target: number): number {
    return upperBound(nums, target) - lowerBound(nums, target);
}
```

例如 `nums = [5, 7, 7, 8, 8, 10]`、`target = 8` 时，`lowerBound(8) = 3`，`upperBound(8) = 5`，所以范围是 `[3, 4]`，出现次数是 `5 - 3 = 2`。这种方式不需要用 `target + 1` 推导右边界。

如果循环使用 `nums[mid] > target` 时令 `right = mid - 1`，否则令 `left = mid + 1`，那么循环结束时的 `left` 正是 `upperBound(target)`；`right = left - 1` 则是最后一个 `<= target` 的位置（若不存在则为 `-1`）。

### 找目标值与找边界/最小值

二分的区间写法取决于任务：查找一个确定目标时，比较后通常能排除 `mid`；寻找边界或最小值时，`mid` 本身可能就是答案，需要在某一侧保留它。

| 对比项 | 找目标值 `search` | 找边界或最小值 |
| --- | --- | --- |
| 每轮判断 | `nums[mid] === target` 时可以直接返回 | 通常没有单独的“命中即返回”分支 |
| 常见循环 | 闭区间使用 `left <= right` | 保留候选的写法通常使用 `left < right` |
| 收缩方式 | 未命中时两侧都排除 `mid`：`mid - 1` 或 `mid + 1` | 一侧排除 `mid`；另一侧用 `right = mid` 保留它 |
| 结束状态 | 闭区间搜索结束时 `left > right`，候选区间为空 | `left === right`，收敛到唯一候选答案 |

**判断规则：问自己，`mid` 在当前分支里还可能是答案吗？**

- 如果不可能，排除 `mid`，边界移动到 `mid + 1` 或 `mid - 1`。
- 如果仍可能，保留 `mid`，例如令 `right = mid`；这类收敛写法通常配合 `left < right`，保证区间每轮都缩小。

### 示例：旋转升序数组中的最小值

以下是数组元素互不相同的常见版本。若 `nums[mid] > nums[right]`，最小值在 `mid` 右侧，`mid` 可以排除；否则最小值可能就是 `mid`，所以令 `right = mid` 保留它。数组不能为空：

```ts
function findMin(nums: number[]): number {
    let left = 0;
    let right = nums.length - 1;

    while (left < right) {
        const mid = left + Math.floor((right - left) / 2);
        if (nums[mid] > nums[right]) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return nums[left];
}
```

这与左闭右开形式的 `lower_bound` 是同一种保留候选的思路：若 `nums[mid] >= target`，`mid` 可能就是第一个满足条件的位置，因此收缩右边界到 `mid`；否则排除 `mid`，令 `left = mid + 1`。

```ts
function lowerBoundHalfOpen(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length;

    while (left < right) {
        const mid = left + Math.floor((right - left) / 2);
        if (nums[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    return left;
}
```

注意：本文前面的 `lowerBound` 示例是闭区间版本（`left <= right`），这里展示的是语义相同的左闭右开版本（`left < right`）。区间定义不同，循环条件和边界更新也要成套调整。