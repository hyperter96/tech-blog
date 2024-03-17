---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/rust-cover6.jpeg
date: 2023-11-07
tag:
  - Rust
  - 编程基础
sticky: 1
prev:
  text: 'Rust基础知识系列五：类型系统'
  link: '/posts/programming/rust/types-system'
next:
  text: 'Rust基础知识系列七：所有权'
  link: '/posts/programming/rust/ownership'
---

# Rust基础知识系列六：函数

Rust 的函数我们在之前已经见过不少，跟其他语言几乎没有什么区别。因此本章的学习之路将轻松和愉快，骚年们，请珍惜这种愉快，下一章你将体验到不一样的 Rust。

在函数界，有一个函数只闻其名不闻其声，可以止小孩啼！在程序界只有 hello,world! 可以与之媲美，它就是 `add` 函数：

```rust
fn add(i: i32, j: i32) -> i32 {
   i + j
}
```

## 函数要点

- 函数名和变量名使用蛇形命名法(snake case)，例如 `fn add_two() -> {}`
- 函数的位置可以随便放，Rust 不关心我们在哪里定义了函数，只要有定义即可
- 每个函数参数都需要标注类型

## 函数参数

Rust 是强类型语言，因此需要你为每一个函数参数都标识出它的具体类型，例如：

```rust
fn main() {
    another_function(5, 6.1);
}

fn another_function(x: i32, y: f32) {
    println!("The value of x is: {}", x);
    println!("The value of y is: {}", y);
}
```
`another_function` 函数有两个参数，其中 `x` 是 `i32` 类型，`y` 是 `f32` 类型，然后在该函数内部，打印出这两个值。

## 函数返回

我们有提到，在 Rust 中函数就是表达式，因此我们可以把函数的返回值直接赋给调用者。

函数的返回值就是函数体最后一条表达式的返回值，当然我们也可以使用 `return` 提前返回，下面的函数使用最后一条表达式来返回一个值：

```rust
fn plus_five(x:i32) -> i32 {
    x + 5
}

fn main() {
    let x = plus_five(5);

    println!("The value of x is: {}", x);
}
```
`x + 5` 是一条表达式，求值后，返回一个值，因为它是函数的最后一行，因此该表达式的值也是函数的返回值。

再来看两个重点：

- `let x = plus_five(5)`，说明我们用一个函数的返回值来初始化 `x` 变量，因此侧面说明了在 Rust 中函数也是表达式，这种写法等同于 `let x = 5 + 5;`
- `x + 5` 没有分号，因为它是一条表达式，这个在上一节中我们也有详细介绍

再来看一段代码，同时使用 `return` 和表达式作为返回值：

```rust
fn plus_or_minus(x:i32) -> i32 {
    if x > 5 {
        return x - 5
    }

    x + 5
}

fn main() {
    let x = plus_or_minus(5);

    println!("The value of x is: {}", x);
}
```

`plus_or_minus` 函数根据传入 `x` 的大小来决定是做加法还是减法，若 `x > 5` 则通过 `return` 提前返回 `x - 5` 的值,否则返回 `x + 5` 的值。

### Rust 中的特殊返回类型

对于 Rust 新手来说，有些返回类型很难理解，而且如果你想通过百度或者谷歌去搜索，都不好查询，因为这些符号太常见了，根本难以精确搜索到。

1. 无返回值 `()`

例如单元类型 `()`，是一个零长度的元组。它没啥作用，但是可以用来表达一个函数没有返回值：

- 函数没有返回值，那么返回一个 `()`
- 通过 `;` 结尾的语句返回一个 `()`
例如下面的 `report` 函数会隐式返回一个 `()`：

```rust
use std::fmt::Debug;

fn report<T: Debug>(item: T) {
  println!("{:?}", item);

}
```

与上面的函数返回值相同，但是下面的函数显式的返回了 `()`：

```rust
fn clear(text: &mut String) -> () {
  *text = String::from("");
}
```

2. 永不返回的发散函数 `!`

当用 `!` 作函数返回类型的时候，表示该函数永不返回( diverge function )，特别的，这种语法往往用做会导致程序崩溃的函数：

```rust
fn dead_end() -> ! {
  panic!("你已经到了穷途末路，崩溃吧！");
}
```
下面的函数创建了一个无限循环，该循环永不跳出，因此函数也永不返回：

```rust
fn forever() -> ! {
  loop {
    //...
  };
}
```