---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/rust-cover2.png
date: 2023-11-03
tag:
  - Rust
  - 编程基础
sticky: 1
prev:
  text: 'Rust基础知识系列一：认识Cargo'
  link: '/posts/programming/rust/get-to-know-cargo'
next:
  text: 'Rust基础知识系列三：数据基础类型'
  link: '/posts/programming/rust/fundamental-type'
---

# Rust基础知识系列二：语句、表达式、格式化输出

Rust 的函数体是由一系列语句组成，最后由一个表达式来返回值，例如：

```rust
fn add_with_extra(x: i32, y: i32) -> i32 {
    let x = x + 1; // 语句
    let y = y + 5; // 语句
    x + y // 表达式
}
```

语句会执行一些操作但是不会返回一个值，而表达式会在求值后返回一个值，因此在上述函数体的三行代码中，前两行是语句，最后一行是表达式。

对于 Rust 语言而言，这种基于语句（statement）和表达式（expression）的方式是非常重要的，你需要能明确的区分这两个概念, 但是对于很多其它语言而言，这两个往往无需区分。基于表达式是函数式语言的重要特征，表达式总要返回值。

其实，在此之前，我们已经多次使用过语句和表达式。

## 语句

```rust
let a = 8;
let b: Vec<f64> = Vec::new();
let (a, c) = ("hi", false);
```

以上都是语句，它们完成了一个具体的操作，但是并没有返回值，因此是语句。

## 表达式

表达式会进行求值，然后返回一个值。例如 `5 + 6`，在求值后，返回值 11，因此它就是一条表达式。

表达式可以成为语句的一部分，例如 let `y = 6` 中，6 就是一个表达式，它在求值后返回一个值 6（有些反直觉，但是确实是表达式）。

调用一个函数是表达式，因为会返回一个值，调用宏也是表达式，用花括号包裹最终返回一个值的语句块也是表达式，总之，能返回值，它就是表达式:

```rust
fn main() {
    let y = {
        let x = 3;
        x + 1
    };

    println!("The value of y is: {}", y);
}
```
上面使用一个语句块表达式将值赋给 `y` 变量，语句块长这样：

```rust
{
    let x = 3;
    x + 1
}
```
该语句块是表达式的原因是：它的最后一行是表达式，返回了 `x + 1` 的值，注意 `x + 1` 不能以分号结尾，否则就会从表达式变成语句， 表达式不能包含分号。这一点非常重要，一旦你在表达式后加上分号，它就会变成一条语句，再也不会返回一个值，请牢记！

最后，表达式如果不返回任何值，会隐式地返回一个 `()` 。

```rust
fn main() {
    assert_eq!(ret_unit_type(), ())
}

fn ret_unit_type() {
    let x = 1;
    // if 语句块也是一个表达式，因此可以用于赋值，也可以直接返回
    // 类似三元运算符，在Rust里我们可以这样写
    let y = if x % 2 == 1 {
        "odd"
    } else {
        "even"
    };
    // 或者写成一行
    let z = if x % 2 == 1 { "odd" } else { "even" };
}
```

## 格式化输出

### `fmt::Display`

`fmt::Debug` 通常看起来不太简洁，因此自定义输出的外观经常是更可取的。这需要通过手动实现 `fmt::Display` 来做到。`fmt::Display` 采用 `{}` 标记。实现方式看起来像这样：

```rust
// （使用 `use`）导入 `fmt` 模块使 `fmt::Display` 可用
use std::fmt;

// 定义一个结构体，咱们会为它实现 `fmt::Display`。以下是个简单的元组结构体
// `Structure`，包含一个 `i32` 元素。
struct Structure(i32);

// 为了使用 `{}` 标记，必须手动为类型实现 `fmt::Display` trait。
impl fmt::Display for Structure {
    // 这个 trait 要求 `fmt` 使用与下面的函数完全一致的函数签名
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // 仅将 self 的第一个元素写入到给定的输出流 `f`。返回 `fmt:Result`，此
        // 结果表明操作成功或失败。注意 `write!` 的用法和 `println!` 很相似。
        write!(f, "{}", self.0)
    }
}
```
`fmt::Display` 的效果可能比 `fmt::Debug` 简洁，但对于 `std` 库来说，这就有一个问题。模棱两可的类型该如何显示呢？举个例子，假设标准库对所有的 `Vec<T>` 都实现了同一种输出样式，那么它应该是哪种样式？下面两种中的一种吗？

- `Vec<path>：/:/etc:/home/username:/bin`（使用 : 分割）
- `Vec<number>：1,2,3`（使用 , 分割）

我们没有这样做，因为没有一种合适的样式适用于所有类型，标准库也并不擅自规定一种样式。对于 `Vec<T>` 或其他任意泛型容器（generic container），`fmt::Display` 都没有实现。因此在这些泛型的情况下要用 `fmt::Debug`。

这并不是一个问题，因为对于任何非泛型的容器类型， `fmt::Display` 都能够实现。

```rust
use std::fmt; // 导入 `fmt`

// 带有两个数字的结构体。推导出 `Debug`，以便与 `Display` 的输出进行比较。
#[derive(Debug)]
struct MinMax(i64, i64);

// 实现 `MinMax` 的 `Display`。
impl fmt::Display for MinMax {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // 使用 `self.number` 来表示各个数据。
        write!(f, "({}, {})", self.0, self.1)
    }
}

// 为了比较，定义一个含有具名字段的结构体。
#[derive(Debug)]
struct Point2D {
    x: f64,
    y: f64,
}

// 类似地对 `Point2D` 实现 `Display`
impl fmt::Display for Point2D {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // 自定义格式，使得仅显示 `x` 和 `y` 的值。
        write!(f, "x: {}, y: {}", self.x, self.y)
    }
}

fn main() {
    let minmax = MinMax(0, 14);

    println!("Compare structures:");
    println!("Display: {}", minmax);
    println!("Debug: {:?}", minmax);

    let big_range =   MinMax(-300, 300);
    let small_range = MinMax(-3, 3);

    println!("The big range is {big} and the small is {small}",
             small = small_range,
             big = big_range);

    let point = Point2D { x: 3.3, y: 7.2 };

    println!("Compare points:");
    println!("Display: {}", point);
    println!("Debug: {:?}", point);

    // 报错。`Debug` 和 `Display` 都被实现了，但 `{:b}` 需要 `fmt::Binary`
    // 得到实现。这语句不能运行。
    // println!("What does Point2D look like in binary: {:b}?", point);
}
```

`fmt::Display` 被实现了，而 `fmt::Binary` 没有，因此 `fmt::Binary` 不能使用。 `std::fmt` 有很多这样的 `trait`，它们都要求有各自的实现。这些内容将在后面的 `std::fmt` 章节中详细介绍。

### 练习

:::details 给 `Matrix` 结构体 加上 `fmt::Display trait`，这样当你从 `Debug` 格式化 `{:?}` 切换到 `Display` 格式化 `{}` 时，会得到如下的输出：<br> `( 2.1 2.2 )` </br><br> `( 2.3 2.4 )` </br>

```rust
// （使用 `use`）导入 `fmt` 模块使 `fmt::Display` 可用
use std::fmt;

// 定义一个结构体，咱们会为它实现 `fmt::Display`。以下是个简单的元组结构体
struct Matrix(f64, f64, f64, f64);
// 为了使用 `{}` 标记，必须手动为类型实现 `fmt::Display` trait。
impl fmt::Display for Matrix {
    // 这个 trait 要求 `fmt` 使用与下面的函数完全一致的函数签名
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // 将 self 的第一个到第四个元素写入到给定的输出流 `f`。返回 `fmt:Result`，此
        // 结果表明操作成功或失败。注意 `write!` 的用法和 `println!` 很相似。
        write!(f, "({}, {})\n({}, {})", self.0, self.1, self.2, self.3)
    }
}

fn main() {
    println!("{}", Matrix(2.1, 2.2, 2.3, 2.4));
}
```

输出：
```bash
$ cargo run
   Compiling hello_world v0.1.0 (/root/go/src/rust-learning/hello_world)
    Finished dev [unoptimized + debuginfo] target(s) in 0.26s
     Running `target/debug/hello_world`
(2.1, 2.2)
(2.3, 2.4)
```