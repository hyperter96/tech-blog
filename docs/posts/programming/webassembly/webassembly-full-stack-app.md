---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/rust-and-wasm-cover.png
date: 2024-03-02
tag:
  - Rust
  - WebAssembly
  - 全栈开发
sticky: 1
---

# WebAssembly系列一：Rust Web 全栈开发之编写 WebAssembly 应用

## WebAssembly介绍

### 什么是 WebAssembly？

WebAssembly 是一种新的编码方式，可以在现代浏览器中运行

- 它是一种低级的类汇编语言
- 具有紧凑的二进制格式
- 可以接近原生的性能运行
- 并为 C/C ++ 、 C# 、 Rust 等语言提供一个编译目标，以便它们可以在 Web上运行
- 它也被设计为可以与 JavaScript 共存，允许两者一起工作

### WebAssembly 是什么样的？

- 文本格式 `.wat`
- 二进制格式： `.wasm`

### WebAssembly 能做什么？

- 可以把你编写 C/C++ 、 C# 、 Rust 等语言的代码编译成 WebAssembly 模块
- 你可以在 Web 应用中加载该模块，并通过 JavaScript 调用它
- 它并不是为了替代 JS ，而是与 JS 一起工作
- 仍然需要 HTML 和 JS ，因为WebAssembly 无法访问平台 API ，例如 DOM ， WebGL...

### WebAssembly 的优点

- 快速、高效、可移植

    - 通过利用常见的硬件能力， WebAssembly 代码在不同平台上能够以接近本地速度运行。
- 可读、可调试

    - WebAssembly 是一门低阶语言，但是它有确实有一种人类可读的文本格式（其标准最终版本目前仍在编制），这允许通过手工来写代码，看代码以及调试代码。
- 保持安全
    
    - WebAssembly 被限制运行在一个安全的沙箱执行环境中。像其他网络代码一样，它遵循浏览器的同源策略和授权策略。
- 不破坏网络

    - WebAssembly 的设计原则是与其他网络技术和谐共处并保持向后兼容。

## demo开发

### 安装依赖

```bash
$ cargo install wasm-pack
$ cargo install cargo-generate
$ cargo generate --git https://github.com/rustwasm/wasm-pack-template
🤷   Project Name: demo
🔧   Destination: /root/go/src/demo ...
🔧   project-name: demo ...
🔧   Generating template ...
```

### 修改`src/lib.rs`

```rust
mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(s : &str) {
    alert(format!("Hello, {}!", s).as_str());
}
```
### 构建wasm app

执行
```bash
$ wasm-pack build
```
:::warning 注意📢：
需要有`clang`安装，如果在Ubuntu开发环境下，需要
```bash
sudo apt install clang
```
:::


### Npm初始化项目

```bash
$ npm init wasm-app www
🦀 Rust + 🕸 Wasm = ❤
```
然后，

:::details `www/package.json`
```json
{
  "name": "create-wasm-app",
  "version": "0.1.0",
  "description": "create an app to consume rust-generated wasm packages",
  "main": "index.js",
  "bin": {
    "create-wasm-app": ".bin/create-wasm-app.js"
  },
  "scripts": {
    "build": "webpack --config webpack.config.js",
    "start": "webpack-dev-server"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/rustwasm/create-wasm-app.git"
  },
  "keywords": [
    "webassembly",
    "wasm",
    "rust",
    "webpack"
  ],
  "author": "Ashley Williams <ashley666ashley@gmail.com>",
  "license": "(MIT OR Apache-2.0)",
  "bugs": {
    "url": "https://github.com/rustwasm/create-wasm-app/issues"
  },
  "homepage": "https://github.com/rustwasm/create-wasm-app#readme",
  "dependencies": { // [!code ++]
    "demo": "file:../pkg" // [!code ++]
  }, // [!code ++]
  "devDependencies": {
    "hello-wasm-pack": "^0.1.0",
    "webpack": "^4.29.3",
    "webpack-cli": "^3.1.0",
    "webpack-dev-server": "^3.1.5",
    "copy-webpack-plugin": "^5.0.0"
  }
}
```
:::

安装依赖，
```bash
$ cd www
$ npm install
```
修改`www/index.js`,
```js
import * as wasm from "demo";

wasm.greet("Peter");
```

### web运行

```bash
$ npm run start
```

:::warning 注意📢：
如果运行出现这个错误`Error: error:0308010C:digital envelope routines::unsupported`,则需要通过
```bash
$ export NODE_OPTIONS=--openssl-legacy-provider
```
消除`webpack`不兼容的影响。
:::

执行如下代表成功，

```bash
$ npm run start

> create-wasm-app@0.1.0 start
> webpack-dev-server

(node:2497626) [DEP0111] DeprecationWarning: Access to process.binding('http_parser') is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)
ℹ ｢wds｣: Project is running at http://localhost:8080/
ℹ ｢wds｣: webpack output is served from /
ℹ ｢wds｣: Content not from webpack is served from /root/go/src/demo/www
ℹ ｢wdm｣: Hash: cb5760471c404d115b68
Version: webpack 4.43.0
Time: 505ms
Built at: 03/24/2024 8:29:31 PM
                           Asset       Size  Chunks                         Chunk Names
                  0.bootstrap.js   7.21 KiB       0  [emitted]              
                    bootstrap.js    369 KiB    main  [emitted]              main
de18e03fce6747184336.module.wasm   16.9 KiB       0  [emitted] [immutable]  
                      index.html  308 bytes          [emitted]              
Entrypoint main = bootstrap.js
[0] multi (webpack)-dev-server/client?http://localhost:8080 ./bootstrap.js 40 bytes {main} [built]
[../pkg/demo.js] 139 bytes {0} [built]
[./bootstrap.js] 284 bytes {main} [built]
[./index.js] 55 bytes {0} [built]
[./node_modules/ansi-html/index.js] 4.16 KiB {main} [built]
[./node_modules/ansi-regex/index.js] 135 bytes {main} [built]
[./node_modules/strip-ansi/index.js] 161 bytes {main} [built]
[./node_modules/webpack-dev-server/client/index.js?http://localhost:8080] (webpack)-dev-server/client?http://localhost:8080 4.29 KiB {main} [built]
[./node_modules/webpack-dev-server/client/overlay.js] (webpack)-dev-server/client/overlay.js 3.51 KiB {main} [built]
[./node_modules/webpack-dev-server/client/socket.js] (webpack)-dev-server/client/socket.js 1.53 KiB {main} [built]
[./node_modules/webpack-dev-server/client/utils/createSocketUrl.js] (webpack)-dev-server/client/utils/createSocketUrl.js 2.91 KiB {main} [built]
[./node_modules/webpack-dev-server/client/utils/log.js] (webpack)-dev-server/client/utils/log.js 964 bytes {main} [built]
[./node_modules/webpack-dev-server/client/utils/reloadApp.js] (webpack)-dev-server/client/utils/reloadApp.js 1.59 KiB {main} [built]
[./node_modules/webpack-dev-server/client/utils/sendMessage.js] (webpack)-dev-server/client/utils/sendMessage.js 402 bytes {main} [built]
[./node_modules/webpack/hot sync ^\.\/log$] (webpack)/hot sync nonrecursive ^\.\/log$ 170 bytes {main} [built]
    + 23 hidden modules
ℹ ｢wdm｣: Compiled successfully.
```

登录`http://localhost:8080`查看，

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/webassembly-screenshot1.png)