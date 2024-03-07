---
top: 1
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cilium-bgp-demo.svg
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

![](../assets/images/cilium-bgp-demo.svg)

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

注意：使用两个工作节点，因此 nginx 部署中的每个 pod 都被安排到一个单独的节点。

创建用于第二个集群的 Docker 网络：

```bash
docker network create -d=bridge \
    -o "com.docker.network.bridge.enable_ip_masquerade=true" \
    --attachable \
    "kind2"
```

设置 `KIND_EXPERIMENTAL_DOCKER_NETWORK` 环境变量，让 `kind` 使用此网络而不是默认的 `kind` 网络：

```bash
export KIND_EXPERIMENTAL_DOCKER_NETWORK=kind2
```

创建第二个集群，

```bash
$ kind create cluster --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  disableDefaultCNI: true   # do not install kindnet
  kubeProxyMode: none       # do not run kube-proxy
  podSubnet: "10.242.0.0/16"
  serviceSubnet: "10.12.0.0/16"
name: cilium2
nodes:
- role: control-plane
- role: worker
- role: worker
EOF
```

删除环境变量，以便将来的集群安装使用默认类型的 Docker 网络。

```bash
unset KIND_EXPERIMENTAL_DOCKER_NETWORK
```

您现在有两个不同网络的 k8s 集群，且暂时无法相互通信。