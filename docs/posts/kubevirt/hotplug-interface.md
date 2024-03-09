---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/background2.jpg
date: 2023-10-03
tag:
  - Kubevirt
  - 虚拟机
  - kubernetes
sticky: 1
prev:
  text: 'Kubevirt系列一：虚拟机CentOS 7部署实践'
  link: '/posts/kubevirt/quick-deploy-centos7'
---

# Kubevirt系列二：虚拟机网卡热插拔

## 设计动机

向正在运行的虚拟机热插拔/热拔出（添加/删除）NIC 是可用于多个平台的行业标准，允许动态连接 L2 网络。 当工作负载 (VM) 在连接/删除网络时无法容忍重新启动时，或者例如在网络之前创建工作负载的情况下，这非常有用。

这将有助于弥合 Kubevirt 的功能集与用户群的期望之间的差距。

## 网卡热插拔原理

### Multus

Multus - 一个 CNI 插件 - 仅处理 ADD / REMOVE 动词，并且仅在创建或删除 pod 的沙箱时由 `kubelet` 触发。 鉴于其简单性，它在执行时假设不存在网络，并继续为其 `k8s.v1.cni.cncf.io/networks` 注释中列出的所有网络调用 `ADD / DEL`。

因此，设计实现的第一部分必须关注multus； 必须对其进行重构，使其不仅能够在创建 pod 的沙箱时触发，而且能够按需触发，即每当 pod 的 `k8s.v1.cni.cncf.io/networks` 更新时触发。

为此，必须引入驻留在长期进程上的控制器。 需要考虑的一个重要细节是该控制器最终将成为 CNI 客户端； 因此，它需要使用容器 id 和容器 netns 路径（它们是 CNI 输入）等参数来指示 CNI。 为此，该控制器需要直接查询容器运行时（使用 CRI API）。

最终被multus维护者接受的解决方案是：

1. 将 `multus-cni` 重新架构为厚插件。 它共享主机 PID 命名空间。 `Multus-cni` 还具有一个端点，用于将特定（单个）附件添加到正在运行的 Pod。
2. 一个单独的控制器根据 pod 的当前状态（即 `k8s.v1.cni.cncf.io/network-status` 注释）协调 pod 的所需状态（网络选择元素，即 `k8s.v1.cni.cncf.io/networks` 注释） ）。 一旦此 Pod 识别出必须添加网络（以所需状态存在，但在当前状态中缺失），它将通过专用端点调用 multus。 一旦获得 multus CNI 结果，它会将其转换为网络状态，并更新 pod 的注释。

#### 控制器controller

该解决方案依赖于外部控制循环（在此[仓库](https://github.com/k8snetworkplumbingwg/multus-dynamic-networks-controller)中实现）来侦听 pod 更新，并在 `k8s.v1.cni.cncf.io/networks` 发生更改时做出反应。 然后，它将查询容器运行时（containerd / CRI-O）以获取运行时信息（容器 ID 和网络命名空间路径），最后使用 `multus /delegate` 端点为每个新网络发出 `ADD` 操作，并为之前已删除的网络发出 `DELETE` 操作。

请参阅下面的序列图了解更多信息：

![图片](https://cdn.jsdelivr.net/gh/kubevirt/community/design-proposals/nic-hotplug/controller-based-approach.png)

#### Multus-cni 重构为厚插件

“瘦 CNI 插件”作为一次性进程运行，通常作为在 Kubernetes 主机上执行的磁盘上的二进制文件。

另一方面，“厚 CNI 插件”是由两个（或更多）部分组成的 CNI 组件，通常由“`shim`”和驻留在内存中的长寿命进程（守护进程）组成。 “`shim`”是一个轻量级的“瘦 CNI 插件”组件，它只需将 CNI 参数（例如 JSON 配置和环境变量）传递给守护程序组件，然后由守护程序处理 CNI 请求。

要将 multus 转换为厚插件，需要实例化一个长期存在的进程 - 这将是 multus pod 入口点 - 侦听 unix 域套接字 - 该套接字必须在 multus pod 和主机的挂载命名空间中都可用； 因此，必须为 multus pod 提供托管此套接字的绑定安装。

然后，CNI shim 将被 `kubelet` 调用，并通过前面提到的 unix 域套接字将 CNI `ADD/DELETE` 命令发送到 multus 的服务器端。 每当要添加或删除新网络时，multus 守护进程也会联系填充程序。

请参阅下面的序列图了解更多信息：

![图片](https://cdn.jsdelivr.net/gh/kubevirt/community/design-proposals/nic-hotplug/create-pod-flow.png)

上述功能通过 `/cni` endpoint 公开。

Multus-cni 还提供以下端点：

- `/delegate`：当第三方想要向正在运行的 pod 添加/删除接口时使用的 endpoint
- `/healthz`：用于第三方了解 multus 服务器当前是否处于活动状态的 endpoint

### Kubevirt

为了模仿磁盘热插拔功能，建议的 API 还遵循子资源的概念，它将用于通过将 HTTP PUT 发送到正确的 URL 端点来触发 VM、VMI 或两者中的更改。 这还可以实现与 `virtctl` 的简单且一致的集成，这将有助于保持用户对系统工作方式的期望。

此外，根据设计，KubeVirt 只允许 Kubevirt 服务帐户（即通过 VMI 子资源路径）更新 VMI 规范。

#### Pod 网卡命名

VM 的 Pod 接口名称是基于顺序的（`net1、net2、...、netX`），源自 VMI 规范中的顺序。 通过在 virt-launcher pod `k8s.v1.cni.cncf.io/networks` 注释（由 virt-controller 创建）中指定，从 Multus 请求它们。

给定一个具有三个辅助接口的虚拟机：

```yaml
spec:
  networks:
  - name: blue-network
    multus: ...
  - name: red-network
    multus: ...
  - name: green-network
    multus: ...
```

Pod 的 Multus 网络注释如下所示：

```yaml
"k8s.v1.cni.cncf.io/networks": [
  {"interface": "net1", ...},
  {"interface": "net2",  ...},  
  {"interface": "net3",  ...}
]
```

在“red-network”接口被拔掉的场景下，注解会发生如下变化：

```yaml
"k8s.v1.cni.cncf.io/networks": [
  {"interface": "net1", ...},
  {"interface": "net3",  ...}
]
```

现在不可能在所有 VMI 规范和 Pod 接口之间关联。

因此，必须在不依赖规范中的接口顺序的情况下生成 virt-launcher pod 网络接口的名称，从而允许拔出功能。

pod 接口名称将从 `kubevirt-spec-iface-name` 派生； 我们将简单地计算接口名称的哈希值（保证在每个 VMI 中是唯一的），并确保内核接受 Pod 网络基础设施的所有生成名称。 请参阅以下列表，了解 pod 网络基础设施上的名称示例：

- 虚拟机接口名称：`iface1`
- Pod 接口名称：`pod7e0055a6880`
- Pod 内网桥名称：`k6t-7e0055a6880`
- 虚拟 pod 网卡名称：`7e0055a6880-nic`

:::warning 注意

最大接口名称长度的内核限制为 15 个字符。

由于内部使用桥接口和虚拟接口，因此将来可以将其更改为具有 3 个字符数字并与新格式保持一致：

- Pod 内网桥名称：`bri7e0055a6880`
- 虚拟 pod 网卡名称：`dum7e0055a6880`
:::

### VMI网卡热插拔工作流程

`virtctl` root 命令中将引入两个新命令：`addinterface` 和 `removeinterface`，这将导致 `HTTP PUT` 被发送到 `virt-api` 上相应的 VM/VMI 子资源。

请参阅下图了解更多信息:

![图片](https://cdn.jsdelivr.net/gh/kubevirt/community/design-proposals/nic-hotplug/patching-vmi-annotations.png)

:::warning 注意
此步骤对于 VM/VMI 对象是常见的。 当用于 VM 时，用户应提供 `--persist` 标志。
:::


#### virt-api

然后，virt-api 子资源处理程序将继续修补 VMI 规范`spec.domain.devices.interfaces` 和`spec.networks`。

#### virt-controller

VMI 更新将在 virt-controller 中触发，在此期间我们必须修补包含 VM 的 pod 上的 `k8s.v1.cni.cncf.io/networks` 注释，这反过来又会导致 multus 将接口热插拔到 pod 中。

然后，插入/拔出的请求将被转发到正确的 virt-handler。

#### virt-handler

最后，节点中的 Kubevirts 代理将创建并配置任何所需的网络基础设施，最后利用正确的 virt-launchers 命名空间来执行热插拔网络接口所需的命令。

:::warning 注意
该功能受 `HotplugNIC` 的特性门控保护。
:::

## 网卡热插拔实践

### Kubevirt打开特性门控

kubevirt 需要开启 feature-gate

```yaml
---
apiVersion: kubevirt.io/v1
kind: KubeVirt
metadata:
  name: kubevirt
  namespace: kubevirt
spec:
  configuration:
    developerConfiguration: 
      featureGates:
        - HotplugNICs
```

### 安装multus和dynamic-networks-controller

安装dynamic-networks-controller，

```bash
git clone https://github.com/k8snetworkplumbingwg/multus-dynamic-networks-controller.git
cd multus-dynamic-networks-controller
kubectl apply -f manifests/dynamic-networks-controller.yaml
```

安装multus，

```bash
git clone https://github.com/k8snetworkplumbingwg/multus-cni.git && cd multus-cni
cat ./deployments/multus-daemonset-thick.yml | kubectl apply -f -
```

创建附属网卡，

```yaml
apiVersion: "k8s.cni.cncf.io/v1"
kind: NetworkAttachmentDefinition
metadata:
  name: net1
  namespace: default
spec:
  config: '{
    "cniVersion": "0.3.1",
    "name": "kube-ovn",
    "plugins":[
        {
            "type":"kube-ovn",
            "server_socket":"/run/openvswitch/kube-ovn-daemon.sock",
            "provider": "net1.default.ovn"
        },
        {
            "type":"portmap",
            "capabilities":{
                "portMappings":true
            }
        }
    ]
}'
```

### 创建虚拟机

这里以创建虚拟机CentOS Stream 9为例，

:::details `centos-stream9-1.yaml`
```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: centos-stream9-1
spec:
  running: false
  template:
    metadata:
      labels:
        kubevirt.io/domain: centos-stream9
    spec:
      domain:
        cpu:
          cores: 2
        devices:
          disks:
          - bootOrder: 1
            cdrom:
              bus: sata
            name: cdromiso
          - disk:
              bus: virtio
            name: harddrive
          - cdrom:
              bus: sata
            name: virtiocontainerdisk
          interfaces:
          - masquerade: {}
            name: default
          - bridge: {}
            name: eth1
        machine:
          type: q35
        memory:
          guest: 2Gi
        resources:
          limits:
            memory: 3Gi
          overcommitGuestOverhead: true
          requests:
            memory: 3Gi
      networks:
      - name: default
        pod: {}
      - name: eth1
        multus:
          networkName: default/net1 # 对应default命名空间下的附属网卡net1
      volumes:
      - name: cdromiso
        persistentVolumeClaim:
          claimName: centos-stream9-1
      - name: harddrive
        hostDisk:
          capacity: 30Gi
          path: /9-1/disk.img
          type: DiskOrCreate
      - containerDisk:
          image: kubevirt/virtio-container-disk
        name: virtiocontainerdisk
```
:::

登录该虚拟机，

```bash
[root@centos-stream9-1 ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: enp1s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1350 qdisc fq_codel state UP group default qlen 1000
    link/ether 52:54:00:01:84:43 brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.2/24 brd 10.0.2.255 scope global dynamic noprefixroute enp1s0
       valid_lft 85124483sec preferred_lft 85124483sec
    inet6 fe80::5054:ff:fe01:8443/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
3: enp2s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1350 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:00:00:cd:e7:1a brd ff:ff:ff:ff:ff:ff
    inet 10.16.0.125/16 brd 10.16.255.255 scope global dynamic noprefixroute enp2s0
       valid_lft 85124483sec preferred_lft 85124483sec
    inet6 fe80::200:ff:fecd:e71a/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

发现多了个网卡`enp2s0`，说明网卡添加成功。