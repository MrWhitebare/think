---
title: LeetCode 刷题记录
lang: zh
---

# LeetCode 刷题记录

记录刷过的题目、解题思路和需要回看的细节。先尝试独立思考，再整理解法；隔一段时间重做，确认自己真正掌握了题目。

## 刷题清单

| 日期 | 题号 | 题目 | 类型 | 难度 | 状态 |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

状态可以记为：初做、已掌握、待复习。

## 可变长度滑动窗口

可变窗口通过两个只向右移动的指针维护连续子数组或子串：每轮移动 `right` 扩张窗口；当窗口不符合要求，或已经符合要求且要继续缩短时，再移动 `left`。每个元素最多被左右指针经过一次，因此指针移动总次数是 $O(n)$；若窗口状态的增删操作也是 $O(1)$，整体通常为 $O(n)$。

### 先判断题目目标

| 目标 | 常见关键词 | 收缩时机 | 更新答案的位置 |
| --- | --- | --- | --- |
| 求最长 | 最长、最大长度 | 窗口不合法时收缩，直到合法 | 收缩循环外，记录当前合法长度 |
| 求最短 | 最短、最小长度 | 窗口合法时记录答案并继续收缩 | 收缩循环内 |
| 求个数 | 子数组数量、满足条件的子数组数 | 窗口不合法时收缩，直到合法 | 收缩循环外，累加 `right - left + 1` |

直觉上，求最长是在保持合法的前提下尽量扩张；求最短是一旦合法就记录并尽量缩短；求个数则利用当前合法窗口边界，一次计算以 `right` 结尾的多个子数组。

### 模板一：求最长

每次把右端元素加入窗口；若窗口不合法，就不断移除左端元素，直到恢复合法，再更新最长长度。

```text
left = 0
answer = 0

for right 从 0 到 n - 1：
	将 nums[right] 加入窗口并更新状态

	while 窗口不合法：
		将 nums[left] 移出窗口并更新状态
		left += 1

	answer = max(answer, right - left + 1)
```

例：LeetCode 3「无重复字符的最长子串」。窗口状态可以用 `Set` 或字符计数 `Map` 维护；出现重复字符时收缩左边界，直到窗口内字符重新唯一。

### 模板二：求最短

右端元素加入后，只要窗口满足条件，就先记录答案，再移除左端元素，尝试缩短窗口。

```text
left = 0
answer = Infinity

for right 从 0 到 n - 1：
	将 nums[right] 加入窗口并更新状态

	while 窗口合法：
		answer = min(answer, right - left + 1)
		将 nums[left] 移出窗口并更新状态
		left += 1

如果 answer 仍为 Infinity，返回 0；否则返回 answer
```

例：LeetCode 209「长度最小的子数组」。题目中的数组元素为正数，因此扩大窗口时总和只会增加，缩小窗口时总和只会减少：

```ts
function minSubArrayLen(target: number, nums: number[]): number {
	let left = 0;
	let sum = 0;
	let answer = Infinity;

	for (let right = 0; right < nums.length; right++) {
		sum += nums[right];

		while (sum >= target) {
			answer = Math.min(answer, right - left + 1);
			sum -= nums[left];
			left++;
		}
	}

	return answer === Infinity ? 0 : answer;
}
```

### 模板三：求个数

先收缩到窗口合法。若以 `right` 结尾的窗口 `[left, right]` 合法，并且合法性在移除左端元素后仍然成立，那么起点在 `[left, right]` 之间的所有子数组也合法，共 `right - left + 1` 个。

```text
left = 0
answer = 0

for right 从 0 到 n - 1：
	将 nums[right] 加入窗口并更新状态

	while 窗口不合法：
		将 nums[left] 移出窗口并更新状态
		left += 1

	answer += right - left + 1
```

例：LeetCode 713「乘积小于 K 的子数组」。此题数组元素为正数，且 `k <= 1` 时答案为 `0`：

```ts
function numSubarrayProductLessThanK(nums: number[], k: number): number {
	if (k <= 1) return 0;

	let left = 0;
	let product = 1;
	let answer = 0;

	for (let right = 0; right < nums.length; right++) {
		product *= nums[right];

		while (product >= k) {
			product /= nums[left];
			left++;
		}

		answer += right - left + 1;
	}

	return answer;
}
```

### 写题检查清单

1. **维护什么状态？** 例如总和、乘积、字符集合、频次表或不同元素个数。
2. **合法条件是什么？** 先用一句话定义，再转成 `while` 条件。
3. **目标是最长、最短还是计数？** 这决定答案更新的位置。
4. **状态如何增删？** 右端加入和左端移出时，都要正确更新状态。
5. **窗口长度是多少？** 始终是 `right - left + 1`。

通常需要写 `while` 而不是 `if`，因为一次扩张后可能需要连续移除多个左端元素才能恢复条件。

### 适用条件与常见坑

- **先确认单调性。** 对于求最短和求个数，扩张或收缩窗口后，条件不能在左右移动时反复无规律地变化；必须能用一个边界指针完整概括合法区间。
- **含负数的和通常不能直接用滑动窗口。** 例如“和为 K 的子数组”含负数时，扩大窗口可能让和变大或变小，无法据此安全地移动左指针；通常改用前缀和加哈希表。
- **乘积模板也有前提。** LeetCode 713 的正数条件保证移除左侧元素时乘积按预期减小；有零或负数时不能直接照搬。
- **答案初值要匹配目标。** 求最长通常从 `0` 开始；求最短通常从 `Infinity` 开始，并在结束时判断是否找到答案。
- **使用 Map 记录最近位置时，左指针不能后退。** 若字符上次出现位置为 `pos`，只有 `pos >= left` 时才需要更新 `left = pos + 1`，否则旧位置已不在当前窗口内。

### 延伸：恰好 K 个不同元素

“恰好有 K 个不同元素”的子数组数，可以转化为两个“至多”问题之差：

$$
\mathrm{exactly}(K) = \mathrm{atMost}(K) - \mathrm{atMost}(K-1)
$$

“至多 K 个不同元素”可以用模板三计数，再做两次相减。典型题目是 LeetCode 992「K 个不同整数的子数组」。

### 与固定长度窗口对比

| 对比项 | 固定长度窗口 | 可变长度窗口 |
| --- | --- | --- |
| 窗口长度 | 固定为 `k` | 随合法条件变化 |
| 左指针 | 通常随右指针按 `right - k + 1` 移动 | 由 `while` 条件决定 |
| 典型题目 | 长度为 `k` 的平均值、固定长度子串统计 | 无重复字符最长子串、最短子数组、满足条件的子数组计数 |

可以分别练习 LeetCode 3、209 和 713，熟悉最长、最短、计数三种答案更新方式。

## 二叉树 BFS 层序遍历

层序遍历按照从上到下、从左到右的顺序访问节点。核心是用队列先进先出：先放入根节点，每次处理当前层的所有节点，并把它们的孩子放入下一层。

### 核心步骤

1. 根节点入队；空树直接返回空结果。
2. 每轮开始时记录当前层的节点数 `size`。
3. 只处理这 `size` 个节点，将节点值加入本层结果，并把非空孩子加入下一层。
4. 当前层处理完后，将这一层的结果加入总结果。

**关键是先固定 `size`。** 处理过程中会把下一层节点加入队列；如果直接循环到队列变空，层与层的边界就会混在一起。

### TypeScript 实现

下面用 `currentLevel` 和 `nextLevel` 表示队列中的当前层与下一层，避免使用 `Array.shift()`：

```ts
function levelOrder(root: TreeNode | null): number[][] {
	if (root === null) return [];

	const result: number[][] = [];
	let currentLevel: TreeNode[] = [root];

	while (currentLevel.length > 0) {
		const size = currentLevel.length;
		const level: number[] = [];
		const nextLevel: TreeNode[] = [];

		for (let index = 0; index < size; index++) {
			const node = currentLevel[index];
			level.push(node.val);

			if (node.left !== null) nextLevel.push(node.left);
			if (node.right !== null) nextLevel.push(node.right);
		}

		result.push(level);
		currentLevel = nextLevel;
	}

	return result;
}
```

### 手动模拟

对于根节点为 `3`、左右孩子为 `9` 和 `20`，且 `20` 的孩子为 `15` 和 `7` 的二叉树：

| 轮次 | 当前层 | `size` | 收集结果 | 下一层 |
| --- | --- | ---: | --- | --- |
| 1 | `[3]` | 1 | `[3]` | `[9, 20]` |
| 2 | `[9, 20]` | 2 | `[9, 20]` | `[15, 7]` |
| 3 | `[15, 7]` | 2 | `[15, 7]` | `[]` |

最终结果是 `[[3], [9, 20], [15, 7]]`。

### 复杂度与注意事项

- 时间复杂度：$O(N)$，每个节点访问一次。
- 辅助空间：$O(W)$，`W` 是树的最大宽度；返回的结果本身占 $O(N)$ 空间。
- 直接用数组 `shift()` 出队可能需要移动其余元素，导致实现的总时间复杂度退化；可改用队首下标，或像上例一样分层维护两个数组。
- `queue.shift()!` 中的 `!` 是 TypeScript 非空断言，表示程序员确认该处取出的值非空；它只影响类型检查，不会在运行时做额外检查。

### DFS 也可以按层收集

递归 DFS 传入当前深度，把节点值追加到对应的层数组中：

```ts
function levelOrderDfs(root: TreeNode | null): number[][] {
	const result: number[][] = [];

	function dfs(node: TreeNode | null, depth: number): void {
		if (node === null) return;
		if (result.length === depth) result.push([]);

		result[depth].push(node.val);
		dfs(node.left, depth + 1);
		dfs(node.right, depth + 1);
	}

	dfs(root, 0);
	return result;
}
```

先递归左子树、再递归右子树，可使每一层仍按从左到右的顺序收集。BFS 更直接体现层序访问；DFS 则展示了如何用深度把节点分组。DFS 的递归调用栈空间为 $O(H)$，其中 $H$ 是树高。

## 深度优先搜索（DFS）

DFS（Depth-First Search，深度优先搜索）是一种遍历或搜索树、图的方式。核心思路是：**沿一条路尽可能深入，走不下去时回到最近的岔路口，再探索其他方向。**

在树上，递归自然形成深入再返回的过程；在图上，因为可能存在环或重复路径，必须用 `visited` 记录已访问节点，避免重复遍历。

### 递归实现

下面按邻接表遍历图。访问顺序取决于邻居在邻接表中的顺序：

```ts
function dfsRecursive(graph: Map<number, number[]>, start: number): number[] {
	const visited = new Set<number>();
	const order: number[] = [];

	function visit(node: number): void {
		visited.add(node);
		order.push(node);

		for (const neighbor of graph.get(node) ?? []) {
			if (!visited.has(neighbor)) visit(neighbor);
		}
	}

	visit(start);
	return order;
}
```

### 显式栈实现

递归隐式使用系统调用栈，也可以自己维护一个栈。逆序压入邻居，可让出栈访问顺序与递归版本相匹配：

```ts
function dfsIterative(graph: Map<number, number[]>, start: number): number[] {
	const visited = new Set<number>();
	const order: number[] = [];
	const stack = [start];

	while (stack.length > 0) {
		const node = stack.pop()!;
		if (visited.has(node)) continue;

		visited.add(node);
		order.push(node);

		const neighbors = graph.get(node) ?? [];
		for (let index = neighbors.length - 1; index >= 0; index--) {
			if (!visited.has(neighbors[index])) stack.push(neighbors[index]);
		}
	}

	return order;
}
```

迭代版可能把尚未出栈的同一节点重复压栈，但出栈时的 `visited` 检查会跳过重复项。若在入栈时就标记访问，可以避免重复入栈，但可能改变具体的访问顺序。

### 示例与复杂度

对于 `1: [2, 3]`、`2: [1, 4, 5]`、`3: [1]`、`4: [2]`、`5: [2]`，从 `1` 开始按邻接表顺序递归访问：

```text
1 -> 2 -> 4 -> 回到 2 -> 5 -> 回到 1 -> 3
```

邻接表表示下，完整遍历所有顶点和边的时间复杂度为 $O(V+E)$。`visited` 和递归栈/显式栈最坏都可能占用 $O(V)$ 空间。若图不连通，从单个起点只能访问其所在连通部分；遍历整张图时，需要再循环所有未访问的顶点。

### 常见用途与注意事项

- 判断可达性、统计连通分量。
- 路径搜索、迷宫和网格 Flood Fill，例如岛屿数量。
- 检测环或拓扑排序；需结合访问状态、递归栈、父节点或入度等规则，不能仅凭一个 `visited` 集合判断所有类型的环。
- 回溯问题（全排列、子集、N 皇后）可看作在解空间树上做 DFS。递归选择后要在返回时撤销选择、恢复现场；这类搜索通常不以全局 `visited` 代替路径状态。
- 递归过深可能导致调用栈溢出；深链图或很深的树可考虑显式栈实现。

### DFS 与 BFS 对比

| 对比项 | DFS | BFS |
| --- | --- | --- |
| 主要结构 | 递归调用栈或显式栈 | 队列 |
| 搜索方式 | 沿路径深入，再回溯 | 按层或距离逐步扩展 |
| 无权图最短路径 | 不保证最短 | 可得到最少边数路径 |
| 树上的辅助空间 | 递归栈约为 $O(H)$ | 队列约为 $O(W)$ |

其中 $H$ 是树高，$W$ 是最大层宽；一般图中二者最坏都可能需要 $O(V)$ 的辅助空间。

## 回溯三大模板：子集、排列与组合
## 栈的三类常用模板

栈遵循**后进先出**（LIFO）：最后放入的元素最先取出。括号匹配、辅助栈和单调栈看起来不同，核心区别在于何时入栈、何时出栈，以及出栈时要做什么。

### 一、基础栈：匹配与嵌套

遇到“最近打开的结构要先关闭”的问题，用栈保存尚未匹配的开始符号。以 LeetCode 20「有效的括号」为例：

```ts
function isValid(s: string): boolean {
	const stack: string[] = [];
	const openingFor: Record<string, string> = {
		")": "(",
		"]": "[",
		"}": "{",
	};

	for (const char of s) {
		if (char === "(" || char === "[" || char === "{") {
			stack.push(char);
		} else {
			if (stack.pop() !== openingFor[char]) return false;
		}
	}

	return stack.length === 0;
}
```

口诀：**左括号入栈，右括号必须匹配栈顶，最后栈要空。** 最后的空栈检查不能省略，否则像 `"(("` 这样的输入会被误判。

### 二、辅助栈：同步维护附加信息

当题目要求在栈操作的同时，以 $O(1)$ 查询“当前栈中的最小值”，可以用辅助栈记录每一层对应的最小值。LeetCode 155「最小栈」：

```ts
class MinStack {
	private values: number[] = [];
	private minimums: number[] = [];

	push(value: number): void {
		this.values.push(value);
		const currentMin = this.minimums[this.minimums.length - 1];
		this.minimums.push(currentMin === undefined ? value : Math.min(value, currentMin));
	}

	pop(): void {
		this.values.pop();
		this.minimums.pop();
	}

	top(): number {
		return this.values[this.values.length - 1];
	}

	getMin(): number {
		return this.minimums[this.minimums.length - 1];
	}
}
```

主栈保存实际值，辅助栈保存“到当前层为止的最小值”。两栈在 `push` 和 `pop` 时同步变化，因此 `getMin` 只需读取辅助栈顶。以上方法假定调用方不会对空栈执行 `pop`、`top` 或 `getMin`。

### 三、单调栈：寻找下一个更大或更小元素

单调栈在栈中维护单调顺序。栈里的元素（更常用的是下标）代表“还在等待答案”的位置；当新元素使栈顶的答案确定时，就弹出并记录。

LeetCode 496「下一个更大元素 I」的核心可用下标模板表示：

```ts
function nextGreaterElements(nums: number[]): number[] {
	const answer = new Array<number>(nums.length).fill(-1);
	const stack: number[] = []; // 存放还没有找到下一个更大值的下标

	for (let index = 0; index < nums.length; index++) {
		while (
			stack.length > 0 &&
			nums[index] > nums[stack[stack.length - 1]]
		) {
			const waitingIndex = stack.pop()!;
			answer[waitingIndex] = nums[index];
		}

		stack.push(index);
	}

	return answer;
}
```

新元素大于栈顶对应值时，它就是该位置右侧第一个更大的元素；连续弹栈直到顺序恢复，再把新下标入栈。遍历结束后仍留在栈中的位置没有找到答案，默认值保持 `-1`。LeetCode 496 还需要根据元素值把结果映射到 `nums1`，上述函数展示的是单调栈核心。

| 要找的元素 | 栈底到栈顶的趋势 | 新元素到来时的弹出条件 |
| --- | --- | --- |
| 右侧第一个更大值 | 递减（允许相等） | `current > top` |
| 右侧第一个更小值 | 递增（允许相等） | `current < top` |
| 左侧第一个更大值 | 从左向右扫描，弹出 `<= current` 后看栈顶 | `top <= current` |
| 左侧第一个更小值 | 从左向右扫描，弹出 `>= current` 后看栈顶 | `top >= current` |

若要找严格“大于/小于”，相等元素是否弹出必须按题意处理；比较符号的严格与否会影响重复值的答案。

### 常见变形

- **存下标**：除值以外还能计算距离，例如 LeetCode 739「每日温度」用 `currentIndex - previousIndex`。
- **循环数组**：遍历 `2n` 次并用 `index % n` 取值；通常只在第一次遍历时把下标入栈，避免重复压入。
- **接雨水、柱状图最大矩形**：弹出栈顶时，利用当前下标和新的栈顶计算宽度；空栈时需要单独处理左边界。
- **每个元素最多入栈、出栈一次**：单调栈整体通常为 $O(n)$ 时间、$O(n)$ 空间。

### 三类栈的对比与检查点

| 类型 | 核心作用 | 何时入栈 | 何时出栈 | 代表题 |
| --- | --- | --- | --- | --- |
| 基础栈 | 后进先出地匹配嵌套结构 | 遇到开始符号 | 遇到结束符号 | 20 有效的括号 |
| 辅助栈 | 同步保存当前状态的附加统计值 | 主栈每次入栈 | 主栈每次出栈 | 155 最小栈 |
| 单调栈 | 等待并确定左右第一个更大/更小元素 | 新元素处理完待决元素后 | 新元素使栈顶答案确定时 | 496、739、503 |

易错点：

1. 括号匹配后还要检查栈是否为空。
2. 查看栈顶用 `stack[stack.length - 1]`；`pop()` 会移除元素。
3. 单调栈通常需要 `while`，一个新元素可能连续解决多个旧元素。
4. 栈中剩余下标表示没有找到对应答案，要按题意保留 `-1`、`0` 或其他默认值。
5. 空栈调用 `pop()` 会得到 `undefined`；先判空，或在已证明非空时使用 TypeScript 非空断言。

### 什么时候考虑栈

- 有括号匹配、嵌套结构或“最近未处理项” → 基础栈。
- 需要在栈变化时常数时间查询当前最值等统计量 → 辅助栈。
- 要求下一个/上一个更大或更小元素 → 单调栈。
- 递归搜索需要改成迭代，或需要显式保存待处理状态 → 显式栈，例如 DFS。

一句话：**栈的核心是“最近的先处理”；不同模板只是入栈、出栈时机和出栈动作不同。**

## 回溯三大模板：子集、排列与组合

子集、排列和组合都可以看作在一棵“解空间树”上做 DFS。每一层代表一次选择，`path` 保存当前选择，递归探索后要撤销选择，以便尝试其他分支。

通用步骤是：**做选择 → 递归 → 撤销选择**。收集结果时要复制 `path`（如 `[...path]`），因为之后的递归还会继续修改它。

```ts
const result: number[][] = [];
const path: number[] = [];

function backtrack(/* 当前可选范围或其他状态 */): void {
	if (/* 满足收集条件 */) {
		result.push([...path]);
		// 是否 return 取决于题目；有些题还需要继续扩展当前解
	}

	for (/* 遍历当前可选项 */) {
		path.push(/* 做选择 */);
		backtrack(/* 更新选择范围或状态 */);
		path.pop(); // 撤销选择，恢复现场
	}
}
```

### 一、子集：每个节点都收集

LeetCode 78「子集」中，`[1, 2]` 与 `[2, 1]` 是同一个子集，所以用 `start` 让选择下标只向前推进，避免重复。每条路径本身都是一个子集，因此一进入递归就收集，包括空集：

```ts
function subsets(nums: number[]): number[][] {
	const result: number[][] = [];
	const path: number[] = [];

	function backtrack(start: number): void {
		result.push([...path]);

		for (let index = start; index < nums.length; index++) {
			path.push(nums[index]);
			backtrack(index + 1);
			path.pop();
		}
	}

	backtrack(0);
	return result;
}
```

### 二、排列：每个位置从所有未使用元素中选择

LeetCode 46「全排列」中，顺序有意义，`[1, 2, 3]` 和 `[3, 2, 1]` 是不同答案。每一层都从下标 `0` 开始检查，用 `used` 标记当前路径中已使用的元素；只有 `path` 长度达到 `n` 时才收集：

```ts
function permute(nums: number[]): number[][] {
	const result: number[][] = [];
	const path: number[] = [];
	const used = new Array<boolean>(nums.length).fill(false);

	function backtrack(): void {
		if (path.length === nums.length) {
			result.push([...path]);
			return;
		}

		for (let index = 0; index < nums.length; index++) {
			if (used[index]) continue;

			used[index] = true;
			path.push(nums[index]);
			backtrack();
			path.pop();
			used[index] = false;
		}
	}

	backtrack();
	return result;
}
```

### 三、组合：只收集长度为 `k` 的路径

LeetCode 77「组合」中，从 `1..n` 选 `k` 个数，顺序不重要，因此和子集一样使用 `start`；但只在路径长度恰好为 `k` 时收集：

```ts
function combine(n: number, k: number): number[][] {
	const result: number[][] = [];
	const path: number[] = [];

	function backtrack(start: number): void {
		if (path.length === k) {
			result.push([...path]);
			return;
		}

		for (let value = start; value <= n; value++) {
			path.push(value);
			backtrack(value + 1);
			path.pop();
		}
	}

	backtrack(1);
	return result;
}
```

还可以剪枝：如果剩余可选数字数量不足以补齐 `k` 个，就不必继续递归。循环上界可以写成 `n - (k - path.length) + 1`。

### 三种模板对比

| 对比项 | 子集 | 排列 | 组合 |
| --- | --- | --- | --- |
| 顺序是否有影响 | 无 | 有 | 无 |
| 防止重复的方式 | `start`，只向后选 | `used`，每层从头检查未使用项 | `start`，只向后选 |
| 收集时机 | 每次进入节点都收集 | `path.length === n` | `path.length === k` |
| 递归状态 | 下一轮从 `index + 1` 开始 | 共享并回滚 `used` | 下一轮从 `value + 1` 开始 |

记忆方式：**顺序无关，用 `start`；顺序有关，用 `used`。子集是所有长度的组合，因此每个节点都收集。**

### 常见变形

#### 有重复元素：先排序，再跳过同一层的重复选择

对于子集和组合，排序后在同一递归层跳过重复值：

```ts
nums.sort((a, b) => a - b);

for (let index = start; index < nums.length; index++) {
	if (index > start && nums[index] === nums[index - 1]) continue;
	// 做选择、递归、撤销选择
}
```

排列的去重条件不同。LeetCode 47「全排列 II」中，排序后若前一个相同元素还没有在当前路径使用，就跳过当前元素，避免同一层用相同值开出重复分支：

```ts
if (index > 0 && nums[index] === nums[index - 1] && !used[index - 1]) {
	continue;
}
```

组合/子集条件中的 `index > start`，和排列条件中的 `!used[index - 1]` 不能互换：前者判断是否处于同一递归层，后者判断相同元素是否已由当前路径的上一层使用。

#### 组合总和：元素可以重复选

如果当前元素允许再次使用，递归时传 `index` 而不是 `index + 1`；如果候选值已排序且都是正数，当候选值大于剩余目标时可以停止循环。若数组允许负数，这个剪枝就不成立。

#### 其他选择型回溯

- **目标和组合**：把剩余目标或当前总和作为递归状态，达到目标时收集；是否能用超出目标剪枝，取决于候选数值范围。
- **电话号码字母组合、括号生成**：沿用同一套“选择、递归、撤销”骨架，只是每一步的可选项由题目状态决定。

### 经典例题：39 组合总和与 17 电话号码字母组合

#### LeetCode 39：组合总和

候选数字互不相同且都是正数，每个数字可以重复选择，找出所有和为 `target` 的不同组合。它是“组合模板 + 剩余目标 `remain`”的结合：用 `start` 限制只向后选，递归时传当前下标 `index`，让当前数字可以再次使用。

```ts
function combinationSum(candidates: number[], target: number): number[][] {
	const sortedCandidates = [...candidates].sort((a, b) => a - b);
	const result: number[][] = [];
	const path: number[] = [];

	function backtrack(start: number, remain: number): void {
		if (remain === 0) {
			result.push([...path]);
			return;
		}

		for (let index = start; index < sortedCandidates.length; index++) {
			const candidate = sortedCandidates[index];
			if (candidate > remain) break;

			path.push(candidate);
			backtrack(index, remain - candidate);
			path.pop();
		}
	}

	backtrack(0, target);
	return result;
}
```

要点：

- `start` 避免把 `[2, 3]` 和 `[3, 2]` 当成不同组合。
- 递归传 `index` 表示当前数字可重复使用；传 `index + 1` 才表示只能使用一次。
- 用 `remain` 逐层更新剩余目标，避免每次重新计算 `path` 的总和。
- 候选数为正且排序后，`candidate > remain` 时后续数也都更大，可以直接 `break`。
- 正数条件保证每次递归都会减小 `remain`；不剪枝通常仍会结束，但会探索大量无效分支。若允许重复选择 `0` 或负数，必须重新设计终止条件，否则递归可能无法结束。

常见错误：循环从 `0` 开始会重复生成不同排列；递归传 `start + 1` 会错误地禁止重复选择；用 `start` 而不是当前 `index` 递归，也会让状态更新错误。

#### LeetCode 17：电话号码的字母组合

数字串的每个位置都有自己的字母候选集。这里不是从一个全局候选数组中组合，而是按 `index` 一层层处理当前数字对应的字母：

```ts
function letterCombinations(digits: string): string[] {
	if (digits.length === 0) return [];

	const letters: Record<string, string> = {
		"2": "abc",
		"3": "def",
		"4": "ghi",
		"5": "jkl",
		"6": "mno",
		"7": "pqrs",
		"8": "tuv",
		"9": "wxyz",
	};

	const result: string[] = [];
	const path: string[] = [];

	function backtrack(index: number): void {
		if (index === digits.length) {
			result.push(path.join(""));
			return;
		}

		for (const letter of letters[digits[index]]) {
			path.push(letter);
			backtrack(index + 1);
			path.pop();
		}
	}

	backtrack(0);
	return result;
}
```

例如 `"23"` 会生成 `"ad"`、`"ae"`、`"af"`、`"bd"` 等组合。题目保证数字在 `2` 到 `9` 之间；空字符串需要提前返回 `[]`。每层候选集由当前数字决定，所以不需要 `start` 或 `used`。

### 两题与回溯参数的选择

| 对比项 | 39 组合总和 | 17 电话号码字母组合 |
| --- | --- | --- |
| 当前层候选 | 同一个已排序数组，从 `start` 开始 | 当前数字对应的字母集合 |
| 递归参数 | `start`、`remain` | 位置 `index` |
| 下一层范围 | 传 `index`，允许重复选当前数 | 传 `index + 1`，处理下一个数字 |
| 收集条件 | `remain === 0` | `index === digits.length` |
| 空输入 | 由题目约束决定 | 返回 `[]`，不是 `[""]` |

可以把回溯的选择范围记成四种常见状态：

- 顺序无关、每个元素最多用一次：用 `start`，递归传 `index + 1`。
- 顺序无关、元素可以重复用：用 `start`，递归传 `index`。
- 顺序有关、每个元素最多用一次：每层从头检查，用 `used`。
- 每层候选集不同：用 `index` 指向当前层，递归传 `index + 1`。

### 练习顺序

可以按 `78 子集 → 46 全排列 → 77 组合 → 39 组合总和 → 90 子集 II → 47 全排列 II` 练习。重点是能解释：为什么顺序无关时使用 `start`，为什么排列需要 `used`，以及每类题目应该在什么时候收集结果。

## 单题记录模板

### 题号 - 题目名称

- 日期：
- 链接：
- 难度：
- 标签：
- 状态：

#### 题意

用自己的话概括问题，并记下输入、输出和关键约束。

#### 思路

记录从题目约束推导到解法的过程，以及关键观察。

#### 正确性

说明为什么这个做法能覆盖所有情况；必要时记录边界条件。

#### 复杂度

- 时间：
- 空间：

#### 易错点与复盘

记录第一次卡住的地方、容易遗漏的情况，以及下次重做时要记住的关键点。

#### 代码

```text
在这里记录通过的代码，注明使用的语言。
```