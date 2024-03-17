---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/rust-cover8.jpg
date: 2023-11-09
tag:
  - Rust
  - 编程基础
sticky: 1
prev:
  text: 'Rust基础知识系列七：所有权'
  link: '/posts/programming/rust/ownership'
---

# Rust基础知识系列八：引用与借用

上节中提到，如果仅仅支持通过转移所有权的方式获取一个值，那会让程序变得复杂。 Rust 能否像其它编程语言一样，使用某个变量的指针或者引用呢？答案是可以。

Rust 通过 借用(Borrowing) 这个概念来达成上述的目的，获取变量的引用，称之为借用(borrowing)。正如现实生活中，如果一个人拥有某样东西，你可以从他那里借来，当使用完毕后，也必须要物归原主。

## 引用与解引用

常规引用是一个指针类型，指向了对象存储的内存地址。在下面代码中，我们创建一个 `i32` 值的引用 `y`，然后使用解引用运算符来解出 `y` 所使用的值:

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```
变量 `x` 存放了一个 `i32` 值 5。`y` 是 `x` 的一个引用。可以断言 `x` 等于 5。然而，如果希望对 `y` 的值做出断言，必须使用 `*y` 来解出引用所指向的值（也就是解引用）。一旦解引用了 `y`，就可以访问 `y` 所指向的整型值并可以与 5 做比较。

## 不可变引用

下面的代码，我们用 `s1` 的引用作为参数传递给 `calculate_length` 函数，而不是把 `s1` 的所有权转移给该函数：

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

能注意到两点：

1. 无需像上章一样：先通过函数参数传入所有权，然后再通过函数返回来传出所有权，代码更加简洁
2. `calculate_length` 的参数 `s` 类型从 `String` 变为 `&String`

这里，`&` 符号即是引用，它们允许你使用值，但是不获取所有权，如图所示：

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/borrowing-1.jpg)

通过 `&s1` 语法，我们创建了一个指向 `s1` 的引用，但是并不拥有它。因为并不拥有这个值，当引用离开作用域后，其指向的值也不会被丢弃。

同理，函数 `calculate_length` 使用 `&` 来表明参数 `s` 的类型是一个引用：

```rust
fn calculate_length(s: &String) -> usize { // s 是对 String 的引用
    s.len()
} // 这里，s 离开了作用域。但因为它并不拥有引用值的所有权，
  // 所以什么也不会发生
```
人总是贪心的，可以拉女孩小手了，就想着抱抱柔软的身子（读者中的某老司机表示，这个流程完全不对），因此光借用已经满足不了我们了，如果尝试修改借用的变量呢？

```rust
fn main() {
    let s = String::from("hello");

    change(&s);
}

fn change(some_string: &String) {
    some_string.push_str(", world");
}
```
很不幸，妹子你没抱到，哦口误，你修改错了：

```bash
error[E0596]: cannot borrow `*some_string` as mutable, as it is behind a `&` reference
 --> src/main.rs:8:5
  |
7 | fn change(some_string: &String) {
  |                        ------- help: consider changing this to be a mutable reference: `&mut String`
                           ------- 帮助：考虑将该参数类型修改为可变的引用: `&mut String`
8 |     some_string.push_str(", world");
  |     ^^^^^^^^^^^ `some_string` is a `&` reference, so the data it refers to cannot be borrowed as mutable
                     `some_string`是一个`&`类型的引用，因此它指向的数据无法进行修改
```

正如变量默认不可变一样，引用指向的值默认也是不可变的，没事，来一起看看如何解决这个问题。