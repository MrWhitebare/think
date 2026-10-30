---
title: JavaScript 面试题记录
lang: zh
---

# JavaScript 面试题记录

记录 JavaScript 面试中常见的基础概念和代码题，方便复习时快速回顾。

## 一、`this` 的指向如何确定？

普通函数的 `this` 由**调用方式**决定，不是由函数定义的位置决定。判断时可以按下面的规则：

1. **`new` 调用**：`new Fn()` 中，`this` 指向新创建的实例。
2. **显式指定**：`call`、`apply` 立即调用函数并指定 `this`；`bind` 返回一个绑定了 `this` 的新函数。
3. **方法调用**：`obj.fn()` 中，`this` 指向调用方法的对象 `obj`。看调用表达式中函数前面的对象，而不是方法定义在哪个对象上。
4. **普通函数调用**：`fn()` 没有明确接收者。严格模式下 `this` 是 `undefined`；非严格模式下 `null` / `undefined` 会指向全局对象。

对普通函数来说，常见优先级可以记为：**`new` > 显式绑定 > 隐式绑定 > 默认绑定**。箭头函数是例外：它没有自己的 `this`，而是使用定义时外层作用域的 `this`，`call`、`apply`、`bind` 都不能改变它。

```js
const user = {
  name: 'Lin',
  say() {
    return this.name;
  },
  sayLater() {
    setTimeout(() => {
      console.log(this.name); // Lin
    }, 0);
  },
};

user.say(); // "Lin"：方法调用，this 是 user
const say = user.say;
say(); // 严格模式下是 undefined；非严格模式下 this 是全局对象
```

### `call`、`apply`、`bind` 有什么区别？

它们都可以显式指定普通函数调用时的 `this`，区别在于参数传递方式和调用时机：

- `call(thisArg, arg1, arg2, ...)`：立即调用，参数逐个传入。
- `apply(thisArg, [arg1, arg2, ...])`：立即调用，参数以数组或类数组形式传入。
- `bind(thisArg, arg1, ...)`：不立即调用，而是返回一个绑定了 `this` 和部分参数的新函数；之后调用新函数时再传入剩余参数。

```js
function introduce(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const user = { name: 'Lin' };

introduce.call(user, '你好', '!'); // "你好, Lin!"
introduce.apply(user, ['你好', '!']); // "你好, Lin!"

const greetLin = introduce.bind(user, '你好');
greetLin('!'); // "你好, Lin!"
```

注意：箭头函数没有自己的 `this`，所以 `call`、`apply` 和 `bind` 都不能改变箭头函数的 `this`。

#### 常见易错点

**方法被取出后，调用方式变了，`this` 也可能改变。**需要保留对象作为接收者时，可以用 `bind`：

```js
const user = {
  name: 'Lin',
  say() {
    return this.name;
  },
};

const boundSay = user.say.bind(user);
boundSay(); // "Lin"
```

**`bind` 的绑定通常不能被后续 `call` / `apply` 覆盖；但用 `new` 调用绑定函数时，`this` 指向新实例。**原函数若可构造，绑定函数也可用作构造函数：

```js
function Person(name) {
  this.name = name;
}

const BoundPerson = Person.bind({ name: '忽略的对象' }, 'Lin');
const person = new BoundPerson();
person.name; // "Lin"
person instanceof Person; // true
```

**箭头函数不会因对象方法语法而自动绑定到该对象。**下面的箭头函数使用外层作用域的 `this`，而不是 `user`：

```js
const user = {
  name: 'Lin',
  say: () => this.name,
};
```

因此，需要动态接收者的方法通常使用普通方法语法；需要继承外层 `this` 的回调则常用箭头函数。

## 二、`==` 和 `===` 有什么区别？

- `===` 比较类型和值，不进行隐式类型转换。
- `==` 在比较前可能进行类型转换，容易产生不直观的结果。
- 对象比较的是引用是否相同，而不是对象内容是否相同。

```js
0 == false; // true
0 === false; // false

({}) === ({}); // false：两个对象是不同引用
```

一般使用 `===`。需要判断 `null` 或 `undefined` 两者之一时，`value == null` 是少数有意使用宽松相等的场景。

## 三、`typeof null` 为什么是 `"object"`？

这是 JavaScript 的历史兼容行为，不能用它判断 `null`。可以使用严格相等：

```js
typeof null; // "object"
value === null; // 正确判断 null
Array.isArray(value); // 判断数组
```

## 四、防抖和节流有什么区别？

- **防抖**：在事件触发后，等待一段时间再执行回调。
- **节流（throttle）**：限制执行频率，在一段时间内最多执行一次。适用于滚动、拖动等高频事件。

简单的尾缘防抖实现：

```js
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

实际使用时还要明确是否需要首次立即执行、如何取消定时器，以及是否保留最后一次调用。

## 五、ES Module 的 `import` 和 CommonJS 的 `require` 有什么区别？

- ES Module 使用 `import` / `export`，语法是静态的，模块依赖通常可以在编译阶段分析；导入的是绑定，导出值更新后，导入方读取到的值也会反映更新。
- CommonJS 使用 `require` / `module.exports`，常见于 Node.js；`require` 在运行时加载模块，导出对象通常通过值或对象引用传递。
- 两套模块系统的加载机制、互操作和适用环境并不完全相同，项目中应遵循其运行时和构建工具的配置。

## 面试回答建议

回答概念题时，可以按“定义、机制、示例、使用场景或注意点”的顺序组织。遇到输出题，先逐行分析同步代码，再标出任务队列与变量状态，通常比直接猜结果更可靠。

## 六、JavaScript 基本数据类型有哪些？如何判断变量类型？重点介绍 `Symbol`

### 基本数据类型

JavaScript 有七种基本数据类型（原始类型）：

- `string`：字符串
- `number`：数字，包括整数、浮点数，以及 `NaN`、`Infinity`
- `bigint`：任意精度整数，字面量通常以 `n` 结尾
- `boolean`：布尔值，`true` 或 `false`
- `undefined`：尚未赋值的值
- `null`：表示有意设置的空值
- `symbol`：唯一且不可变的标识值

除基本类型外，其余值都是对象类型，包括普通对象、数组、函数、日期等。基本类型的值不可变；变量重新赋值是让变量指向另一个值，并非修改原来的基本值。

### 常见的类型判断方式

#### `typeof`

适合判断大多数基本类型：

```js
typeof 'hello'; // "string"
typeof 42; // "number"
typeof 1n; // "bigint"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof Symbol('id'); // "symbol"
typeof function () {}; // "function"
```

需要注意两个常见例外：

```js
typeof null; // "object"，这是历史遗留行为
typeof []; // "object"
```

因此，判断 `null` 应使用 `value === null`；判断数组应使用 `Array.isArray(value)`。

#### `Array.isArray`

专门判断数组，比 `instanceof Array` 更可靠，尤其适用于跨 `iframe` 等不同 JavaScript 执行环境创建的数组。

```js
Array.isArray([]); // true
Array.isArray({}); // false
```

#### `instanceof`

检查构造函数的 `prototype` 是否出现在对象的原型链上，常用于判断对象所属的类，但不适用于基本类型，也可能受跨执行环境影响。

```js
[] instanceof Array; // true
new Date() instanceof Date; // true
```

#### `Object.prototype.toString`

可以辅助区分多种内置对象：

```js
Object.prototype.toString.call(null); // "[object Null]"
Object.prototype.toString.call([]); // "[object Array]"
Object.prototype.toString.call(new Date()); // "[object Date]"
```

多数情况下，它比单独使用 `typeof` 能提供更多内置信息；但 `Symbol.toStringTag` 可以定制对象显示的标签，所以不应把它视为对所有对象都不可伪造的类型证明。

### `Symbol` 的特点

调用 `Symbol()` 会创建一个新的、唯一的 Symbol 值。即使描述相同，创建出的 Symbol 也不相等：

```js
const first = Symbol('id');
const second = Symbol('id');

first === second; // false
typeof first; // "symbol"
```

`Symbol` 不能通过 `new` 调用；描述文字只用于调试，不参与唯一性判断。

### `Symbol` 的常见用途

#### 作为对象属性键，减少命名冲突

不同模块可以各自创建 Symbol 属性键，不会因为使用相同的字符串属性名而意外覆盖：

```js
const internalId = Symbol('id');
const user = {
  name: 'Lin',
  [internalId]: 123,
};

user[internalId]; // 123
```

Symbol 键不会出现在 `Object.keys`、`Object.getOwnPropertyNames` 或 `JSON.stringify` 的结果中，但它并非真正私有：可以通过 `Object.getOwnPropertySymbols` 或 `Reflect.ownKeys` 找到。

```js
Object.keys(user); // ["name"]
Object.getOwnPropertySymbols(user); // [Symbol(id)]
Reflect.ownKeys(user); // ["name", Symbol(id)]
JSON.stringify(user); // '{"name":"Lin"}'
```

需要语言级私有字段时，应考虑使用 `#field`；Symbol 属性主要用于唯一键和协议定制，不是安全边界。

#### `Symbol.for`：在全局 Symbol 注册表中共享键

`Symbol.for(key)` 会先查询全局 Symbol 注册表：存在则返回已有 Symbol，不存在则创建并注册。相同 key 会得到同一个 Symbol；`Symbol.keyFor` 可以查询通过 `Symbol.for` 注册的 key。

```js
const sharedA = Symbol.for('app.shared');
const sharedB = Symbol.for('app.shared');

sharedA === sharedB; // true
Symbol.keyFor(sharedA); // "app.shared"
```

与此不同，`Symbol('app.shared')` 每次都会创建新的 Symbol，不会自动加入全局注册表。

#### 内置 well-known Symbols：定制语言行为

JavaScript 提供了一组内置 Symbol，让对象能够参与特定语言协议。例如，`Symbol.iterator` 用于定义对象的迭代行为，`Symbol.toPrimitive` 用于定制对象转换为原始值时的行为。

```js
const range = {
  from: 1,
  to: 3,
  *[Symbol.iterator]() {
    for (let value = this.from; value <= this.to; value++) {
      yield value;
    }
  },
};

[...range]; // [1, 2, 3]
```

### 面试要点总结

1. `typeof` 判断 Symbol 返回 `"symbol"`，但判断 `null` 和数组时要特别处理。
2. `Symbol()` 每次都会创建唯一值；相同描述不代表相等。
3. `Symbol.for()` 使用全局注册表，相同 key 会返回同一个 Symbol。
4. Symbol 属性可以降低属性名冲突，但不是私有字段，也不是安全机制。
5. `Symbol.iterator` 等 well-known Symbols 可以让对象实现 JavaScript 内置协议。

## 七、`null` 和 `undefined` 有什么区别？

两者都表示“没有可用的值”，但语义不同：

- `undefined` 通常表示值尚未提供或尚未初始化，例如已声明但未赋值的变量、未传入的函数参数，或对象中不存在的属性。
- `null` 通常表示开发者有意设置的“空值”，用来明确表示当前没有对象或值。

```js
let value;
console.log(value); // undefined：声明了，但还没有赋值

const user = { name: 'Lin' };
console.log(user.age); // undefined：属性不存在

user.age = null; // 明确表示 age 当前为空
```

### 如何判断？

推荐使用严格相等分别判断：

```js
value === undefined;
value === null;
```

历史原因导致 `typeof null` 返回 `"object"`，而 `typeof undefined` 返回 `"undefined"`，所以不能用 `typeof` 正确地区分 `null` 和对象。

```js
typeof null; // "object"
typeof undefined; // "undefined"
```

宽松相等会把两者视为相等，但不会把它们与其他值混为一谈：

```js
null == undefined; // true
null === undefined; // false
```

因此，`value == null` 可以作为一种简写，同时判断值是 `null` 或 `undefined`；如果希望代码语义更明确，分别使用 `=== null` 和 `=== undefined`。

### 常见场景区别

- **默认参数**：只有参数值为 `undefined` 或未传入时，才会使用默认值；传入 `null` 不会触发默认值。
- **JSON 序列化**：对象属性值为 `undefined` 时会被忽略，值为 `null` 时会保留；数组中的 `undefined` 会序列化为 `null`。

```js
function greet(name = '访客') {
  return name;
}

greet(); // "访客"
greet(undefined); // "访客"
greet(null); // null

JSON.stringify({ a: undefined, b: null }); // '{"b":null}'
JSON.stringify([undefined, null]); // '[null,null]'
```

简单记忆：`undefined` 多表示“没有赋值/没有提供”，`null` 多表示“有意设置为空”。实际项目中应根据接口和业务约定统一使用方式。

## 八、如何判断一个变量是否是正则表达式？

在同一个 JavaScript 执行环境中，通常使用 `instanceof RegExp`：

```js
const pattern = /hello/i;

pattern instanceof RegExp; // true
'/hello/' instanceof RegExp; // false，普通字符串
```

`instanceof` 会沿原型链检查构造函数的 `prototype`。如果正则表达式来自另一个执行环境（例如不同的 `iframe`），它的原型链与当前环境的 `RegExp.prototype` 不同，判断可能返回 `false`。

需要跨执行环境判断时，可以调用 `RegExp.prototype` 上会检查正则对象内部状态的原生访问器：

```js
function isRegExp(value) {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }

  try {
    Object.getOwnPropertyDescriptor(RegExp.prototype, 'source').get.call(value);
    return true;
  } catch {
    return false;
  }
}
```

`Object.prototype.toString.call(value)` 常见输出为 `"[object RegExp]"`，但对象可以通过 `Symbol.toStringTag` 定制标签，因此不适合作为严格可靠的类型校验。

## 九、如何判断一个变量是否是日期对象？

在同一个 JavaScript 执行环境中，可以使用 `instanceof Date`：

```js
const date = new Date();

date instanceof Date; // true
'2026-10-26' instanceof Date; // false，日期字符串不是 Date 对象
```

如果要兼容来自其他执行环境（例如不同 `iframe`）的日期对象，可以调用 `Date.prototype.getTime`。该方法会校验对象是否具有 Date 内部状态；有效 Date 返回时间戳，无效 Date 返回 `NaN`，非 Date 对象则抛出异常。

```js
function isDate(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  try {
    Date.prototype.getTime.call(value);
    return true;
  } catch {
    return false;
  }
}
```

`Object.prototype.toString.call(value)` 常见输出为 `"[object Date]"`，但同样可能被 `Symbol.toStringTag` 伪装。还要注意，`new Date('invalid')` 仍然是 Date 对象，只是其时间值无效；若要判断日期对象是否包含有效时间，可以检查 `Number.isNaN(Date.prototype.getTime.call(value))`。

## 分类：作用域和闭包

### 十、什么是作用域链？JavaScript 如何查找变量？

作用域链是 JavaScript 中用于查找变量的一种机制。当访问一个变量时，JavaScript 引擎会首先在当前作用域中查找；如果找不到，就会沿着作用域链向上查找，直到全局作用域。

### 十一、什么是闭包？闭包有哪些应用场景？

闭包是指函数能够访问其词法作用域中的变量，即使函数在其词法作用域之外执行。

#### 保存私有状态

闭包可以保留函数内部的变量，并通过返回的方法控制对变量的访问：

```js
function createCounter() {
  let count = 0;

  return {
    increment() {
      return ++count;
    },
    getCount() {
      return count;
    },
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.getCount(); // 1
```

外部不能直接访问 `count`，只能通过 `increment` 和 `getCount` 操作它。

#### 函数工厂

闭包可以让创建出来的函数保留创建时传入的配置：

```js
function createMultiplier(multiplier) {
  return function (number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
double(5); // 10
```

#### 回调和延迟执行

回调函数可以在之后执行时，继续使用定义时作用域里的变量：

```js
function greetLater(name) {
  setTimeout(() => {
    console.log(`你好，${name}`);
  }, 1000);
}

greetLater('小明'); // 一秒后输出“你好，小明”
```

### 十二、闭包会导致内存泄漏吗？如何避免？`WeakMap` 和 `WeakSet` 是什么？

闭包本身不会必然导致内存泄漏。只要闭包仍可访问，它引用的变量就会保留；当不再需要的对象仍被长期引用时，才可能造成内存无法回收。

常见的避免方式：

- 及时移除不再需要的事件监听器。
- 清除定时器，并取消不再需要的订阅或回调。
- 避免让长期存活的闭包保留大型对象或 DOM 节点。

```js
function bindButton(button) {
  const handleClick = () => console.log(button.textContent);
  button.addEventListener('click', handleClick);

  return function cleanup() {
    button.removeEventListener('click', handleClick);
  };
}
```

调用 `cleanup()` 可以移除监听器，避免按钮和回调被不必要地保留。

#### `WeakMap` 和 `WeakSet`

- `WeakMap` 的键必须是对象，适合把额外数据关联到对象，而不单独延长该对象的生命周期。
- `WeakSet` 只能存对象，常用于记录对象是否处理过。
- 它们都不会阻止键对象被垃圾回收，也不能遍历或获取大小；是否以及何时回收由 JavaScript 引擎决定。

```js
const metadata = new WeakMap();
const processed = new WeakSet();
const user = {};

metadata.set(user, { lastSeen: Date.now() });
processed.add(user);

metadata.get(user); // { lastSeen: ... }
processed.has(user); // true
```

当 `user` 不再被其他地方引用时，它可以被垃圾回收，`WeakMap` 和 `WeakSet` 中对应的条目也会随之清理。它们适合关联对象数据或记录对象状态，但不能替代事件监听器、定时器等资源的主动清理。

### 十三、什么是立即执行函数表达式（IIFE）？有什么作用？

立即执行函数表达式（IIFE，Immediately Invoked Function Expression）是定义后立即调用的函数表达式：

```js
(function () {
  const message = '立即执行';
  console.log(message);
})();
```

也可以使用箭头函数：

```js
(() => {
  console.log('立即执行');
})();
```

IIFE 的常见作用是创建独立作用域，避免内部变量污染外部作用域；也可以用来初始化只需执行一次的逻辑。现代 JavaScript 通常用块级作用域或 ES Module 管理变量，因此 IIFE 不再像早期那样常用。

## 分类：继承和面向对象

### 十四、什么是原型链？

JavaScript 对象可以通过内部原型引用另一个对象。读取属性时，如果对象自身没有该属性，运行时会沿原型链向上查找，直到找到属性或到达链尾（`null`）。

- `Object.getPrototypeOf(obj)` 可以读取对象的原型。
- 函数的 `prototype` 属性会成为通过 `new` 创建的实例的原型。
- `instanceof` 会检查构造函数的 `prototype` 是否出现在对象的原型链上。

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} makes a sound`;
};

const cat = new Animal('Milo');
cat.speak(); // Milo makes a sound
```

#### 什么是原型链污染？如何避免？

如果程序把不可信输入中的属性递归合并到对象中，却没有检查属性名，特殊属性可能意外修改对象原型，影响其他对象的属性读取。这类问题称为**原型链污染**。

防护时优先按预期字段白名单读取输入，不要把外部对象不加校验地深度合并到配置对象中：

```js
function readOptions(input) {
  const options = Object.create(null);
  const allowedKeys = ['theme', 'language'];

  for (const key of allowedKeys) {
    if (Object.hasOwn(input, key)) {
      options[key] = input[key];
    }
  }

  return options;
}
```

其他注意事项：

- 如果必须处理任意键名，应拒绝 `__proto__`、`constructor`、`prototype` 等危险属性名，并在每一层嵌套数据中都校验。
- 使用 `Object.hasOwn(obj, key)` 判断对象自身属性，不要依赖 `obj.hasOwnProperty(key)` 或 `key in obj` 来区分继承属性。
- 字典类数据可以考虑使用 `Object.create(null)` 创建无原型对象；仍需校验数据，并留意后续处理该对象的代码。
- 使用可靠且及时更新的深合并依赖，检查其安全公告。

### 十五、`__proto__` 和 `prototype` 有什么区别？

- `prototype` 是**构造函数**的属性，指向该函数的原型对象。使用 `new` 调用构造函数时，新对象的原型会指向这个对象。不是所有函数都有 `prototype`，例如箭头函数就没有。
- `__proto__` 通常指对象上用于访问其原型的历史访问器。现代代码推荐使用 `Object.getPrototypeOf()` 获取原型。

```js
function Animal() {}

const animal = new Animal();

animal.__proto__ === Animal.prototype; // true
Object.getPrototypeOf(animal) === Animal.prototype; // true，推荐写法
```

简单来说：`Animal.prototype` 是构造函数提供给实例使用的原型对象；`animal.__proto__` 表示实例的原型。一般不建议直接使用 `__proto__`，读取时用 `Object.getPrototypeOf()`，需要创建指定原型的对象时用 `Object.create()`。

### 十六、JavaScript 如何实现继承？常见方式有哪些？

JavaScript 的对象通过原型链共享属性和方法。下面是几种常见的继承方式。

#### 原型链继承

让子类的原型对象指向父类的实例：

```js
function Animal() {}
Animal.prototype.speak = function () {
  return '发出声音';
};

function Dog() {}
Dog.prototype = new Animal();
Dog.prototype.constructor = Dog;

const dog = new Dog();
dog.speak(); // "发出声音"
```

子类实例可以继承父类原型上的方法，但父类实例属性会被所有子类实例共享。

#### 借用构造函数继承

在子类构造函数中调用父类构造函数，复制父类实例属性：

```js
function Animal(name) {
  this.name = name;
}

function Dog(name) {
  Animal.call(this, name);
}

const dog = new Dog('旺财');
dog.name; // "旺财"
```

这种方式可以让每个实例拥有自己的属性，但不能继承父类原型上的方法。

#### 组合继承

结合原型链继承和借用构造函数继承：

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} 发出声音`;
};

function Dog(name) {
  Animal.call(this, name);
}
Dog.prototype = new Animal();
Dog.prototype.constructor = Dog;

const dog = new Dog('旺财');
dog.speak(); // "旺财 发出声音"
```

组合继承同时获得实例属性和原型方法，但父类构造函数会调用两次。

#### 寄生组合继承

使用 `Object.create` 建立原型关系，并通过 `call` 调用一次父类构造函数，避免组合继承中重复调用父类构造函数：

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} 发出声音`;
};

function Dog(name) {
  Animal.call(this, name);
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

const dog = new Dog('旺财');
dog.speak(); // "旺财 发出声音"
```

#### `class` 和 `extends`

ES6 的 `class` 语法提供了更清晰的继承写法，底层仍基于原型：

```js
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} 发出声音`;
  }
}

class Dog extends Animal {
  speak() {
    return `${this.name} 汪汪叫`;
  }
}

const dog = new Dog('旺财');
dog.speak(); // "旺财 汪汪叫"
```

子类构造函数中要先调用 `super(...)`，才能使用 `this`。日常开发通常优先使用 `class extends`；需要组合多个独立能力时，也可以考虑组合（composition），避免继承层级过深。例如，鸭子可以组合“行走”和“游泳”能力，不必为了这些能力建立复杂的继承关系：

```js
const canWalk = () => ({
  walk() {
    return `${this.name} 正在走路`;
  },
});

const canSwim = () => ({
  swim() {
    return `${this.name} 正在游泳`;
  },
});

function createDuck(name) {
  return Object.assign({ name }, canWalk(), canSwim());
}

const duck = createDuck('唐老鸭');
duck.walk(); // "唐老鸭 正在走路"
duck.swim(); // "唐老鸭 正在游泳"
```

### 十七、浅拷贝和深拷贝有什么区别？

浅拷贝只复制第一层属性；嵌套对象仍共享引用。对象展开语法和 `Object.assign` 都是浅拷贝。

```js
const original = { settings: { theme: 'dark' } };
const copy = { ...original };
copy.settings.theme = 'light';
console.log(original.settings.theme); // light
```

#### 使用 JavaScript 内置的 `structuredClone`

现代 JavaScript 提供了 `structuredClone`，适合大多数常见数据的深拷贝，也支持循环引用：

```js
const original = {
  name: 'Lin',
  settings: { theme: 'dark' },
};

const copy = structuredClone(original);
copy.settings.theme = 'light';

console.log(original.settings.theme); // "dark"
```

它也可以处理循环引用以及 `Map`、`Set`、`Date` 等可结构化克隆的数据类型。不过，函数、Symbol 等值不能被结构化克隆；遇到不支持的数据时会抛出 `DataCloneError`。它也不会保留自定义类的原型和方法。使用前应确认运行环境支持 `structuredClone`，并确认数据类型符合需求。

#### 手动实现一个简单的深拷贝

下面的示例仅处理普通对象和数组的可枚举自有字符串属性，并通过 `WeakMap` 处理循环引用。遇到其他对象类型或函数时会明确报错，不应当作适用于所有 JavaScript 值的通用实现：

```js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function') {
      throw new TypeError('不支持拷贝函数');
    }
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  const prototype = Object.getPrototypeOf(value);
  const isArray = Array.isArray(value);
  if (!isArray && prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('仅支持普通对象和数组');
  }

  const clone = isArray ? [] : Object.create(prototype);
  seen.set(value, clone);

  for (const key of Object.keys(value)) {
    clone[key] = deepClone(value[key], seen);
  }

  return clone;
}
```

例如，循环引用也可以被保留下来：

```js
const original = { name: 'Lin' };
original.self = original;

const copy = deepClone(original);
copy !== original; // true
copy.self === copy; // true
```

该实现不复制 Symbol 键、不可枚举属性，也不处理 `Date`、`Map`、`Set` 等特殊对象；实际项目中优先考虑 `structuredClone`，并按数据类型选择合适方案。

JSON 序列化往返也能拷贝部分简单数据，但会丢失或改变 `undefined`、函数、Symbol、循环引用及特殊对象等数据，不适合作为通用深拷贝方案。

## 分类：ES6 新特性

### 十八、变量声明：`var`、`let` 和 `const` 有什么区别？

- `var` 是函数作用域，允许重复声明；声明会提升，但赋值不会提升。
- `let` 和 `const` 是块级作用域，不能在同一作用域重复声明。
- `let` 可以重新赋值，`const` 不能重新赋值。`const` 声明对象时，不能重新绑定变量，但可以修改对象属性。
- `let` 和 `const` 在声明前处于暂时性死区（TDZ），访问会抛出 `ReferenceError`。

```js
console.log(value); // undefined
var value = 1;

console.log(count); // ReferenceError
let count = 1;

const user = { name: 'Lin' };
user.name = 'Ming'; // 可以修改对象属性
// user = {};       // TypeError：不能重新赋值
```

日常开发通常优先使用 `const`，需要重新赋值时再使用 `let`，避免使用 `var`。

如果希望对象的属性不能被新增、删除或修改，可以使用 `Object.freeze()`：

```js
const settings = Object.freeze({ theme: 'dark' });

settings.theme = 'light'; // 严格模式下抛出 TypeError；非严格模式下静默失败
settings.language = 'zh'; // 同样不能新增属性
delete settings.theme; // 同样不能删除属性
```

`Object.freeze()` 会返回被冻结的对象，但只冻结对象自身，不会递归冻结嵌套对象；需要深度冻结时，必须递归处理嵌套对象。

### 十九、箭头函数与普通函数有什么区别？箭头函数能否使用 `yield`？

- **`this`**：箭头函数没有自己的 `this`，使用定义时外层作用域的 `this`；普通函数的 `this` 通常由调用方式决定。
- **`arguments`**：箭头函数没有自己的 `arguments`；普通函数可以使用 `arguments` 对象。
- **构造函数**：箭头函数不能用 `new` 调用，也没有 `prototype` 属性；普通函数在满足条件时可以作为构造函数。
- **生成器**：箭头函数不能声明为生成器，因此不能在箭头函数体内使用 `yield`。需要使用 `yield` 时，应使用 `function*`。

```js
function* createGenerator() {
  yield 1;
}

const generator = createGenerator();
generator.next(); // { value: 1, done: false }
```

### 二十、如何实现柯里化函数、偏函数和惰性函数？

#### 柯里化（Currying）

柯里化把接收多个参数的函数转换为一连串每次接收一个参数的函数：

```js
function curryAdd(a) {
  return function (b) {
    return function (c) {
      return a + b + c;
    };
  };
}

curryAdd(1)(2)(3); // 6
```

#### 偏函数（Partial Application）

偏函数预先固定原函数的部分参数，返回一个等待其余参数的新函数：

```js
function partial(fn, ...presetArgs) {
  return function (...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

function multiply(a, b, c) {
  return a * b * c;
}

const doubleFirst = partial(multiply, 2);
doubleFirst(3, 4); // 24
```

柯里化是逐步拆分参数调用；偏函数则是先固定部分参数，两者相关但不是同一个概念。

#### 惰性函数（Lazy Function）

惰性函数在第一次调用时完成初始化，并把函数替换为适合后续调用的实现，避免每次重复判断：

```js
let getScrollPosition = function () {
  if (window.pageXOffset !== undefined) {
    getScrollPosition = () => window.pageXOffset;
  } else {
    getScrollPosition = () => document.documentElement.scrollLeft;
  }

  return getScrollPosition();
};
```

第一次调用时选择并保存可用的实现，后续调用直接使用保存的函数。惰性函数适合初始化逻辑较稳定且会被多次调用的场景；如果运行环境或条件可能变化，就不应缓存判断结果。

### 二十一、什么是 `Proxy`？常见考点有哪些？

`Proxy` 可以为一个对象创建代理，在读取、设置或删除属性等操作发生时拦截并自定义行为。它常用于数据校验、日志记录和响应式系统。

```js
const user = { name: 'Lin' };

const proxy = new Proxy(user, {
  get(target, property, receiver) {
    console.log(`读取属性：${String(property)}`);
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    if (property === 'age' && (!Number.isInteger(value) || value < 0)) {
      throw new TypeError('age 必须是非负整数');
    }
    return Reflect.set(target, property, value, receiver);
  },
});

proxy.name; // 记录读取属性：name
proxy.age = 18; // 设置成功
```

常见考点：

- **常见拦截器**：`get`、`set`、`has`、`deleteProperty`、`ownKeys` 等，对应属性读取、设置、`in` 判断、删除和枚举等操作。
- **配合 `Reflect`**：`Reflect` 提供与这些操作对应的方法，如 `Reflect.get`、`Reflect.set`。在拦截器中调用它们，可以保留默认行为并正确传递 `receiver`。
- **代理与原对象不同**：`proxy !== target`。通过原对象直接操作属性会绕过代理拦截。
- **不变量限制**：代理不能违反 JavaScript 对象的基本规则。例如，目标上的数据属性若同时是不可配置且不可写的，`get` 拦截器必须返回该属性的实际值；目标上的访问器属性若不可配置且没有 getter，`get` 拦截器必须返回 `undefined`。
- **私有字段限制**：某些使用 `#private` 私有字段的类方法，若通过代理对象调用，可能因 `this` 不再是原实例而报错；需要谨慎处理接收者。
- **撤销代理**：`Proxy.revocable(target, handler)` 可以创建可撤销的代理，调用其 `revoke()` 后代理不再可用。

### 二十二、什么是 Generator？`yield` 有什么作用？

Generator（生成器）是一种可以暂停和继续执行的函数。使用 `function*` 声明生成器，调用它不会立即执行函数体，而是返回一个迭代器。

- `yield` 会暂停生成器，并把后面的值作为本次迭代结果返回。
- 调用迭代器的 `next()` 会继续执行，直到遇到下一个 `yield` 或函数结束。
- `next()` 返回 `{ value, done }`：`done` 为 `false` 表示生成器暂停在某个 `yield`，为 `true` 表示执行结束。
- 生成器可以配合 `for...of` 遍历，也可以按需逐步产生值。

```js
function* createSequence() {
  yield 1;
  yield 2;
  return 3;
}

const sequence = createSequence();
sequence.next(); // { value: 1, done: false }
sequence.next(); // { value: 2, done: false }
sequence.next(); // { value: 3, done: true }
sequence.next(); // { value: undefined, done: true }
```

`yield` 也可以接收下一次 `next(value)` 传入的值：

```js
function* askName() {
  const name = yield '你叫什么名字？';
  return `你好，${name}`;
}

const iterator = askName();
iterator.next(); // { value: "你叫什么名字？", done: false }
iterator.next('小明'); // { value: "你好，小明", done: true }
```

箭头函数不能声明为 Generator，因而不能在箭头函数体内使用 `yield`；需要生成器时使用 `function*`。

## 分类：异步编程与事件循环

### 二十三、`requestAnimationFrame` 是什么？常见考点有哪些？

`requestAnimationFrame(callback)` 是浏览器提供的 API，用来请求浏览器在下一次重绘前执行一次回调，常用于动画和需要与页面刷新同步的视觉更新。它返回一个请求 ID，可以传给 `cancelAnimationFrame(id)` 取消尚未执行的回调。

```js
let position = 0;
let frameId;

function animate(timestamp) {
  position += 1;
  element.style.transform = `translateX(${position}px)`;

  if (position < 100) {
    frameId = requestAnimationFrame(animate);
  }
}

frameId = requestAnimationFrame(animate);
// 如需停止：cancelAnimationFrame(frameId);
```

常见考点：

- **与 `setTimeout` 的区别**：`requestAnimationFrame` 由浏览器安排在重绘前执行，适合视觉动画；`setTimeout` 按延迟安排任务，不保证与屏幕刷新同步。
- **刷新率与时间戳**：回调参数 `timestamp` 表示当前动画时间，可用它计算经过时间；不要假设屏幕一定是 60Hz，也不要依赖每帧固定间隔。
- **回调只执行一次**：要持续动画，需在回调中再次调用 `requestAnimationFrame`；这样浏览器可以根据页面刷新节奏调度。
- **后台标签页**：页面不可见或处于后台时，浏览器通常会暂停或节流回调，因此不应用它承担必须准时完成的后台任务。
- **取消请求**：保存返回的 ID，并用 `cancelAnimationFrame` 取消尚未执行的回调。
- **环境限制**：这是浏览器 API，Node.js 默认不提供。

```js
let previousTime;

function step(timestamp) {
  if (previousTime !== undefined) {
    const elapsed = timestamp - previousTime;
    console.log(`距离上一帧 ${elapsed} 毫秒`);
  }
  previousTime = timestamp;
  requestAnimationFrame(step);
}

requestAnimationFrame(step);
```

### 二十四、事件循环中宏任务和微任务的执行顺序是什么？

JavaScript 主线程是单线程的，同一时刻只能执行一段 JavaScript 代码。**事件循环（Event Loop）是运行环境不断调度待执行代码的机制**：异步操作由浏览器或 Node.js 等宿主环境处理，完成后把相应回调排队，主线程空出来时再执行。

在浏览器中，可以用下面的模型理解执行顺序：

1. 执行一个任务（常称“宏任务”）。首次任务通常是整段 script，同步代码在其中依次执行。
2. 当前任务结束后，清空微任务队列；执行微任务期间新加入的微任务也会继续执行，直到队列清空。
3. 浏览器有机会更新页面并渲染；是否渲染及具体时机由浏览器决定。
4. 取下一个任务，重复以上过程。

```text
执行一个任务 -> 清空微任务 -> 浏览器可能渲染 -> 执行下一个任务
```

常见任务和微任务来源：

| 任务（常称宏任务） | 微任务 |
| --- | --- |
| 整段 script | `Promise.then/catch/finally` |
| `setTimeout` / `setInterval` 回调 | `queueMicrotask` |
| I/O、UI 事件、`MessageChannel` 等回调 | 浏览器中的 `MutationObserver` 回调 |

任务来源和调度细节会因宿主环境而异；“宏任务”是常用说法，浏览器标准通常称为 task。

#### 示例：同步代码、微任务和定时器

```js
console.log(1);

setTimeout(() => console.log(2), 0);

Promise.resolve().then(() => console.log(3));

console.log(4);
```

输出顺序是 `1 4 3 2`：

- `1`、`4` 属于当前 script 中的同步代码，先执行。
- `3` 是微任务，当前 script 执行完后处理。
- `2` 是定时器回调，作为后续任务，在微任务队列清空后执行。

#### `await` 与微任务

`await` 会暂停当前 `async` 函数；等待的值兑现后，函数中 `await` 后面的部分会作为 Promise 后续任务异步恢复执行。

```js
async function example() {
  console.log('a');
  await null;
  console.log('b');
}

example();
console.log('c');
// 输出：a、c、b
```

等待 I/O 的 Promise（例如读取输入）完成后，`async` 函数也会在后续微任务中继续执行。通常 `await` 写在 `async` 函数中；ES Module 也支持顶层 `await`。

#### 容易忽略的地方

- 微任务中创建的微任务会在开始下一个任务前继续执行。若微任务不断递归添加，可能让后续任务和浏览器渲染长期得不到机会。
- `setTimeout(fn, 0)` 不表示立刻执行；回调要等当前任务和微任务处理完才有机会运行，实际延迟也可能更长。
- Promise 的执行器是同步执行的，`.then` 回调才是微任务。

#### Node.js 的差异

Node.js 的事件循环分为多个阶段，例如 timers、poll 和 check。`process.nextTick` 使用独立队列，通常会在继续事件循环前优先处理，不应简单等同于浏览器微任务；Promise 回调属于微任务。`setImmediate` 与 `setTimeout(0)` 的先后顺序可能受上下文影响；在 I/O 回调中安排时，通常先执行 `setImmediate`。

面试时可以先概括为：**当前任务（包括初始 script）执行完后清空微任务，再执行后续任务；浏览器还会在适当时机进行渲染。**遇到 Node.js 代码时，再说明其阶段和 `process.nextTick` 等差异。

## 分类：浏览器与网络

### 二十五、浏览器重排和重绘有什么区别？

- **重排（Reflow，也常称 Layout）**：DOM 结构或样式变化影响元素几何信息时，浏览器重新计算元素的尺寸和位置，并可能影响其他元素的布局。例如修改宽高、边距、字体大小，或插入、删除 DOM 节点。
- **重绘（Repaint，也常称 Paint）**：元素几何信息不变，但外观变化时，浏览器重新绘制受影响区域。例如修改文字颜色、背景色、边框颜色。
- **合成（Composite）**：绘制结果的图层被合并并显示到屏幕。某些 `transform`、`opacity` 动画可以只触发合成，但是否能跳过布局和绘制取决于具体实现与元素图层情况。

通常重排会导致受影响区域重新绘制；单纯重绘不需要重新计算布局。开销大致可以理解为：重排通常比重绘更重，而仅合成通常更轻，但具体成本取决于页面和浏览器实现。

```js
element.style.width = '200px'; // 可能触发布局计算及后续绘制
element.style.color = 'red';   // 通常只需要重绘
```

#### 常见性能注意点

- 避免交替执行 DOM/样式写入和布局信息读取。写入后读取 `offsetWidth`、`getBoundingClientRect()` 等几何属性，可能迫使浏览器同步计算布局（强制同步布局）。
- 将多次样式变更合并，例如切换 CSS class，减少重复计算。
- 动画优先考虑 `transform` 和 `opacity`，但不要假设它们在所有场景下必然只走合成。
- 高频视觉更新可以结合 `requestAnimationFrame` 调度。

面试简答：**重排重新计算布局几何信息，重绘重新绘制外观；重排通常会带来后续绘制，重绘不一定需要重排。**

### 二十六、在浏览器输入网址并回车后，发生了什么？

可以按“导航准备 → 建立或复用连接 → 请求与响应 → 解析和渲染”来说明。具体步骤会因缓存、Service Worker、连接复用、协议和浏览器实现而跳过或改变。

1. **解析 URL 并确定导航目标**：浏览器解析协议、主机名、端口、路径和查询参数；必要时执行安全升级、重定向或其他导航策略。
2. **检查可复用的数据和拦截逻辑**：浏览器可能命中 HTTP 缓存，或由 Service Worker 返回响应；也可能复用已有连接。因此不一定每次都重新进行 DNS 查询和建连。
3. **解析域名并建立连接**：需要联网且没有可用连接时，解析域名得到 IP 地址，再建立传输连接。传统 HTTPS 通常使用 TCP 后进行 TLS 握手；HTTP/3 使用基于 QUIC 的连接。连接可能经过代理、CDN 或负载均衡。
4. **发送 HTTP 请求并接收响应**：请求携带方法、路径、请求头和可能的请求体；服务器返回状态码、响应头和响应体。浏览器按缓存策略处理响应，也可能跟随重定向并发起新的请求。
5. **解析 HTML 并发现子资源**：浏览器解析 HTML，逐步构建 DOM；同时发现 CSS、JavaScript、图片、字体等资源并发起加载。CSS 和脚本的加载、执行规则会影响解析与首次渲染时机。
6. **构建样式并计算布局**：解析 CSS 形成 CSSOM，将 DOM 与样式信息结合，生成用于渲染的结构，再计算元素尺寸和位置（Layout）。
7. **绘制、栅格化并合成**：浏览器绘制文本、颜色、边框和图像，将内容栅格化成图层，再合成并显示到屏幕。之后脚本执行、资源加载或用户交互还可能引发新的布局、绘制或合成。
8. **触发生命周期事件**：随着文档解析和资源加载推进，会触发 `DOMContentLoaded`、`load` 等事件；它们的触发条件不同，`DOMContentLoaded` 不等同于所有资源都加载完成。

面试回答时不必把每个底层细节都说满，可以先串起主线：**解析 URL，检查缓存和 Service Worker，必要时解析 DNS 并建立 TCP/TLS 或 QUIC 连接，发送 HTTP 请求，接收响应后解析 HTML/CSS/JS，构建 DOM 和样式，计算布局、绘制并合成页面。**再补充连接复用、缓存和脚本对渲染时机的影响。

### 二十五、Promise 有哪些状态？链式调用如何传递结果？

Promise 有三种状态：`pending`、`fulfilled` 和 `rejected`。状态一旦从 `pending` 变为成功或失败，就不会再改变。

- `then` 返回一个新的 Promise。
- 回调返回普通值时，新 Promise 会以该值兑现。
- 回调抛出异常时，新 Promise 会被拒绝。
- 回调返回 Promise 时，新 Promise 会采用它最终的状态和值。
- `catch` 是处理拒绝状态的 `then` 的简写；`finally` 通常用于清理操作。

```js
Promise.resolve(2)
  .then((value) => value * 3)
  .then((value) => {
    throw new Error(`结果是 ${value}`);
  })
  .catch((error) => console.log(error.message)); // 结果是 6
```

### 二十六、`async/await` 和 Promise 是什么关系？

`async` 函数总是返回 Promise。函数中 `return value` 会让返回的 Promise 以 `value` 兑现；抛出异常则会让它被拒绝。`await` 会等待 Promise 的结果，并让当前 `async` 函数暂停，不会阻塞整个 JavaScript 线程。

```js
async function loadUser() {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('加载用户失败', error);
    throw error;
  }
}
```

多个互不依赖的异步操作可以用 `Promise.all` 并行等待；其中任意一个拒绝，返回的 Promise 就会拒绝。

### 二十七、什么是 Promise？如何实现一个 Promise？

Promise 是表示一个异步操作最终成功或失败结果的对象。它有 `pending`、`fulfilled`、`rejected` 三种状态；状态从 `pending` 变为成功或失败后不会再改变。创建 Promise 时，执行器会立即执行；`then` 用于处理结果，并返回新的 Promise，以便链式调用。

日常开发中使用 JavaScript 内置的 `Promise`，通过执行器中的 `resolve` 和 `reject` 表示异步操作成功或失败：

```js
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve('完成'), ms);
  });
}

delay(100)
  .then((value) => console.log(value))
  .catch((error) => console.error(error));
```

手写 Promise 实现涉及状态管理、异步调度、thenable 吸收和链式结果传递；实际项目应使用内置 `Promise`。

### 二十八、如何实现 `Promise.all` 和 `Promise.race`？

#### `Promise.all`

`Promise.all` 等待所有输入都兑现后，以与输入顺序一致的结果数组兑现；任意输入拒绝时，返回的 Promise 就会拒绝。空数组会立即以空数组兑现。

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let completed = 0;

    if (items.length === 0) {
      resolve(results);
      return;
    }

    items.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          results[index] = value;
          completed += 1;
          if (completed === items.length) {
            resolve(results);
          }
        },
        reject,
      );
    });
  });
}

promiseAll([Promise.resolve('a'), 2, Promise.resolve('c')])
  .then((values) => console.log(values)); // ["a", 2, "c"]
```

用 `Promise.resolve` 包装每个输入，因此普通值也会作为已兑现的 Promise 处理；通过索引存储结果，完成先后不影响结果数组顺序。

#### `Promise.race`

`Promise.race` 会采用最先敲定（兑现或拒绝）的输入 Promise 的状态和值；若输入为空，返回的 Promise 会一直保持 pending。

```js
function promiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {
      Promise.resolve(item).then(resolve, reject);
    }
  });
}

promiseRace([
  new Promise((resolve) => setTimeout(() => resolve('较慢'), 100)),
  new Promise((resolve) => setTimeout(() => resolve('较快'), 10)),
]).then((value) => console.log(value)); // "较快"
```

以上是用于理解行为的简化实现，实际项目优先使用内置的 `Promise.all` 和 `Promise.race`。

### 二十九、什么是 Web Worker？有哪些常见考点？

Web Worker 是浏览器提供的后台线程机制，可以把计算量较大的 JavaScript 工作移到主线程之外执行，减少对页面交互和渲染的阻塞。

主线程与 Worker 通过消息通信：

```js
// 主线程
const worker = new Worker('/worker.js');
worker.postMessage({ type: 'calculate', numbers: [1, 2, 3] });

worker.onmessage = (event) => {
  console.log('计算结果：', event.data);
  worker.terminate();
};

// worker.js
self.onmessage = (event) => {
  const { numbers } = event.data;
  const total = numbers.reduce((sum, number) => sum + number, 0);
  self.postMessage(total);
};
```

常见考点：

- **不共享普通内存**：主线程与 Worker 通常通过 `postMessage` 传递数据，数据会结构化克隆；可转移的对象（如 `ArrayBuffer`）也可以用 transfer list 转移所有权，避免复制。
- **不能直接操作 DOM**：Worker 没有 `window` 和页面 DOM，通常使用 `self` 访问 Worker 全局对象；适合计算，不适合直接更新页面。
- **消息是异步的**：通过 `message` 事件接收结果，应设计好请求与响应的关联方式、错误处理和生命周期管理。
- **创建与结束**：`new Worker(url)` 创建专用 Worker；主线程可调用 `worker.terminate()` 立即结束，Worker 自身可调用 `self.close()` 结束。
- **适用场景**：图像或数据处理、复杂计算等 CPU 密集型任务。Worker 有启动和通信开销，短小任务不一定适合搬到 Worker。
- **环境与安全限制**：通常要求同源脚本（或满足跨域策略），并受浏览器安全策略约束；Worker 不能访问页面的 DOM。

Worker 使计算能在另一线程运行，但不意味着主线程中的 JavaScript 变成多线程；双方需要通过消息或可转移对象协作。

## 面试复盘要点

下面是一份按机制归纳的快速复盘清表。它与前面的专题内容互为索引：需要理解原理时回到对应题目，需要快速回忆时可以直接检查下面的结论。

### 一、事件循环与异步

**执行模型：** 一次循环执行一个任务（初始任务是整段 `script`）→ 清空微任务队列 → 浏览器必要时渲染 → 取下一个宏任务。

- JavaScript 是单线程的；异步是宿主环境（浏览器或 Node.js）把任务回调放入队列，Event Loop 再调度主线程执行。
- 整段 `script` 本身就是第一个宏任务。同步代码执行完后，先清空微任务，再进入下一个宏任务。
- 微任务按入队顺序执行，执行过程中新加入的微任务会继续留在本轮，直到队列为空。
- 浏览器中常见宏任务包括 `script`、定时器、I/O、UI 事件、`MessageChannel` 等；常见微任务包括 `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`。
- `setTimeout(fn, 0)` 不表示立即执行。它至少要等当前任务和微任务清空，实际时间受定时器最小延迟和线程负载影响。
- Promise 的执行器是同步的，只有其后续回调（如 `.then`）进入微任务队列。
- `async` 函数在第一个 `await` 之前按同步代码执行；遇到 `await` 后，后续部分会在恢复执行时作为微任务。
- `await` 后面的代码相当于放入微任务，但要和具体宿主的调度顺序一起分析；无限制造微任务可能使后续宏任务和页面渲染饿死。
- Node.js 的事件循环分为 timers、poll、check 等阶段，并有额外的 `process.nextTick` 队列；`process.nextTick` 优先级高于 Promise 微任务。
- `setImmediate` 和 `setTimeout(0)` 的先后在主模块中不固定，在 I/O 回调中通常先执行 `setImmediate`。

经典输出题：

```js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);

// 1、4、3、2
```

`await readline()` 遇到异步读取时会让出当前执行流；读取完成后继续执行的代码进入微任务。它本质上没有多线程执行 JavaScript，同一时刻仍只有一个调用栈在运行。

#### Promise 的状态与链式调用

- 三种状态：`pending`、`fulfilled`、`rejected`。状态敲定后不可改变。
- `.then` 通常返回一个新 Promise；回调返回普通值就兑现，抛出异常就拒绝，返回 Promise 则采用该 Promise 的状态。
- 拒绝会沿链传递，直到遇到能处理它的 `.catch` 或另一个拒绝处理器。
- `.finally` 不接收上游结果，因此一般透传原结果；如果回调抛错，或返回被拒绝的 Promise，则会覆盖原状态。
- 链式调用中的新 `.then` 等前一步回调执行完并入队，不要只按代码书写顺序直接确定微任务顺序。

### 二、`this` 指向

绑定优先级为：`new` > 显式绑定（`call` / `apply` / `bind`）> 方法调用 > 默认绑定。规则的核心是找调用点由哪一个接收者提供 `this`。

- 普通方法调用：`obj.method()` 中，`method` 的 `this` 通常指向 `obj`。
- 方法被取出：`const fn = obj.method; fn()` 会丢失接收者。非严格模式普通函数的默认绑定指向全局对象，严格模式指向 `undefined`。
- 显式绑定：`call` 逐个传参，`apply` 以数组传参，`bind` 返回硬绑定函数，三者都不改变箭头函数的 `this`。
- `bind` 后再通过 `call` / `apply` 调用仍不能覆盖绑定；唯一例外是将绑定的可构造函数用于 `new`，此时 `this` 指向新建实例。
- 箭头函数没有自己的 `this`，它读取定义位置外层作用域中的 `this`，并且不能被后续显式绑定改变。
- 对象字面量 `{}` 不创建词法作用域。`{ say: () => this.name }` 中的箭头函数不会把对象作为 `this`；它读取外层作用域的 `this`。
- 在事件回调中先保存箭头函数中的外层 `this`，或使用 `bind`，不要假定回调接收者就是目标对象。

**手写判断模板：**

```js
function callContext(priority) {
  console.log(priority, this);
}

const receiver = { name: 'receiver' };
callContext.call(receiver, '显式绑定');
callContext.apply(receiver, ['显式绑定']);
const bound = callContext.bind(receiver, '绑定');
bound();

const arrow = () => console.log(this);
arrow.call(receiver); // 仍读取外层 this
```

### 三、闭包与作用域

- 闭包是函数能够访问其词法作用域中的变量，即使该函数在定义它的作用域之外执行。
- 闭包保存的是变量绑定，不是变量值的快照。多个函数可共享同一个变量引用。
- `var i` 在循环结束后被所有回调共享，因此回调依次读取到同一个最终值。使用 `let` 可以让每次迭代拥有独立绑定。
- 可以用 IIFE 创建每次迭代的局部作用域，也可以用 `bind` 预设参数、或直接使用 `forEach` / `map` 等回调参数传递值。
- 闭包不等于内存泄漏。只有闭包长期存活且持续持有大对象、监听器、定时器或 DOM 时，才会阻止资源回收。
- 清理监听器和定时器是常见修复手段；需要弱关联对象元数据时可使用 `WeakMap` / `WeakSet`。

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 3 3 3
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 0 1 2
}
```

### 四、变量声明与冻结

- `var`：函数作用域；声明提升到作用域顶部，初始化为 `undefined`，赋值不会提升。
- `let` / `const`：块级作用域；声明前处于 TDZ（暂时性死区），读取或写入会抛出 `ReferenceError`。
- `const` 只限制变量绑定不能重新赋值，不限制对象内部属性修改。严格模式和非严格模式下，重新给 `const` 赋值都会抛出 `TypeError`。
- 对象字面量中的属性与变量绑定是不同概念；冻结绑定也不等于冻结对象。
- `Object.freeze` 是浅冻结。被冻结对象已有的自有属性不可再修改或配置；冻结 `Map` 只冻结 Map 对象壳，并不会冻结内部条目。
- 非严格模式下修改被冻结属性会静默失败，严格模式会抛出 `TypeError`。
- 嵌套对象需要递归冻结；循环引用对象需要使用已访问集合避免无限递归。

### 五、原型与继承

- `prototype` 是构造函数的属性；实例对象通过内部原型访问到它。推荐使用 `Object.getPrototypeOf()` 和 `Object.create()`，不要依赖 `__proto__`。
- 原型链终点是 `Object.prototype.__proto__ === null`。
- `hasOwnProperty` / `Object.hasOwn` 判断是否为自有属性，原型上的同名属性不会被计算为自有属性。
- 继承演进：原型链继承会共享引用属性 → 借用构造函数拿不到原型方法 → 组合继承重复执行父构造函数 → 寄生组合继承用 `Object.create` 建立原型并只调用一次父构造函数 → `class extends` 内部使用类似机制。
- `class` 的 `super` 只能在派生类构造函数中使用，调用前不能访问 `this`；派生类构造函数未显式 `super()` 时不能返回自身构造的实例。
- 原型链污染应从不可信合并开始避免：拒绝 `__proto__`、`constructor`、`prototype` 等危险键；字典数据可使用 `Object.create(null)`，写入前检查自有属性。

若 `Animal.call(this, name)` 被去掉，问题不是 `this` 指向错误，而是父类构造逻辑没有执行，实例的 `name`、`tags` 等初始化字段不会被创建。

### 六、类型与数据

- JavaScript 基本类型包括 `string`、`number`、`boolean`、`undefined`、`null`、`bigint` 和 `symbol`；对象和函数属于引用类型。
- `typeof null === 'object'` 是历史遗留，判断 `null` 应使用 `value === null`。
- 数组使用 `Array.isArray(value)` 判断；对象、函数、日期等类型不能只靠 `typeof` 区分，必要时结合原型或 `Object.prototype.toString.call`。
- `typeof` 总是返回字符串。对于未声明变量，直接读取会抛 `ReferenceError`；`typeof undeclaredName` 仍有特殊的安全行为并返回 `"undefined"`。
- 默认参数只有参数值为 `undefined` 时才应用默认值，传入 `null` 不触发。
- `JSON.stringify` 会忽略对象属性中的 `undefined`、函数和 Symbol；数组中的 `undefined`、函数和 Symbol 会变成 `null`；而 `null` 会保留。
- `Symbol()` 每次创建唯一的 Symbol；`Symbol.for(key)` 使用全局注册表，相同 key 返回相同 Symbol。
- Symbol 属性不等于私有属性：可以通过 `Object.getOwnPropertySymbols` 和 `Reflect.ownKeys` 被发现。真正的私有字段应使用 `#field`。
- 浅拷贝（如展开语法、`Object.assign`）复制的是基本类型值和引用地址，不会递归复制对象。
- `structuredClone` 支持 `Date`、`Map`、`Set` 和循环引用，但不支持函数和 Symbol，丢失自定义类原型。
- `JSON.parse(JSON.stringify())` 会丢失 `undefined`、函数和 Symbol；`Date` 变字符串，`Map` / `Set` 变成普通对象，循环引用会抛错。

### 七、`Proxy`、`Generator` 与弱集合

#### Proxy

- `Proxy` 包装目标对象，拦截访问、赋值、删除、定义属性等内部操作；它不是目标对象本身，目标的引用仍绕过拦截器。
- 能力：动态校验、只读字段、数据跟踪、缓存、数据绑定和属性访问日志。
- 使用拦截器时优先配合 `Reflect` 保留默认行为，并正确传入原始 `receiver`。例如 `Reflect.set(target, key, value, receiver)` 会得到布尔型结果。
- Proxy 的不变量保护不可配置且不可写的数据属性、不可配置且无 getter 的访问器：代理不能报告与目标冲突的值或行为。
- 私有字段（`#field`）由类内部机制管理。代理对象在访问私有字段时可能因为接收者不是原始实例而抛错，此时应让正确的原始实例接收调用，或由实例方法内部处理私有状态。
- `Proxy.revocable()` 可以在后续通过 `revoke()` 断开代理与目标的操作；撤销后继续访问代理会抛出 `TypeError`。

```js
const target = { count: 0 };
const proxy = new Proxy(target, {
  get(current, key, receiver) {
    console.log('读取', key);
    return Reflect.get(current, key, receiver);
  },
  set(current, key, value, receiver) {
    if (typeof value !== 'number') return false;
    return Reflect.set(current, key, value, receiver);
  },
});

proxy.count = 1;
target.count = 2; // 绕过代理
```

#### Generator 与 `yield`

- `function*` 定义生成器，调用后不会立即执行函数体，而是返回迭代器。
- `next()` 让执行到下一个 `yield`，并返回 `{ value, done }`；`done: true` 表示生成器执行结束。
- `next(value)` 的参数会成为上一个暂停的 `yield` 表达式的值。首次调用 `next()` 的参数通常不会进入函数体。
- `yield*` 委托给另一个可迭代对象，箭头函数不能直接作为生成器。
- 常见用途包括惰性序列、分步迭代和把异步流程写成顺序结构；业务异步控制应优先考虑可读性更好的 `async/await`。

```js
function* produce() {
  const first = yield '第一次';
  const second = yield `收到：${first}`;
  return second;
}

const iterator = produce();
iterator.next();
iterator.next('甲');
iterator.next('乙');
// 最后一次恢复后 done 为 true
```

#### WeakMap 与 WeakSet

- `WeakMap` 的键必须是对象，值可以是任意类型；它弱引用键，不阻止对象被垃圾回收。
- 弱集合不可遍历，没有 `size`，适合保存对象元数据、缓存或关联关系，避免依赖全局强引用造成泄漏。
- `Map` 强引用键；在长期缓存中，如果外部已不再使用对象，仍可能因为缓存而不能回收。
- `WeakSet` 只能保存对象，主要用于标记对象或管理状态，不能枚举其中的对象。

### 八、模块系统

| 对比项 | ES Module | CommonJS |
| --- | --- | --- |
| 加载时机 | 静态，编译阶段分析，可 tree-shaking | 运行时，`require()` 可写在条件或函数中 |
| 导出绑定 | 活绑定，导出的值更新后其他模块可同步读取 | 一般导出值快照；对象仍共享引用 |
| 导入绑定 | 对外只读，不允许重新赋值 | 持有 `exports` 的当前导出值或对象引用 |
| 解析方式 | URL、模块规范和文件类型影响加载 | 基于当前模块的绝对或相对路径解析 |

ESM 的导入绑定是只读的，但绑定指向导出模块中的变量，因此导出变量更新后导入方读取到新值。CommonJS 是运行时模块包装，并通过 `require` 缓存模块；对基本类型进行导出后，导出模块修改局部变量不会自动同步到已取得的值。

### 九、必须能默写的手写题

#### 防抖

```js
function debounce(fn, delay) {
  let timer;

  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  }

  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
```

防抖是在事件触发后等待一段时间再执行；期间再次触发会重置计时。常用于搜索联想。节流则是在一段时间内最多执行一次，常用于滚动和拖拽。

#### Promise.all

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let completed = 0;

    if (items.length === 0) {
      resolve(results);
      return;
    }

    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value;
        if (++completed === items.length) resolve(results);
      }, reject);
    });
  });
}
```

- 使用 `Promise.resolve` 统一处理普通值和 thenable。
- 按索引保存结果，保证顺序与输入一致。
- 任意拒绝立即拒绝；计数器只在成功后增加。
- 空数组立即兑现 `[]`。

#### Promise.race

```js
function promiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {
      Promise.resolve(item).then(resolve, reject);
    }
  });
}
```

`race` 会采用最先敲定的 Promise，无论先敲定的是成功还是拒绝。空可迭代对象不会执行任何处理，因此返回 Promise 会永久处于 pending。

#### 深冻结（含循环引用）

```js
function deepFreeze(value, seen = new WeakSet()) {
  if (
    value === null
    || (typeof value !== 'object' && typeof value !== 'function')
  ) {
    return value;
  }

  if (seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen);
  }
  return Object.freeze(value);
}
```

递归检查属性值而不是只检查属性名，先检查循环引用，再冻结对象。该实现仍需根据对象类型处理只读的自有不可配置属性等边界行为；在冻结前读取 getter 或其他带副作用的属性可能产生额外结果。

### 十、复盘时需要重点检查的矛盾点

1. **解释原因要说机制**：不要只说“变量提升”“this 指向错误”，而要说明绑定、作用域、微任务入队或原型查找发生在哪一步。
2. **输出题要画调用栈与队列**：区分同步代码、微任务、宏任务，以及链式 Promise 何时入队。
3. **手写题不能跳过**：至少能独立写出防抖、`Promise.all`、`Promise.race`；运行时可以用断言验证空数组、拒绝和顺序。
4. **写完检查前后是否矛盾**：比如 `typeof null` 是 `"object"`、浅拷贝共享引用、生成器结束后 `done` 恒为 `true`，这些细节容易在重述时写错。
