---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/dragonfly_cover.jpg
date: 2024-01-07
tag:
  - P2P
  - Dragonfly
  - kubernetes
sticky: 1
next:
  text: 'Dragonfly系列二：Dragonfly 和 Nydus Mirror 模式集成实践'
  link: '/posts/dragonfly/exercise-dragonfly-with-nydus'
---

# Dragonfly系列一：Dragonfly架构体系

Dragonfly是一个基于P2P的开源文件分发和图像加速系统。 它由云原生计算基金会 (CNCF) 作为孵化级项目托管。 其目标是解决云原生架构中的所有分发问题。 目前 Dragonfly 的重点是：

- 简单：定义良好的面向用户的API（HTTP），对所有容器引擎无侵入；
- 高效：种子点支持，基于P2P的文件分发，节省企业带宽；
- 智能：主机级限速，由于主机检测而智能流量控制；
- 安全：块传输加密，HTTPS连接支持。

![](https://cdn.jsdelivr.net/gh/dragonflyoss/Dragonfly2/docs/images/arch.png)

包含以下组件：

- `Manager`：维护各个P2P集群之间的关系，动态配置管理和RBAC。 它还包含前端控制台，方便用户可视化操作集群。
- `Scheduler`：为下载节点选择最优的下载父节点。 异常控制`Dfdaemon`的回源。
- `Seed Peer`：`Dfdaemon`开启`Seed Peer`模式可以作为P2P集群中的回源下载peer，是整个集群中下载的根peer。
- `Peer`：使用`dfdaemon`部署，基于C/S架构，提供`dfget`命令下载工具，以及`dfget daemon`运行守护进程，提供任务下载能力。

## Dragonfly解决了什么问题？

一句话概括：**源站的带宽瓶颈问题**

假设在上千、上万个节点，都需要加载一个镜像、文件或者是 AI 模型，这时候，就需要上千、上万次的并发下载文件。这个过程很容易达到带宽上限，导致整个加载流程的变慢，或者容器启动变慢。

解决方案：

1. 提高带宽上限

    问题：硬件成本过高，且有瓶颈 -- 中心化的存储方案解决不了大规模场景

2. **利用 P2P 方式，利用节点的闲置带宽来缓解带宽瓶颈**

    问题：着力于大规模场景，小规模场景并不受很大影响

3. **尽量少的加载资源**

    问题：在构建镜像、文件、AI 模型时进行去重、压缩，并且在加载时做到按需加载

那么 DragonFly 就是结合第二和第三种方式来解决**源站带宽瓶颈问题的**。


## 怎么运行的？

当下载一个镜像或文件时，通过 `Peer` 的 HTTP Proxy 将下载请求代理到 `Dragonfly`。`Peer` 首先会向 `Scheduler` 注册 Task， `Scheduler` 会查看 Task 的信息，判断 Task 是否在 P2P 集群内第一次下载， 如果是第一次下载优先触发 `Seed Peer` 进行回源下载，并且下载过程中对 Task 基于 Piece 级别切分。注册成功后 `Peer` 会和 `Scheduler` 建立双向流， 然后将 `Seed Peer` 调度给 `Peer` 进行下载。`Seed Peer` 和 `Peer` 之间下载传输基于 Piece 级别进行流式传输。`Peer` 每下载成功一个 Piece， 会将信息上报给 `Scheduler` 供下次调度使用。如果 Task 在 P2P 集群内非第一次下载，那么 `Scheduler` 会调度其他 `Peer` 给当前 `Peer` 下载。 `Peer` 从不同的 `Peer` 下载 Piece，拼接并返回整个文件，那么 P2P 下载就完成了。

![](https://cdn.jsdelivr.net/gh/dragonflyoss/Dragonfly2/docs/images/dragonfly-workflow.png)

## AI 场景下如何进行加速？

把 AI 场景数据分为四类：

- 数据集
- 模型
- 框架
- 外围数据

![](https://cdn.jsdelivr.net/gh/dragonflyoss/Dragonfly2/docs/images/ai-data-distribution.png)

### 训练阶段

要点

- `Fluid`：进行数据编排，同时它的 runtime 是基于分布式文件系统如 `JuiceFS`；
- `JuiceFS`：加载是按每一个 chunk，适用于小规模，大规模情况下会打满存储；

解决方案：与 Juice 社区进行沟通，将 `Dragonfly` 集成到 Juice 中，让 chunk 流量走 P2P 分发，由此有效缓解源站带宽；

### 推理阶段

#### 第一种方案：直接使用 Dragonfly 做 P2P 模型分发

在 AI 推理过程当中，**P2P 是最好的解决方案**。

> [!IMPORTANT] 为什么？
>
> 首先 AI 有两个前提：
>
> - AI 推理服务过程当中具有并发性，需要启动一两千个服务进行线上 serving
> - AI 模型足够大，从上百 MB 到上百 G 都有可能，一千个推理节点同时加载大文件的情况下，源站带宽不管怎么样都会被打满的。内部一些大模型场景，在没有用 P2P 之前，加载整体一千个服务的时候，可能需要几个小时，使用 P2P 之后只需要几分钟。因为 `Dragonfly` 能做到最好的情况，让整个集群当中只有 1 个节点进行回源。这样就会让回源加载尽量快，此时加载过程中它的 piece 也能在 P2P 集群当中进行内网加载，由此大大提升速度。

这是第一种方案：**直接使用 Dragonfly 做 P2P 模型分发**。

#### 第二种方案：是模型文件系统方案

用 `Nydus` 将文件构建为 `rafs` 格式的文件，这个过程能够做到**去重和压缩**，同时在加载时会按需加载 chunk，经过 `Dragonfly` 进行分发。此方案的问题在于集成比较麻烦。

#### 第三种方案：**模型镜像方案**，是快手公司落地的方案

相似于模型系统文件方案，用 `Nydus` 转换为 `ocive` 格式，将**模型和推理服务框架打在同一个镜像**当中，转换为 `Nydus` 格式的镜像。加载过程当中，通过 `Nydus` 去分 chunk 和按需加载。

优势：部门交接简单，如训练部门和推理部门沟通，通过镜像版本的方式进行交付可以做到沟通成本最低化。

