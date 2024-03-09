---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-cover1-application.png
date: 2023-09-09
author: 意琦行
tag:
  - Kubevela
  - 应用交付
  - kubernetes
sticky: 1
next:
  text: 'Kubevela系列二：Application Controller 源码分析(上)'
  link: '/posts/kubevela/application-controller-source-code-analysis-1'
---

# Kubevela系列一：初识 KubeVela，基于 OAM 模型的应用交付平台

本文主要介绍了 KubeVela 是什么，解决了什么问题，以及如何解决的。

## Kubevela介绍

### Kubevela是什么

:::info 以下是 KubeVela 官网的描述：
KubeVela 是一个现代化的软件交付平台，它可以让你的应用交付在当今流行的混合、多云环境中变得更加简单、高效、可靠。

KubeVela 是基础设施无关的、可编程的，但最重要的是： 它是完全以应用为中心的。它可以帮助你构建多样化的云原生应用，并交付到任意的云和基础设施！
:::

一句话总结：**KubeVela 是一个以应用为中心的软件交付平台。**

:::info 
KubeVela 将应用抽象成了 `Application` 对象，这也是 KubeVela 中的核心对象，后续会介绍到。
:::

### KubeVela 解决了什么问题

**现状**：尽管 K8S 统一了底层基础架构（提到应用交付、部署，大部分都是指往 k8s 上部署），但是它并没有在混合的分布式部署环境之上提供**应用层的软件交付模型和抽象**。

**一般解决方案**：k8s 很复杂，为了让应用开发者(不熟悉 k8s)能够快速交付（将应用部署到 k8s），一般会搭建 PaaS 平台对底层 k8s 能力进行抽象封装，屏蔽复杂度向上提供一个简单易用的平台。

**痛点**：但随着应用交付需求的增长，用户的诉求就一定会超出 PaaS 系统的能力边界，同时，**K8s 生态本身的能力池固然丰富，但是社区里却并没有一个可扩展的、方便快捷的方式，能够帮助平台团队把这些能力快速“组装”成面向最终用户的功能（Feature）。**

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/limit-by-platform.png)

**KubeVela 的价值**：能够简化混合环境的应用交付过程，同时又足够灵活。

- KubeVela 本身是一个面向混合交付环境同时又高可扩展的**应用交付引擎**，满足平台构建者的扩展和自建需求；
    - 基于该引擎可以快速扩展新功能，将底层能力向上层暴露
    - 因此也称之为 PaaS 内核
- 同时又附加了一系列开箱即用的扩展组件，能够让开发者自助式的开发、交付云原生应用。
    - 内置了一些常用的插件，开箱即用

### KubeVela 是怎么解决的

简单地说，KubeVela 通过执行以下操作减轻了构建此类平台的复杂度：

- **以应用为中心**：KubeVela 强制采用一种应用程序概念作为其主要 API，并且 所有 KubeVela 的功能仅可满足应用程序的需求。这是通过采用开放应用程序模型作为 KubeVela 的核心API来实现的。
    - 基于 OAM 模型的应用 [GitHub - oam-dev/spec: Open Application Model (OAM)](https://github.com/oam-dev/spec).
- **本地扩展**：KubeVela 中的应用程序由各种模块化组件组成。Kubernetes 生态系统的功能可以随时通过 Kubernetes CRD 注册机制作为新的工作负载类型或特征添加到 KubeVela 中。
- **简单但可扩展的抽象机制**：KubeVela 引入了一个模板引擎（支持 CUE ），用于从 Kubernetes 资源中提取面向用户的模式。KubeVela 提供了一组内置的抽象作为起点，平台构建者可以随时自由地对其进行修改。抽象更改将在运行时生效，无需重新编译或重新部署 KubeVela。
和其他 PaaS 平台一样，都是对底层能力做封装，但是 KubeVela 采用 **CUE 模版 + CRD 动态注册机制**，提高了灵活性。

## Application

KubeVela 中最核心的就是这个 `Application` 对象。

### 概念

KubeVela 围绕着云原生应用交付和管理场景展开，背后的应用交付模型是 [Open Application Model](https://kubevela.net/zh/docs/platform-engineers/oam/oam-model)，简称 OAM 。

:::warning 注意
前面有提到：**KubeVela 是一个以应用为中心的软件交付平台**。因此应用是 KubeVela 中最核心的对象。
:::

基于 OAM 模型，KubeVela将应用抽象成了一个 `Application` 对象，中文翻译可以叫做：应用部署计划。

:::tip
应用部署计划这个词可以说是非常贴切了。
:::

因为一个 Application 对象中包含了以下 4 部分内容：

- **组件（Component）**: 组件定义一个应用包含的待交付制品（二进制、Docker 镜像、Helm Chart…）或云服务。我们认为一个应用部署计划部署的是一个微服务单元，里面主要包含一个核心的用于频繁迭代的服务，以及一组服务所依赖的中间件集合（包含数据库、缓存、云服务等），一个应用中包含的组件数量应该控制在约 15 个以内。
- **运维特征（Trait）**: 运维特征是可以随时绑定给待部署组件的、模块化、可拔插的运维能力，比如：副本数调整（手动、自动）、数据持久化、 设置网关策略、自动设置 DNS 解析等。
- **应用策略（Policy）**: 应用策略负责定义指定应用交付过程中的策略，比如多集群部署的差异化配置、资源放置策略、安全组策略、防火墙规则、SLO 目标等。
- **工作流步骤（WorkflowStep）**: 工作流由多个步骤组成，允许用户自定义应用在某个环境的交付过程。典型的工作流步骤包括人工审核、数据传递、多集群发布、通知等。
**KubeVela 的核心是将应用部署所需的所有组件和各项运维动作，描述为一个统一的、与基础设施无关的“部署计划”，进而实现在混合环境中标准化和高效率的应用交付。**这使得最终用户无需关注底层细节，就可以使用丰富的扩展能力，并基于统一的概念自助式操作。

就像下图这样，一个完整的 `Application` 对象需要包含这 4 部分内容：

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-application-2.png)

### 实现

而上面提到的这 4 个部分则是通过插件机制实现的， KubeVela 会像胶水一样基于 Kubernetes API 定义基础设施定义的抽象并将不同的能力组合起来。下图描述了概念间的关系：

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-application-arch.png)

也就是说 `Application` 对象主要是对各个模块进行组合，真正的功能实现由各个模块定义来提供。

同时 KubeVela 提供了 Application Controller 来维护 `Application` 对象状态，这个也是核心之一，挖个坑，后续写一篇文章分析一下具体工作流程。

:::tip
用户将一个 `Application` 对象交给 KubeVela 之后发生了什么。
:::

## 插件机制(模块定义)

KubeVela 的灵活性主要由**插件机制**提供，KubeVela 中称其为 `XDefinition`。

:::info
存在不同叫法，一般插件、组件、模块定义都是一个东西。
:::

前文提到 `Application` 对象中引用的几部分内容都是作为一个模块来实现的：

- `Component`
- `Trait`
- `Policy`
- `Workflow Step`

这部分讲述插件相关实现原理的：

- 1）工作流程：插件机制如何为 KubeVela 提供灵活性
- 2）插件定义与注册：如何实现自己的插件
- 3）使用插件：终端用户怎么用我们定义的插件
- 4）UI 展示：新增插件后，如何快速实现 UI 展示

### 工作流程

平台构建者定义插件，使用插件对底层能力进行封装抽象，终端用户直接使用封装好的插件，以屏蔽掉复杂的底层逻辑。

就像下面这样：

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-xdefinition-arch.png)

在 这里 可以找到现有的插件列表。

在 KubeVela 中插件机制主要为了向终端用户屏蔽底层的复杂度，就像这样：用户只需要提供少量数据，经过插件处理后即可生成完整信息。

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-xdefinition-usage.png)

### 定义插件

插件在 KubeVela 中具体表现为一个叫做 `XDefinition` 的 CRD，因此定义插件主要是实现一个 `XDefinition` 的 CRD。

以下内容定义了一个 `component` 类型的，名为 `myraw` 的插件，借助该 `component` 用户可以将原生 k8s 对象作为 Application 的一部分。

核心为 `spec.schematic.cue` 部分

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: myRaw allow users to specify raw K8s object in properties.
      This definition is DEPRECATED, please use 'k8s-objects' instead.
    meta.helm.sh/release-name: kubevela
    meta.helm.sh/release-namespace: vela-system
  name: myraw
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: parameter
        parameter: {}
  workload:
    type: autodetects.core.oam.dev
```

### 注册插件

注册插件实际上就是将上述 CR 对象 apply 到 k8s 集群，即可实现动态注册，不需要重新编译或者重启 KubeVela。

KubeVela 在解析 App 对象拿到具体组件后，根据组件名查询对应的 CR 对象拿到具体信息。

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-xdefinition-register.png)

查看
```bash
$ kubectl get componentdefinitions.core.oam.dev -n vela-system myraw
NAME    WORKLOAD-KIND   DESCRIPTION
myraw                   myRaw allow users to specify raw K8s object in properties. This definition is DEPRECATED, please use 'k8s-objects' instead.
```

### 使用插件

插件注册好之后，平台用户就可以使用该插件了，具体表现为可以在 `Application` 里引用该插件,就像这样：

`properties` 里可以传任意值，比如这里直接定义了一个 `deploy` 对象

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app
spec:
  components:
    - name: demo
      type: myraw
      properties:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          labels:
            app: nginx
          name: nginx-deployment
        spec:
          replicas: 3
          selector:
            matchLabels:
              app: nginx
          template:
            metadata:
              labels:
                app: nginx
            spec:
              containers:
                - image: nginx:latest
                  name: nginx
                  ports:
                    - containerPort: 80
```

查看
```bash
[root@tmp-1 ~]# vela ls
APP         COMPONENT        TYPE         TRAITS        PHASE          HEALTHY        STATUS            CREATED-TIME
vela-app    demo             myraw                      running        healthy                          2023-08-21 17:33:17 +0800 CST

```

### UI展示

[Definition 生成 OpenAPI 描述 | KubeVela](http://kubevela.net/zh/docs/platform-engineers/openapi-v3-json-schema)

[UI 扩展 | KubeVela](http://kubevela.net/zh/docs/reference/ui-schema)

在定义 `XDefinition` 之后 KubeVela 会自动根据内容生成 `json schema`，UI 界面则会自动根据该 Schema 内容进行展示。

如果自动生成的不够完美，还可以进行自定义。

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-xdefinition-ui.png)

至此，我们的插件定义的算是完成了，可以看到前后端都是可以动态扩展的，不需要重新编译以及重启任何服务。

### Demo

这里以官方提供的 Demo 为例，演示一下如何借助 KubeVela 插件机制，快速将社区能力接入平台。

需求：实现一个 helm 应用部署能力。

容易想到的方案：基于 helm cli / sdk 封装一个应用，对外提供该能力。

KubeVela 中怎么实现：

因为社区中已经有了类似功能，比如 FluxCD 或者 ArgoCD 都可以实现 helm 应用的部署，那么我们只需要选其中一个封装成组件注册到 KubeVela 即可。

具体如下：

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-xdefinition-demo.png)

因此，KubeVela 的玩法就是借助插件机制将社区能力快速接入到平台。

## 小结

本文主要对 KubeVela 做了一个简要说明，核心部分为基于 OAM 模型的 `Application` 对象抽象，以及基于 `CUE 模板引擎 + CRD` 注册模式的插件系统(模块定义)。

- **KubeVela 是什么**：KubeVela 是一个以应用为中心的软件交付平台。
- **KubeVela 解决的问题**：云原生社区能力"无限",但是传统 PaaS 无法快速将这些能力接入进来。
- **KubeVela 提供的解决方案**：提供灵活的插件机制(模块定义)，以快速接入社区能力。

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/limit-by-platform.png)

如何实现的：

- **动态注册**：KubeVela 中的应用程序由各种模块化组件组成。Kubernetes 生态系统的功能可以随时通过 Kubernetes CRD 注册机制作为新的工作负载类型或特征添加到 KubeVela 中。
- **简单但可扩展的抽象机制**：KubeVela 引入了一个模板引擎（支持 CUE ），用于从 Kubernetes 资源中提取面向用户的模式。KubeVela 提供了一组内置的抽象作为起点，平台构建者可以随时自由地对其进行修改。抽象更改将在运行时生效，无需重新编译或重新部署 KubeVela。
- **自动生成 UI**：自动根据模块内容生成 `json schema`，UI 界面则会自动根据该 Schema 内容进行展示。
和其他平台一样，都是对底层能力做封装，但是 KubeVela 采用 `CUE 模版 + CRD` 动态注册机制 + 自动生成 `UI Schema`，提高了灵活性。