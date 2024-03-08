---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cluster-mesh.png
tag:
  - Cilium
  - 网络
  - cni
  - kubernetes
sticky: 1
prev:
  text: 'Cilium系列一：使用bird和cilium部署BGP模式的k8s集群'
  link: '/cilium/bgp-exercise-bird-cilium'
---

# Cilium系列二：Cilium在集群网格Cluster Mesh中的实践

Cilium Cluster Mesh 允许您连接多个集群的网络，只要所有集群都运行 Cilium 作为其 CNI，每个集群中的 pod 都可以发现和访问网格中所有其他集群中的服务。这允许有效地将多个集群加入到一个大型统一网络中，无论每个集群运行的 Kubernetes 发行版如何。

## 安装集群

我们对这些集群有两个要求：

1. 禁用默认的 CNI，以便我们可以轻松安装 Cilium
2. 使用不相交的 Pod 和服务子网

:::code-group
```yaml [kind-mesh1]
apiVersion: kind.x-k8s.io/v1alpha4
kind: Cluster
networking:
  disableDefaultCNI: true
  kubeProxyMode: none
  podSubnet: 10.1.0.0/16
  serviceSubnet: 172.20.1.0/24
nodes:
  - role: control-plane
    extraPortMappings:
      # localhost.run proxy
      - containerPort: 32042
        hostPort: 32042
      # Hubble relay
      - containerPort: 31234
        hostPort: 31234
      # Hubble UI
      - containerPort: 31235
        hostPort: 31235
  - role: worker
  - role: worker
```
```yaml [kind-mesh2]
apiVersion: kind.x-k8s.io/v1alpha4
kind: Cluster
networking:
  disableDefaultCNI: true
  kubeProxyMode: none
  podSubnet: 10.2.0.0/16
  serviceSubnet: 172.20.2.0/24
nodes:
  - role: control-plane
  - role: worker
  - role: worker
```
:::

安装两个集群，

:::code-group
```bash [kind-mesh1]
$ kind create cluster --name mesh1 --config kind-mesh1.yaml
$ cilium install \
  --set cluster.name=mesh1 \
  --set cluster.id=1 \
  --set ipam.mode=kubernetes \
  --context kind-mesh1
$ cilium hubble enable --ui --context kind-mesh1
```
```bash [kind-mesh2]
$ kind create cluster --name mesh2 --config kind-mesh2.yaml
$ cilium install \
  --set cluster.name=mesh2 \
  --set cluster.id=2 \
  --set ipam.mode=kubernetes \
  --context kind-mesh2
$ cilium hubble enable --ui --context kind-mesh2
```
:::

## 启用集群网格Cluster Mesh

开启Cluster Mesh,

:::code-group
```bash [kind-mesh1]
$ cilium clustermesh enable --service-type NodePort --context kind-mesh1
$ cilium clustermesh status --wait
```
```bash [kind-mesh2]
$ cilium clustermesh enable --service-type NodePort --context kind-mesh2
$ cilium clustermesh status --wait
```
:::

连接两个集群，

```bash
$ cilium clustermesh connect --context kind-mesh1 --destination-context kind-mesh2
$ cilium clustermesh status --wait --context kind-mesh1
#出现以下字段视为连接成功
  Cluster Connections:
  - tion: 3/3 configured, 3/3 connected
```

