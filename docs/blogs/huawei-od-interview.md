# 我的华为 OD 面试记录

根据现有代码整理，题目按面试轮次归档；未记录具体面试时间或其他面试过程。

## 一面：合并区间

### 题目

给定若干个区间 `intervals[i] = [start, end]`，合并所有重叠区间，并返回覆盖输入中所有区间且互不重叠的区间数组。

例如：

```text
输入：[[1, 3], [2, 6], [8, 10], [15, 18]]
输出：[[1, 6], [8, 10], [15, 18]]
```

端点相接也视为重叠，例如 `[1, 4]` 和 `[4, 5]` 合并为 `[1, 5]`。

### 思路

1. 按区间起点升序排序。
2. 维护结果数组中的最后一个区间。
3. 如果当前区间的起点不大于最后一个区间的终点，就扩展最后一个区间的终点；否则将当前区间加入结果。

排序后，只需检查结果中的最后一个区间，因为更早的区间都已经处理完毕。

### JavaScript 解法

```js
function merge(intervals = []) {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const result = [[...sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = result[result.length - 1];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      result.push([...current]);
    }
  }

  return result;
}
```

### 复杂度与注意点

- 时间复杂度：`O(n log n)`，主要来自排序。
- 空间复杂度：`O(n)`，结果数组及排序副本占用空间。
- 使用 `<=` 判断，因此端点相接的区间会合并。
- 先复制输入再排序，避免修改调用方传入的数组。
- 空数组返回 `[]`。

## 二面：字符串解码

### 题目

编码字符串遵循 `k[encoded_string]` 规则，表示括号内的字符串重复 `k` 次。支持嵌套，例如：

```text
输入：3[a2[c]]
输出：accaccacc
```

题目保证输入格式有效，数字只表示重复次数。

### 思路

使用栈保存进入每层括号前的状态：

- `count`：当前正在读取的重复次数，逐位累积以支持多位数字。
- `current`：当前层已解码的字符串。
- 遇到 `[` 时，把重复次数和当前字符串压栈，并开始处理括号内的新一层。
- 遇到 `]` 时，弹出上一层状态，将当前字符串重复指定次数后接回上一层。
- 遇到字母时，追加到当前字符串。

### JavaScript 解法

```js
function decodeString(s) {
  const stack = [];
  let current = "";
  let count = 0;

  for (const char of s) {
    if (char >= "0" && char <= "9") {
      count = count * 10 + Number(char);
    } else if (char === "[") {
      stack.push([count, current]);
      count = 0;
      current = "";
    } else if (char === "]") {
      const [repeat, previous] = stack.pop();
      current = previous + current.repeat(repeat);
    } else {
      current += char;
    }
  }

  return current;
}
```

### 复杂度与注意点

- 设输入长度为 `n`，解码结果长度为 `m`：时间复杂度为 `O(n + m)`，空间复杂度为 `O(n + m)`。
- 重复次数需要逐位累积，不能只读取单个数字字符，例如 `11[a]`。
- 栈保存每层括号前的字符串和重复次数，因此可以处理嵌套结构。
- 解码结果可能远大于输入，空间开销会随结果长度增长。

## 来源

- 一面：`test.js`
- 二面：`test1.js`
