---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/rust-cover.png
date: 2023-11-02
tag:
  - Rust
  - 编程基础
sticky: 1
next:
  text: 'Rust基础知识系列二：语句、表达式和函数'
  link: '/posts/programming/rust/rust-function'
---

# Rust基础知识系列一：认识Cargo

作为一门现代化语言，Rust 吸收了多个语言的包管理优点，为大家提供超级大杀器： `cargo`，真的，再挑剔的开发者，都对它赞不绝口。👍

总而言之，`cargo` 提供了一系列的工具，从项目的建立、构建到测试、运行直至部署，为 Rust 项目的管理提供尽可能完整的手段。同时，与 Rust 语言及其编译器 `rustc` 紧密结合，可以说用了后就忘不掉，如同初恋般的感觉。

## 创建HelloWorld项目

上文提到，Rust 语言的包管理工具是 `cargo`。不过，我们无需再手动安装，之前安装 Rust 的时候，就已经一并安装了。

当我们想要创建一个项目时，譬如创建`hello_world`项目，

```bash
cargo new hello_world
```

会生成以下目录结构：

```shell
hello_world/          
├── src
│   └── main.rs
├── target
│   ├── .rustc_info.json          
│   └── debug
│       ├── .cargo-lock
│       ├── hello_world
│       ├── hello_world.d
│       ├── .fingerprint/
│       ├── build/
│       ├── deps/
│       ├── examples/
│       └── incrementals/
├── .gitignore
├── Cargo.lock # 同一项目的 toml 文件生成的项目依赖详细清单，一般不用修改
└── Cargo.toml # 存储了项目的所有元配置信息
```

## `cargo check`

当项目大了后，`cargo run` 和 `cargo build` 不可避免的会变慢，那么有没有更快的方式来验证代码的正确性呢？大杀器来了，接着！

`cargo check` 是我们在代码开发过程中最常用的命令，它的作用很简单：快速的检查一下代码能否编译通过。因此该命令速度会非常快，能节省大量的编译时间。

```bash
$ cargo check
    Checking world_hello v0.1.0 (/root/go/src/rust-learning/hello_world)
    Finished dev [unoptimized + debuginfo] target(s) in 0.06s
```

## `Cargo.toml` 和 `Cargo.lock`

`Cargo.toml` 和 `Cargo.lock` 是 `cargo` 的核心文件，它的所有活动均基于此二者。

- `Cargo.toml` 是 `cargo` 特有的项目数据描述文件。它存储了项目的所有元配置信息，如果 Rust 开发者希望 Rust 项目能够按照期望的方式进行构建、测试和运行，那么，必须按照合理的方式构建 `Cargo.toml`。
- `Cargo.lock` 文件是 `cargo` 工具根据同一项目的 `toml` 文件生成的项目依赖详细清单，因此我们一般不用修改它，只需要对着 `Cargo.toml` 文件撸就行了。

> [!IMPORTANT] 提问
> 什么情况下该把 `Cargo.lock` 上传到 git 仓库里？
>
> 很简单，当你的项目是一个可运行的程序时，就上传 `Cargo.lock`，如果是一个依赖库项目，那么请把它添加到 `.gitignore` 中

### `package` 配置段落
`package` 中记录了项目的描述信息，典型的如下：

```toml
[package]
name = "world_hello"
version = "0.1.0"
edition = "2021"
```
`name` 字段定义了项目名称，`version` 字段定义当前版本，新项目默认是 `0.1.0`，`edition` 字段定义了我们使用的 Rust 大版本。因为本书很新（不仅仅是现在新，未来也将及时修订，跟得上 Rust 的小步伐），所以使用的是 Rust edition 2021 大版本。

### 定义项目依赖

使用 `cargo` 工具的最大优势就在于，能够对该项目的各种依赖项进行方便、统一和灵活的管理。

在 `Cargo.toml` 中，主要通过各种依赖段落来描述该项目的各种依赖项：

- 基于 Rust 官方仓库 crates.io，通过版本说明来描述
- 基于项目源代码的 git 仓库地址，通过 URL 来描述
- 基于本地项目的绝对路径或者相对路径，通过类 Unix 模式的路径来描述

这三种形式具体写法如下：

```toml
[dependencies]
rand = "0.3"
hammer = { version = "0.5.0"}
color = { git = "https://github.com/bjz/color-rs" }
geometry = { path = "crates/geometry" }
```