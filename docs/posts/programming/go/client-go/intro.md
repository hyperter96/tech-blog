---
sidebar: false
# cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/go-cover1-slices.jpeg
date: 2022-10-02
tag:
  - Go
  - Client-go
sticky: 1
next:
  text: 'Client-go系列二: 认识ClientSet'
  link: '/posts/programming/go/client-go/clientset'
---

# Client-go系列一：Client-go知识体系

初步认识 Client-go 主体框架.

## 关于client-go

`client-go`是kubernetes官方提供的go语言的客户端库，go应用使用该库可以访问kubernetes的API Server，这样我们就能通过编程来对kubernetes资源进行增删改查操作。

除了提供丰富的API用于操作kubernetes资源，`client-go`还为`controller`和`operator`提供了重要支持，如下图，`client-go`的`informer`机制可以将`controller`关注的资源变化及时带给此`controller`，使`controller`能够及时响应变化：

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/client-go-image.png)

我们先来瞄一眼 `client-go` 的主要代码结构，我会给出各个主要部分的核心功能让大家有一个感性的认识：

```bash
$ tree -L 2 client-go
client-go
├── discovery    # 包含dicoveryClient，用于发现k8s所支持GVR(Group/Version,/Resource),'kubectl api-resources'命令正是使用它来列出cluster中的各种资源。
├── dynamic  # 包含dynamicClient，它封装了 RESTClient，可以动态的指定api资源的GVR，结合unstructured.Unstructured类型来访问各种类型的k8s资源(如: Pod,Deploy...)，也可以访问用户自定义资源(CRD)。
├── informers # 为了减少client对于apiserver的频繁访问，需要informer来缓存apiserver中资源，只有当api资源对象发生变化的时候才收到通知。每种api资源会有自己的informer实现，也是按照api分组与版本来区分。
├── kubernetes # 主要定义ClientSet，它也对restClient进行了封装，并且包含对各种k8s资源和版本的管理方法。每个api资源有单独的client，而ClientSet则是多个客户端的集合。ClientSet以及每种k8s内置资源的client的所有请求最终还是由restClient发出的；在typed目录包括具体每种k8s内置资源的client实现，也是按照api分组与版本来区分。
│   ├── clientset.go
│   └── typed
├── listers # 包含各种k8s内置资源的只读客户端。每种lister都有Get()和List()方法，并且结果都是从缓存中读取的。
├── rest # 包含真正给apiserver发请求的client，实现了Restful的API，同时支持Protobuf和JSON格式数据。
├── scale # 只要包含scalClient用于Deploy, RS等的扩/缩容。
├── tools # 各种类型的工具包，常见的比如获取kubeconfig的方法，以SharedInformer、Reflector、DealtFIFO和Indexer等工具，这些工具主要用于实现client查询和缓存机制，减轻apiserver的负载等。
```
:::warning 注意📢：
为了简化，不重要的文件与目录没有列出来。
:::

## 客户端对象

`Client-go` 提供了以下四种客户端对象与kubernetes的API Server进行交互

### `RESTClient`

这是最基础的客户端对象，仅对`HTTPRequest`进行了封装，实现RESTFul风格API，这个对象的使用并不方便，因为很多参数都要使用者来设置，于是`client-go`基于`RESTClient`又实现了三种新的客户端对象。

### `ClientSet`

把`Resource`和`Version`也封装成方法了，用起来更简单直接，一个资源是一个客户端，多个资源就对应了多个客户端，所以`ClientSet`就是多个客户端的集合了，这样就好理解了，不过`ClientSet`只能访问内置资源，访问不了自定义资源。

### `DynamicClient`
可以访问内置资源和自定义资源，拿出的内容是`Object`类型，按实际情况自己去做强制转换，当然了也会有强转失败的风险。

### `DiscoveryClient`

用于发现kubernetes的API Server支持的`Group`、`Version`、`Resources`等信息。

### 各模块的依赖关系

`client-go` 主要功能模块以及各模块的依赖关系大致如下面这张图所示：

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/client-go-module.jpg)

可以看到，不管是各种静态类型的客户端 `ClientSet` ，动态客户端 `DynamicClient` 还是资源发现客户端 `DiscoveryClient` 都封装了 `RESTClient`，也就是说最后请求的发送都是有 `RESTClient` 发送给 `kube-apiserver` 的。而 `k8s.io/api-machinery` 中 API 资源的分组与版本是所有类型客户端的基础，具体每种 API 资源的定义则是包含在 `k8s.io/api` 模块。