---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/rust-cover5.jpg
date: 2023-11-06
tag:
  - Rust
  - 编程基础
sticky: 1
prev:
  text: 'Rust基础知识系列四：变量绑定'
  link: '/posts/programming/rust/variable-bindings'
next:
  text: 'Rust基础知识系列六：函数'
  link: '/posts/programming/rust/rust-function'
---

# Rust基础知识系列五：类型系统

Rust 提供了多种机制，用于改变或定义原生类型和用户定义类型。接下来会讲到：

- 原生类型的类型转换（cast）。
- 指定字面量的类型。
- 使用类型推断（type inference）。
- 给类型取别名（alias）。

## 类型转换

Rust 不提供原生类型之间的隐式类型转换（coercion），但可以使用 `as` 关键字进行显式类型转换（casting）。

整型之间的转换大体遵循 C 语言的惯例，除了 C 会产生未定义行为的情形。在 Rust 中所有整型转换都是定义良好的。

```rust
let decimal = 65.4321_f32;

// 错误！不提供隐式转换
// let integer: u8 = decimal;
// 改正 ^ 注释掉这一行

// 可以显式转换
let integer = decimal as u8;
let character = integer as char;

println!("Casting: {} -> {} -> {}", decimal, integer, character);

// Output:
//  Casting: 65.4321 -> 65 -> A
```

### `From`和`Into`

`From` 和 `Into` 两个 trait 是内部相关联的，实际上这是它们实现的一部分。如果我们能够从类型 B 得到类型 A，那么很容易相信我们也能够把类型 B 转换为类型 A。

#### `From`

`From` trait 允许一种类型定义 “怎么根据另一种类型生成自己”，因此它提供了一种类型转换的简单机制。在标准库中有无数 `From` 的实现，规定原生类型及其他常见类型的转换功能。

比如，可以很容易地把 `str` 转换成 `String`：

```rust
let my_str = "hello";
let my_string = String::from(my_str);
```

也可以为我们自己的类型定义转换机制：

```rust
use std::convert::From;

#[derive(Debug)]
struct Number {
    value: i32,
}

impl From<i32> for Number {
    fn from(item: i32) -> Self {
        Number { value: item }
    }
}

fn main() {
    let num = Number::from(30);
    println!("My number is {:?}", num);
}
```

#### `Into`

`Into` trait 就是把 `From` trait 倒过来而已。也就是说，如果你为你的类型实现了 `From`，那么同时你也就免费获得了 `Into`。

使用 `Into` trait 通常要求指明要转换到的类型，因为编译器大多数时候不能推断它。不过考虑到我们免费获得了 `Into`，这点代价不值一提。

```rust
use std::convert::From;

#[derive(Debug)]
struct Number {
    value: i32,
}

impl From<i32> for Number {
    fn from(item: i32) -> Self {
        Number { value: item }
    }
}

fn main() {
    let int = 5;
    // 试试删除类型说明
    let num: Number = int.into();
    println!("My number is {:?}", num);
}
```

### `TryFrom` and `TryInto`

类似于 `From` 和 `Into`，`TryFrom` 和 `TryInto` 是类型转换的通用 trait。不同于 `From/Into` 的是，`TryFrom` 和 `TryInto` trait 用于易出错的转换，也正因如此，其返回值是 `Result` 型。

```rust
use std::convert::TryFrom;
use std::convert::TryInto;

#[derive(Debug, PartialEq)]
struct EvenNumber(i32);

impl TryFrom<i32> for EvenNumber {
    type Error = ();

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value % 2 == 0 {
            Ok(EvenNumber(value))
        } else {
            Err(())
        }
    }
}

fn main() {
    // TryFrom

    assert_eq!(EvenNumber::try_from(8), Ok(EvenNumber(8)));
    assert_eq!(EvenNumber::try_from(5), Err(()));

    // TryInto

    let result: Result<EvenNumber, ()> = 8i32.try_into();
    assert_eq!(result, Ok(EvenNumber(8)));
    let result: Result<EvenNumber, ()> = 5i32.try_into();
    assert_eq!(result, Err(()));
}
```

### `ToString`

要把任何类型转换成 `String`，只需要实现那个类型的 `ToString` trait。然而不要直接这么做，您应该实现`fmt::Display` trait，它会自动提供 `ToString`，并且还可以用来打印类型，就像 `print!` 一节中讨论的那样。

```rust
use std::fmt;

struct Circle {
    radius: i32
}

impl fmt::Display for Circle {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Circle of radius {}", self.radius)
    }
}

fn main() {
    let circle = Circle { radius: 6 };
    println!("{}", circle.to_string());
}
```

译注：一个实现 `ToString` 的例子

```rust
use std::string::ToString;

struct Circle {
    radius: i32
}

impl ToString for Circle {
    fn to_string(&self) -> String {
        format!("Circle of radius {:?}", self.radius)
    }
}

fn main() {
    let circle = Circle { radius: 6 };
    println!("{}", circle.to_string());
}
```

### 解析字符串

我们经常需要把字符串转成数字。完成这项工作的标准手段是用 `parse` 函数。我们得提供要转换到的类型，这可以通过不使用类型推断，或者用 “涡轮鱼” 语法（turbo fish，`<>`）实现。

只要对目标类型实现了 `FromStr` trait，就可以用 `parse` 把字符串转换成目标类型。 标准库中已经给无数种类型实现了 `FromStr`。如果要转换到用户定义类型，只要手动实现 `FromStr` 就行。

```rust
fn main() {
    let parsed: i32 = "5".parse().unwrap();
    let turbo_parsed = "10".parse::<i32>().unwrap();

    let sum = parsed + turbo_parsed;
    println!{"Sum: {:?}", sum};
}
```

## 字面量

对数值字面量，只要把类型作为后缀加上去，就完成了类型说明。比如指定字面量 42 的类型是 `i32`，只需要写 `42i32`。

无后缀的数值字面量，其类型取决于怎样使用它们。如果没有限制，编译器会对整数使用 `i32`，对浮点数使用 `f64`。

```rust
fn main() {
    // 带后缀的字面量，其类型在初始化时已经知道了。
    let x = 1u8;
    let y = 2u32;
    let z = 3f32;

    // 无后缀的字面量，其类型取决于如何使用它们。
    let i = 1;
    let f = 1.0;

    // `size_of_val` 返回一个变量所占的字节数
    println!("size of `x` in bytes: {}", std::mem::size_of_val(&x));
    println!("size of `y` in bytes: {}", std::mem::size_of_val(&y));
    println!("size of `z` in bytes: {}", std::mem::size_of_val(&z));
    println!("size of `i` in bytes: {}", std::mem::size_of_val(&i));
    println!("size of `f` in bytes: {}", std::mem::size_of_val(&f));
}
```

上面的代码使用了一些还没有讨论过的概念。心急的读者可以看看下面的简短解释：

- `fun(&foo)` 用传引用（pass by reference）的方式把变量传给函数，而非传值（pass by value，写法是 `fun(foo)`）。更多细节请看[借用](./borrowing.md)。
- `std::mem::size_of_val` 是一个函数，这里使用其完整路径（full path）调用。代码可以分成一些叫做模块（module）的逻辑单元。在本例中，`size_of_val` 函数是在 `mem` 模块中定义的，而 `mem` 模块又是在 `std` crate 中定义的。更多细节请看模块和crate.

## 类型推断

Rust 的类型推断引擎是很聪明的，它不只是在初始化时看看右值（`r-value`）的类型而已，它还会考察变量之后会怎样使用，借此推断类型。这是一个类型推导的进阶例子：

```rust
fn main() {
    // 因为有类型说明，编译器知道 `elem` 的类型是 u8。
    let elem = 5u8;

    // 创建一个空向量（vector，即不定长的，可以增长的数组）。
    let mut vec = Vec::new();
    // 现在编译器还不知道 `vec` 的具体类型，只知道它是某种东西构成的向量（`Vec<_>`）
    
    // 在向量中插入 `elem`。
    vec.push(elem);
    // 啊哈！现在编译器知道 `vec` 是 u8 的向量了（`Vec<u8>`）。
    // 试一试 ^ 注释掉 `vec.push(elem)` 这一行。

    println!("{:?}", vec);
}
```

## 别名

可以用 `type` 语句给已有的类型取个新的名字。类型的名字必须遵循驼峰命名法（像是 CamelCase 这样），否则编译器将给出警告。原生类型是例外，比如： `usize、f32`，等等。

```rust
// `NanoSecond` 是 `u64` 的新名字。
type NanoSecond = u64;
type Inch = u64;

// 通过这个属性屏蔽警告。
#[allow(non_camel_case_types)]
type u64_t = u64;
// 试一试 ^ 移除上面那个属性

fn main() {
    // `NanoSecond` = `Inch` = `u64_t` = `u64`.
    let nanoseconds: NanoSecond = 5 as u64_t;
    let inches: Inch = 2 as u64_t;

    // 注意类型别名*并不能*提供额外的类型安全，因为别名*并不是*新的类型。
    println!("{} nanoseconds + {} inches = {} unit?",
             nanoseconds,
             inches,
             nanoseconds + inches);
}
```

别名的主要用途是避免写出冗长的模板化代码（boilerplate code）。如 `IoResult<T>` 是 `Result<T, IoError>` 类型的别名。