---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/rust-and-wasm-cover.png
date: 2024-03-11
tag:
  - Rust
  - WebAssembly
  - 全栈开发
sticky: 1
prev:
  text: 'WebAssembly系列一：Rust Web 全栈开发之编写 WebAssembly 应用'
  link: '/posts/programming/webassembly/webassembly-full-stack-app'
---

# WebAssembly系列二：使用 WasmEdge Rust SDK 构建并运行 WebAssembly 应用程序

在本文中，我们将介绍如何创建 WebAssembly 应用程序[^wasm]（也是 wasm 应用程序）以及如何在 WasmEdge 运行时上运行它。

> WebAssembly 应用程序是一个常见的应用程序，但编译为 WebAssembly 二进制文件而不是通用执行二进制文件。 wasm 应用程序在 WebAssembly 环境中运行。 为了方便起见，我们通常将其称为 wasm 应用程序。

[^wasm]: [WebAssembly 应用程序](https://webassembly.org/)

## 架构

我们将为本教程创建两个单独的项目：

- `wasm-app` 项目创建了一个 wasm 应用程序，其中屏幕上打印出一条简单的问候消息。
- `run-wasm-app` 项目创建一个 WasmEdge Vm 实例，加载 `wasm-app` 的二进制文件并通过 WasmEdge Runtime 运行它。

本教程中使用的项目的架构图如下所示：绿色矩形是我们将创建的两个项目，蓝色矩形是依赖项。

![](https://cdn.jsdelivr.net/gh/second-state/wasmedge-rustsdk-examples/run-wasm-app-from-host/architecture.png)

## 前置条件

- 操作系统：Ubuntu-20.04+、macOS-11+、Windows WSL2
- 安装 `rustup` 和 Rust

    按照 Rust-lang 官方网站上的说明安装 rustup 和 Rust<sup>[2]</sup>； 然后，在终端程序中运行以下命令将 `wasm32-wasi`<sup>[3]</sup> 目标添加到工具链：

    ```bash
    // 将 wasm32-wasi 编译目标添加到工具链中
    rustup 目标添加 wasm32-wasi
    ```

    > [2] Rust语言版本应为1.63或以上。
    >
    > [3] wasm32-wasi目标介绍

- 安装 WasmEdge 运行时库

    WasmEdge 运行时库 (libwasmedge) 是一个 C++ 库，它提供 WebAssembly 运行时。 在本教程中我们使用 WasmEdge v0.13.5。 Wasmedge Book 的[安装和卸载部分](https://wasmedge.org/book/en/quick_start/install.html)给出了安装方法，或者您也可以在终端程序中运行以下指令进行安装：

    ```bash
    // Download and run the installation script
    // The wasmedge library and other relevant files will be installed in the directory of $HOME/.wasmedge
    curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install.sh | bash
    
    // Make the installed binary available in the current session of your terminal program
    source $HOME/.wasmedge/env
    ```

## 构建应用程序

让我们创建一个名为`run-wasm-app-from-host`的目录，我们将在其中完成所有编码工作：

```bash
mkdir run-wasm-app-from-host
cd run-wasm-app-from-host
```

### 步骤一：创建wasm应用程序`wasm-app`

创建 wasm 应用程序项目和普通 Rust 应用程序项目没有区别。 在终端程序中，运行以下命令：

```bash
// in run-wasm-app-from-host/
// create a Rust application named `wasm-app`
cargo new wasm-app --bin
```

此命令将创建一个名为 `wasm-app` 的目录，其中包含样板 Rust 应用程序。 让我们导航到 `wasm-app/src` 目录，打开 `main.rs` 并在 `main` 函数中添加以下代码：

```rust
// run-wasm-app-from-host/wasm-app/src/main.rs

fn main() {
  // add the following line
  println!("Greetings from wasm-app!");
}
```

当稍后调用 wasm 应用程序时，它会打印消息 `Greetings from wasm-app!` 在你的终端程序中。

### 步骤二：编译`wasm-app`

现在让我们将 wasm 应用程序编译成 wasm 二进制文件。 为此，只需在终端程序`run-wasm-app-from-host`目录中运行以下命令：

```bash
cargo build -p wasm-app --target wasm32-wasi --release
```

该命令会将 wasm 应用程序编译成位于目录中的 `wasm-app.wasm` 文件 `./target/wasm32-wasi/release/`

### 步骤三：创建主程序`run-wasm-app`

在此步骤中，我们将创建一个 wasm 主机应用程序，通过它来运行 wasm 应用程序。 在`run-wasm-app-from-host`根目录下运行以下命令

```bash
cargo new run-wasm-app --bin
```

#### 添加依赖

在 `main.rs` 中添加任何代码之前，我们将为该项目添加依赖项。 让我们导航到 `run-wasm-app` 目录，打开 `run-wasm-app` 目录中的 `Cargo.toml`，并在 `[dependencies]` 部分添加 `wasmedge-sdk`：

```toml
[package]
edition = "2021"
name = "run-wasm-app"
version = "0.1.0"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
wasmedge-sdk = "0.13.2"  // add `wasmedge-sdk` crate
```

`wasmedge-sdk` crate 定义了一组高级 Rust API。 例如，我们可以使用它们来创建和管理 WasmEdge 虚拟机、在其中运行某些内容等等。

现在，让我们打开 `run-wasm-app/src` 目录中的 `main.rs` 文件，将一些必要的类型导入到我们的项目中，并对 `main` 函数进行一些更改<sup>[4]</sup>：

```rust
use wasmedge_sdk::{
    config::{CommonConfigOptions, ConfigBuilder, HostRegistrationConfigOptions},
    params, VmBuilder,
};

fn main() -> Result<(), Box<dyn std::error::Error>> {

    Ok(())
}
```

> [4] 我们在原来的 `main` 函数中添加了一个返回类型，这样我们就可以使用 `?` 操作符以避免大量的 `unwrap` 或 `Expect` 方法并使代码简洁。

#### 创建WasmEdge VM实例

在 WasmEdge Runtime 中，Vm 实例通过 `wasi` 接口运行 wasm 应用程序。 因此，当我们创建 Vm 实例时，我们将启用 `wasi` 选项的 `Config` 实例作为参数传递。 由于启用了 `wasi` 选项，在创建新的 Vm 实例时还会创建一个名为`wasi_snapshot_preview1`的默认 `wasi` 模块。

```rust
...

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let wasm_app_file = std::env::args().nth(1).expect("Please specify a wasm file");

    // create a config with the `wasi` option enabled
    let config = ConfigBuilder::new(CommonConfigOptions::default())
        .with_host_registration_config(HostRegistrationConfigOptions::default().wasi(true))
        .build()?;
    assert!(config.wasi_enabled());

    // create a VM with the config
    let mut vm = VmBuilder::new().with_config(config).build()?;

    Ok(())
}
```

#### 初始化默认wasi模块

:::warning 注意📢：
要使用默认 `wasi` 模块中的导出函数，需要使用用户指定的必要参数来初始化默认 `wasi` 模块。 在此示例中，我们仅将三个默认值 `None` 传递给初始化方法。
:::

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {

    ...

    // get the default wasi module in Vm, and then
  	// initialize it with the default arguments
    vm.wasi_module_mut()
        .expect("Not found wasi module")
        .initialize(None, None, None);

    Ok(())
}
```

#### 注册并运行wasm程序`wasm-app.wasm`

在前面的步骤中，我们已经设置了一个 WasmEdge Vm 实例，现在，我们可以将 wasm 应用程序注册到 Vm 实例中并运行它。 `wasmedge-sdk` crate 在 Vm 对象中定义了三个 API 用于注册 wasm 模块：

- `register_module_from_file` 将给定 wasm 文件中的 wasm 模块注册到 Vm 实例中。
- `register_module_from_bytes` 将给定内存中 wasm 字节中的 wasm 模块注册到 Vm 实例中。
- `register_module` 将编译后的 wasm 模块注册到 Vm 实例中。

在本教程中，我们使用 `register_module_from_file` API 将 `wasm-app.wasm` 文件直接注册到 Vm 实例中：

```rust
...
fn main() -> Result<(), Box<dyn std::error::Error>> {

    ...

    // register the `wasm-app.wasm` file as a wasm module named "wasm-app" into vm
    vm.register_module_from_file("wasm-app", &wasm_app_file)?
        .run_func(Some("wasm-app"), "_start", params!())?;

    Ok(())
}
```
现在，我们通过调用 `wasm-app` wasm 模块中的 `_start`<sup>[5]</sup> wasm 函数来运行 wasm 应用程序。

> [5] wasm 应用程序中的 `main` 函数导出为名为 `_start` 的 `wasm` 函数。

### 步骤四：运行`run-wasm-app`调用`wasm-app`

到目前为止我们已经完成了所有的编码任务。 我们可以导航到终端程序中的`run-wasm-app-from-host/run-wasm-app`目录，然后运行以下命令：

```bash
cargo run -p run-wasm-app -- ./target/wasm32-wasi/release/wasm-app.wasm
```

如果命令成功运行，则屏幕上会打印以下消息：

```bash
Greetings from wasm-app!
```