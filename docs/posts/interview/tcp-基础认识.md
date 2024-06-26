---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/lazer.png
author: 皮特ᴾᵗ
date: 2024/02/10
categories:
 - TCP
 - 面试
prev:
  text: '面试系列之：TCP篇'
  link: '/posts/interview/tcp'
---

# 面试系列之：TCP基础认识

## TCP 头格式有哪些？

我们先来看看 TCP 头的格式，标注颜色的表示与本文关联比较大的字段，其他字段不做详细阐述。

![](https://cdn.xiaolincoding.com//mysql/other/format,png-20230309230534096.png)

序列号：在建立连接时由计算机生成的随机数作为其初始值，通过`SYN`包传给接收端主机，每发送一次数据，就「累加」一次该「数据字节数」的大小。用来解决网络包乱序问题。

确认应答号：指下一次「期望」收到的数据的序列号，发送端收到这个确认应答以后可以认为在这个序号以前的数据都已经被正常接收。用来解决丢包的问题。

控制位：

- `ACK`：该位为 1 时，「确认应答」的字段变为有效，`TCP`规定除了最初建立连接时的`SYN`包之外该位必须设置为 1 。
- `RST`：该位为 1 时，表示 TCP 连接中出现异常必须强制断开连接。
- `SYN`：该位为 1 时，表示希望建立连接，并在其「序列号」的字段进行序列号初始值的设定。
- `FIN`：该位为 1 时，表示今后不会再有数据发送，希望断开连接。当通信结束希望断开连接时，通信双方的主机之间就可以相互交换`FIN`位为 1 的`TCP`段。
