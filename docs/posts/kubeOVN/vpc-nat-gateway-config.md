---
sidebar: false
date: 2023-12-13
tag:
  - KubeOVN
  - 网络
  - cni
  - SDN
  - kubernetes
sticky: 1
prev:
  text: 'KubeOVN系列一：KubeOVN架构体系'
  link: '/posts/kubeOVN/kubeOVN-intro'
---

# KubeOVN系列二：配置VPC网关连通外部公网

Kube-OVN 支持多租户隔离级别的 VPC 网络。不同 VPC 网络相互独立，可以分别配置 Subnet 网段， 路由策略，安全策略，出网网关，EIP 等配置。

> VPC 主要用于有多租户网络强隔离的场景，部分 Kubernetes 网络功能在多租户网络下存在冲突。 例如节点和 Pod 互访，NodePort 功能，基于网络访问的健康检查和 DNS 能力在多租户网络场景暂不支持。 为了方便常见 Kubernetes 的使用场景，Kube-OVN 默认 VPC 做了特殊设计，该 VPC 下的 Subnet 可以满足 Kubernetes 规范。用户自定义 VPC 支持本文档介绍的静态路由，EIP 和 NAT 网关等功能。 常见隔离需求可通过默认 VPC 下的网络策略和子网 ACL 实现，在使用自定义 VPC 前请明确是否需要 VPC 级别的隔离，并了解自定义 VPC 下的限制。

![](https://kubeovn.github.io/docs/v1.12.x/static/network-topology.png)

## 创建自定义VPC

按照命名空间/组织级别创建VPC和子网，

```yaml
kind: Vpc
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-vpc
spec:
  namespaces:
    - {{.Namespace}}
  staticRoutes:
    - cidr: 0.0.0.0/0
      nextHopIP: 172.65.0.254	# vpc 静态路由，自定义 vpc 内流量的下一跳
      policy: policyDst
  enableExternal: true

---

kind: Subnet
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-net
spec:
  dhcpV4Options: >-
    lease_time=3600,router=172.65.0.1,server_id=169.254.0.254,server_mac=00:00:00:2E:2F:B8
  enableDHCP: true
  enableIPv6RA: true
  vpc: {{.Namespace}}-vpc
  cidrBlock: 172.65.0.0/16
  protocol: IPv4
  excludeIps:
    - 172.65.0.1
  gateway: 172.65.0.1
  gatewayType: distributed
  private: false
  namespaces:
    - {{.Namespace}}
```

## 创建VPC网关

> 自定义 VPC 下的子网不支持默认 VPC 下的分布式网关和集中式网关。

VPC 内容器访问外部网络需要通过 VPC 网关，VPC 网关可以打通物理网络和租户网络，并提供 浮动 IP，SNAT 和 DNAT 功能。

VPC 网关功能依赖 Multus-CNI 的多网卡功能，安装请参考 [multus-cni](https://github.com/k8snetworkplumbingwg/multus-cni/blob/master/docs/quickstart.md)。

### 配置外部网络

```yaml
apiVersion: kubeovn.io/v1
kind: Subnet
metadata:
  name: ovn-vpc-external-network
spec:
  protocol: IPv4
  provider: ovn-vpc-external-network.kube-system
  cidrBlock: 192.168.239.0/24 # 外部网络的网段
  gateway: 192.168.239.1  # 外部网络的物理网关的地址
  excludeIps:
    - 192.168.239.1..192.168.239.100
---
apiVersion: "k8s.cni.cncf.io/v1"
kind: NetworkAttachmentDefinition
metadata:
  name: ovn-vpc-external-network
  namespace: kube-system
spec:
  config: '{
      "cniVersion": "0.3.0",
      "type": "macvlan",
      "master": "eth0",
      "mode": "bridge",
      "ipam": {
        "type": "kube-ovn",
        "server_socket": "/run/openvswitch/kube-ovn-daemon.sock",
        "provider": "ovn-vpc-external-network.kube-system"
      }
    }'
```

- 该 `Subnet` 用来管理可用的外部地址，网段内的地址将会通过 `Macvlan` 分配给 VPC 网关，请和网络管理沟通给出可用的物理段 IP。
- VPC 网关使用 `Macvlan` 做物理网络配置，`NetworkAttachmentDefinition` 的 `master` 需为对应物理网路网卡的网卡名。
- provider 格式为 `<NetworkAttachmentDefinition Name>.<NetworkAttachmentDefinition Namespace>`。
- `name` 必须为 `ovn-vpc-external-network`，这里代码中做了硬编码。

### 开启VPC网关功能

VPC 网关功能需要通过 `kube-system` 下的 `ovn-vpc-nat-gw-config` 开启：

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: ovn-vpc-nat-config
  namespace: kube-system
data:
  image: 'docker.io/kubeovn/vpc-nat-gateway:v1.12.3'
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: ovn-vpc-nat-gw-config
  namespace: kube-system
data:
  enable-vpc-nat-gw: 'true'
```

- `image`: 网关 Pod 所使用的镜像。
- `enable-vpc-nat-gw`： 控制是否启用 VPC 网关功能。

### 创建 VPC 网关并配置默认路由

```yaml
kind: VpcNatGateway
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-gw
spec:
  vpc: {{.Namespace}}-vpc
  subnet: {{.Namespace}}-net
  lanIp: 172.65.0.254
  selector:
    - "kubernetes.io/os: linux"
  externalSubnets:
    - ovn-vpc-external-network
```

- `subnet`： 为 VPC 内某个 `Subnet` 名，VPC 网关 Pod 会在该子网下用 `lanIp` 来连接租户网络。
- `lanIp`：`subnet` 内某个未被使用的 IP，VPC 网关 Pod 最终会使用该 Pod。
- `selector`: VPC 网关 Pod 的节点选择器。
- `nextHopIP`：需和 `lanIp` 相同。

### 创建弹性公网IP

EIP 为外部网络段的某个 IP 分配给 VPC 网关后可进行浮动IP，SNAT 和 DNAT 操作。

随机分配一个地址给 EIP：

```yaml
kind: IptablesEIP
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-eip
spec:
  natGwDp: {{.Namespace}}-gw
```
固定 EIP 地址分配：

```yaml
kind: IptablesEIP
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-eip-static
spec:
  natGwDp: {{.Namespace}}-gw
  v4ip: 192.168.239.203
```

### 创建SNAT规则

```yaml
kind: IptablesEIP
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-eip
spec:
  natGwDp: {{.Namespace}}-gw
---
kind: IptablesSnatRule
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-snat
spec:
  eip: {{.Namespace}}-eip
  internalCIDR: 172.65.0.0/16
---
```

### 创建浮动IP

```yaml
kind: IptablesEIP
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-eip
spec:
  natGwDp: {{.Namespace}}-gw
---
kind: IptablesFIPRule
apiVersion: kubeovn.io/v1
metadata:
  name: {{.Namespace}}-fip
spec:
  eip: {{.Namespace}}-eip
  internalIp: 172.65.0.200
---
```

