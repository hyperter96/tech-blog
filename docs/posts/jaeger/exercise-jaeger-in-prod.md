---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/jaeger-cover1.jpg
date: 2023-05-11
author: 意琦行
tag:
  - Jaeger
  - 分布式链路追踪
  - kubernetes
sticky: 1
prev:
  text: 'Jaeger系列一：Jaeger 在 gin 框架和 gRPC 中的使用'
  link: '/posts/jaeger/jaeger-in-gin-and-grpc'
---

# Jaeger系列二：Jaeger线上环境部署

本文主要记录了如何在生产环境中部署Jaeger各个组件，包括 `Agent`、`Collector`、`Query`、`Storage` 等等。

##  概述

测试部署时有官方提供的 `all-in-one` 的镜像，同时直接将数据存储在内存中，所以部署起来比较方便。

但是线上则建议单独部署各个组件和存储后端（这里采用ES存储）。

### 架构

![](https://cdn.jsdelivr.net/gh/lixd/blog/images/tracing/jaeger-architecture.png)

完整架构包含如下组件：

- `jaeger-agent`
- `jaeger-collector`
- `jaeger-query`
- `jaeger-ingester`
- `elasticsearch`
- `kafka`

### 数据流

具体流程如下：

1. 客户端通过 `6831` 端口上报数据给 `agent`
2. agent通过 `14250` 端口将数据发送给 `collector`
3. `collector` 将数据写入 `kafka`
4. `Ingester` 从 `kafka` 中读取数据并写入存储后端（`es`）
5. `query` 从存储后端查询数据并展示

## 各组件介绍

暂时只部署`collector、agent、query`和`es`这四个组件。

其中`collector、query`和`es`可以只部署一个。

但是`agent`则建议部署在每一台需要追踪的主机上，这样可以离 `client` 近一点。

### `agent`

`jaeger-agent` 是客户端代理，需要部署在每台主机上。

|端口   |协议 |<div style="width:620px">功能</div>|
|------|-----|------------------------------------------------------------------------------------------------------|
|`6831`|`UDP`|客户端上报`jaeger.thrift compact`协议数据，大部分客户端都使用这个|
|`6832`|`UDP`|`jaeger.thrift binary`协议数据。为`node`客户端单独开的一个端口，因为`node`不支持`jaeger.thrift compact`协议|
|`5778`|`HTTP`|服务器配置|
|`5775`|`UDP`|`zipkin.thrift compact` 兼容`zipkin`的|
|`14271`|`HTTP`|健康检查和 `metrics`|

### `collector`

收集器，可以部署多个。收集 `agent` 发来的数据并写入 `db` 或 `kafka`。

|端口   |协议 |<div style="width:620px">功能</div>|
|------|-----|------------------------------------------------------------------------------------------------------|
|`14250`|`gRPC`|`jaeger-agent`通过该端口将收集的`span`以 `model.proto` 格式发送到 `collector`|
|`14268`|`HTTP`|客户端可以通过该端口直接将`span`发送到 `collector`。|
|`9411`|`HTTP`|	用于兼容 `zipkin`|
|`14269`|`HTTP`|健康检查和 `metrics`|

### `query`

UI 界面，主要做数据展示。

|端口   |协议 |<div style="width:620px">功能</div>|
|------|-----|------------------------------------------------------------------------------------------------------|
|`16686`|`HTTP`|默认`url` `localhost:16686`|
|`16686`|`gRPC`|gRPC查询服务？|
|`16687`|`HTTP`|健康检查和 `metrics`|

### `ingester`
主要从 `kafka` 中读取数据并写入存储后端。

|端口   |协议 |<div style="width:620px">功能</div>|
|------|-----|------------------------------------------------------------------------------------------------------|
|`14270`|`HTTP`|健康检查和 `metrics`|

### 后端存储

用于存储收集的数据。

支持 `Cassandra` 和 `Elasticsearch`。

### `Kafka`

可以在收集器和后端存储之间做缓冲。
