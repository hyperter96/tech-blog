---
top: 1
tag:
  - Cilium
  - 网络
  - cni
recommend: 1
sticky: 1
---

# Cilium系列一：使用bird和cilium部署BGP模式的k8s集群

这是使用 Cilium BGP 控制平面 (BGP CP) 向外部 BGP 路由器通告路由以及在两个集群之间路由的演示。 每个集群执行以下操作：

1. 运行 2 个作为部署进行管理的 nginx pod。
2. 将 nginx pod 作为服务公开。
3. 使用 Cilium IP 池将外部 IP 分配给服务。
4. 使用 BGP CP 通告 nginx 服务。

![](https://cdn.jsdelivr.net/gh/hyperter96/hyperter96.github.io/img/cilium-bgp-demo.svg)

## 前置条件

1. `kubectl`
2. `helm`
3. `kind`
4. `cilium-cli`

## 安装集群

使用`kind`安装第一个集群，

```bash
$ kind create cluster --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  disableDefaultCNI: true   # do not install kindnet
  kubeProxyMode: none       # do not run kube-proxy
  podSubnet: "10.241.0.0/16"
  serviceSubnet: "10.11.0.0/16"
name: cilium
nodes:
- role: control-plane
- role: worker
- role: worker
EOF
```