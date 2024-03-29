---
sidebar: false
cover: https://cilium.io/static/620dc85c97b669d3417218f1602224df/905a7/intro.webp
date: 2024-02-04
tag:
  - Cilium
  - 网络
  - cni
  - kubernetes
sticky: 1
next:
  text: 'Cilium系列二：使用bird和cilium部署BGP模式的k8s集群'
  link: '/posts/cilium/bgp-exercise-bird-cilium'
---

# Cilium系列一：Cilium架构体系

Cilium 是一款开源软件，也是 CNCF 的孵化项目，目前已有公司提供商业化支持，还有基于 Cilium 实现的服务网格解决方案。最初它仅是作为一个 Kubernetes 网络组件。Cilium 在 1.7 版本后推出并开源了 Hubble，它是专门为网络可视化设计，能够利用 Cilium 提供的 eBPF 数据路径，获得对 Kubernetes 应用和服务的网络流量的深度可见性。这些网络流量信息可以对接 Hubble CLI、UI 工具，可以通过交互式的方式快速进行问题诊断。除了 Hubble 自身的监控工具，还可以对接主流的云原生监控体系——Prometheus 和 Grafana，实现可扩展的监控策略。

## 特性

以下是 Cilium 的特性。

- 基于身份的安全性

    Cilium 可见性和安全策略基于容器编排系统的标识（例如，Kubernetes 中的 Label）。在编写安全策略、审计和故障排查时，再也不用担心网络子网或容器 IP 地址了。
- 卓越的性能

    eBPF 利用 Linux 底层的强大能力，通过提供 Linux 内核的沙盒可编程性来实现数据路径，从而提供卓越的性能。
- API 协议可见性 + 安全性

    传统防火墙仅根据 IP 地址和端口等网络标头查看和过滤数据包。Cilium 也可以这样做，但也可以理解并过滤单个 HTTP、gRPC 和 Kafka 请求，这些请求将微服务拼接在一起。
- 专为扩展而设计

    Cilium 是为扩展而设计的，在部署新 pod 时不需要节点间交互，并且通过高度可扩展的键值存储进行所有协调。

### 基于Cilium身份的网络策略

传统的 Kubernetes 网络策略基于 `iptables filters`，这些 `filters` 也存在相同的规模问题。Cilium 采用了不同的方法，使用 Kubernetes 标签为 Pod 分配安全身份（类似于 Kubernetes 使用标签识别分配给每个服务的 Pod 的方式）。网络策略以 `eBPF maps` 表示，并允许在网络流量进入或离开 Cilium 管理的节点时从这些映射进行超快速查找，以决定是否允许或拒绝数据包。这些eBPF程序非常小，速度超快。

使用 Cilium，您可以编写应用程序感知的 L7 策略！例如，您可以编写一个策略来限制 Pod 之间的访问，以仅允许特定 API 端点上的特定 `HTTP REST` 方法。您还可以根据完全限定的域名或 IP 地址筛选流量，以便在流量需要在群集外部通信时进行通信。

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cilium-intro-1.png)

### eBPF是什么？

> Linux 内核一直是实现监控/可观测性、网络和安全功能的理想地方。 不过很多情况下这并非易事，因为这些工作需要修改内核源码或加载内核模块， 最终实现形式是在已有的层层抽象之上叠加新的抽象。 eBPF 是一项革命性技术，它能在内核中运行沙箱程序（sandbox programs）， 而无需修改内核源码或者加载内核模块。

Linux 的内核在网络栈上提供了一组 BPF 钩子，通过这些钩子可以触发 BPF 程序的执行。Cilium datapath 使用这些钩子加载 BPF 程序，创建出更高级的网络结构。

通过阅读 [Cilium 参考文档 eBPF Datapath](https://docs.cilium.io/en/stable/concepts/ebpf/intro/) 得知 Cilium 使用了下面几种钩子：

- `XDP`：这是网络驱动中接收网络包时就可以触发 BPF 程序的钩子，也是最早的点。由于此时还没有执行其他操作，比如将网络包写入内存，所以它非常适合运行删除恶意或意外流量的过滤程序，以及其他常见的 DDOS 保护机制。
- `Traffic Control Ingress/Egress`：附加到流量控制（`traffic control`，简称 `tc`）ingress 钩子上的 BPF 程序，可以被附加到网络接口上。这种钩子在网络栈的 L3 之前执行，并可以访问网络包的大部分元数据。适合处理本节点的操作，比如应用 L3/L4 的端点 1 策略、转发流量到端点。CNI 通常使用虚拟机以太接口对 `veth` 将容器连接到主机的网络命名空间。使用附加到主机端 `veth` 的 `tc ingress` 钩子，可以监控离开容器的所有流量，并执行策略。同时将另一个 BPF 程序附加到 `tc egress` 钩子，Cilium 可以监控所有进出节点的流量并执行策略 .
- `Socket operations`：套接字操作钩子附加到特定的 `cgroup` 并在 TCP 事件上运行。Cilium 将 BPF 套接字操作程序附加到根 `cgroup`，并使用它来监控 TCP 状态转换，特别是 `ESTABLISHED` 状态转换。当套接字状态变为 `ESTABLISHED` 时，如果 TCP 套接字的对端也在当前节点（也可能是本地代理），则会附加 `Socket send/recv` 程序。
- `Socket send/recv`：这个钩子在 TCP 套接字执行的每个发送操作上运行。此时钩子可以检查消息并丢弃消息、将消息发送到 TCP 层，或者将消息重定向到另一个套接字。Cilium 使用它来加速数据路径重定向。

### 网络可观测性

到目前为止，我一直专注于网络连接和安全性，但 Cilium 也可以帮助实现大规模的网络可观测性。

Kubernetes集群内部的网络可观测性变得非常复杂。由于 Pod 不断来来去去，并且在扩展和缩减时跨不同工作负载重新分配内部 IP 地址，因此很难观察数据包流。尝试按群集内的 IP 地址跟踪数据包是徒劳的。即使在节点上运行 eBPF 驱动的 `tcpdump` 也是不够的，因为 IP 地址和端口很难与工作负载匹配，尤其是当 Kubernetes 本身可能通过快速重新调试 pod 来尝试解决您正在诊断的问题时。当其中一个微服务或我们的网络策略出现问题时，我们如何获得可观测性？

是时候向您介绍Cilium的超级朋友 Hubble 了。Hubble 过滤了动态IP寻址的噪声，将网络流与其Kubernetes身份呈现在一起，因此您可以清楚地看到Pod和服务如何相互通信以及与外部世界进行通信。Hubble建立在Cilium的基础上，创建了一个一流的容器网络可观测性平台，不仅能够向你显示网络第3层和第4层的流的详细信息，还可以在第7层向你显示协议流的细节，如HTTP和gRPC。

Hubble UI 更进一步，提供了服务依赖关系图的图形描述以及网络流详细信息。

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cilium-intro-2.png)

Cilium 和 Hubble 共同揭示了各种各样的指标、跟踪和日志，这些指标、跟踪和日志对于观察您的网络和诊断问题非常宝贵。您可以将这些数据提取到Grafana中以便于可视化，轻松回答有关您的网络的各种问题。例如，如果您想知道特定服务或所有集群的 4xx HTTP 响应速率，或者如果您想知道性能最差的服务之间的请求/响应延迟，Hubble 指标可以满足您的需求。

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cilium-intro-3.png)

## 网络

一个简单的扁平第 3 层网络能够跨越多个集群连接所有应用程序容器。使用主机范围分配器可以简化 IP 分配。这意味着每个主机可以在主机之间没有任何协调的情况下分配 IP。

支持以下多节点网络模型：

- `Overlay`：基于封装的虚拟网络产生所有主机。目前 `VXLAN` 和 `Geneve` 已经完成，但可以启用 Linux 支持的所有封装格式。

    何时使用此模式：此模式具有最小的基础架构和集成要求。它几乎适用于任何网络基础架构，唯一的要求是主机之间可以通过 IP 连接。

- 本机路由：使用 Linux 主机的常规路由表。网络必须能够路由应用程序容器的 IP 地址。

    何时使用此模式：此模式适用于高级用户，需要了解底层网络基础结构。此模式适用于：

    - 本地 IPv6 网络
    - 与云网络路由器配合使用
    - 如果您已经在运行路由守护进程