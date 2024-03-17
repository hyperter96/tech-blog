---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/background3.jpeg
date: 2023-11-01
tag:
  - Rust
  - 编程基础
---

# 如何在Rust示例中禁用未使用的代码警告

## 错误提示

在Rust代码中，有时你声明了一个变量、类型或定义了一些东西，但在代码中从未使用过，这时就会抛出一个错误。

比如说。

你声明了一个结构体，但从未构造过字段

```rust
struct Employee;

fn main() {
    println!("Hello World")
}
```

运行上述程序会产生警告：结构从未被构建。

```bash
warning: struct is never constructed: `Employee`
 --> code.rs:1:8
  |
1 | struct Employee;
  |        ^^^^^^^^
  |
  = note: `#[warn(dead_code)]` on by default

warning: 1 warning emitted
Hello World
```

让我们看看另一个例子 在这个例子中，声明了变量，但从未使用。

```rust
fn main() {
    let str = "Hello John";
    println!("Hello World")
}
```
它抛出了一个`warning: unused variable:`
```bash
warning: unused variable: `str`
 --> code.rs:4:9
  |
4 |     let str = "helo";
  |         ^^^ help: if this is intentional, prefix it with an underscore: `_str`
  |
  = note: `#[warn(unused_variables)]` on by default

warning: 1 warning emitted

Hello World
```

所以所有这些警告都是在编译和运行代码时抛出的。

## 如何禁用Rust中的未使用代码警告？

有多种方法可以解决未使用代码的警告。

### 使用`allow`属性

首先，在代码中对函数结构和对象使用`allow`属性。

在死代码前添加`#[allow(dead_code)]` 代码

```rust
#[allow(dead_code)]
struct Employee;

fn main() {
    println!("Hello World")
}
```

运行上面的程序，就可以禁用该警告

所以对于`unused_variables`错误，你可以添加`#![allow(unused_variables)]` 。

为了避免代码中的警告，你必须在rust代码文件的开头添加以下代码。

```rust
#![allow(dead_code)]
#![allow(unused_variables)]
```

所以下面的代码不会抛出警告

```rust
#![allow(dead_code)]
#![allow(unused_variables)]
fn main() {
    let str = "Hello John";
    println!("Hello World")
}
```
### 使用crate属性

第二种方法，使用crate属性#！[attribute{argument}] 语法

接下来，将这个参数(`dead_code`)传递给rust编译器。`-A`

```bash
rustc -A dead_code hello.rs
```
### 添加下划线`_`

第三种方法，在变量、函数、结构的名称中加入下划线（`_`）。

下面的代码通过在一个变量上添加`_`来禁用警告。

```rust
fn main() {
    let _str = "Hello John";
    println!("Hello World")
}
```