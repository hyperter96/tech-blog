---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cluster-mesh.png
date: 2024-02-07
tag:
  - Cilium
  - 网络
  - cni
  - kubernetes
sticky: 1
prev:
  text: 'Cilium系列二：使用bird和cilium部署BGP模式的k8s集群'
  link: '/posts/cilium/bgp-exercise-bird-cilium'
next:
  text: 'Cilium系列四：Cilium集成kubeOVN安装k8s集群'
  link: '/posts/cilium/install-cluster-with-kubeOVN'
---

# Cilium系列三：Cilium在集群网格Cluster Mesh中的实践

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

## 启用服务便于后续验证集群是否打通

部署`rebel-base-deployment.yaml`文件如下，

:::details `rebel-base-deployment.yaml`
```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rebel-base
spec:
  selector:
    matchLabels:
      name: rebel-base
  replicas: 2
  template:
    metadata:
      labels:
        name: rebel-base
    spec:
      containers:
      - name: rebel-base
        image: docker.io/nginx:1.15.8
        volumeMounts:
          - name: html
            mountPath: /usr/share/nginx/html/
        livenessProbe:
          httpGet:
            path: /
            port: 80
          periodSeconds: 1
        readinessProbe:
          httpGet:
            path: /
            port: 80
      volumes:
        - name: html
          configMap:
            name: rebel-base-response
            items:
              - key: message
                path: index.html
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: x-wing
spec:
  selector:
    matchLabels:
      name: x-wing
  replicas: 2
  template:
    metadata:
      labels:
        name: x-wing
    spec:
      containers:
      - name: x-wing-container
        image: docker.io/cilium/json-mock:1.2
        livenessProbe:
          exec:
            command:
            - curl
            - -sS
            - -o
            - /dev/null
            - localhost
        readinessProbe:
          exec:
            command:
            - curl
            - -sS
            - -o
            - /dev/null
            - localhost
```
:::

两个集群分别配置`rebel-base-deployment.yaml`和对应的configmap，

:::code-group
```bash [kind-mesh1]
$ kubectl --context kind-mesh1 apply -f rebel-base-deployment.yaml
$ kubectl --context kind-mesh1 apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: rebel-base-response
data:
  message: "{\"Cluster\": \"mesh1\", \"Planet\": \"N'Zoth\"}\n"
EOF
```
```bash [kind-mesh2]
$ kubectl --context kind-mesh2 apply -f rebel-base-deployment.yaml
$ kubectl --context kind-mesh2 apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: rebel-base-response
data:
  message: "{\"Cluster\": \"mesh2\", \"Planet\": \"Foran Tutha\"}\n"
EOF
## 部署service
$ kubectl --context kind-mesh2 apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: rebel-base
spec:
  type: ClusterIP
  ports:
  - port: 80
  selector:
    name: rebel-base
EOF
```
:::


验证pod是否完成部署并能够提供服务

:::code-group
```bash [kind-mesh1]
kubectl --context kind-mesh1 exec -ti deployments/x-wing -- /bin/sh -c 'for i in $(seq 1 10); do curl rebel-base; done'
```
```bash [kind-mesh2]
kubectl --context kind-mesh2 exec -ti deployments/x-wing -- /bin/sh -c 'for i in $(seq 1 10); do curl rebel-base; done'
```
:::

## 通过注解实现不同集群服务互相访问

在不同的集群上对service添加注解

:::code-group
```bash [kind-mesh1]
kubectl --context kind-mesh1 annotate service rebel-base service.cilium.io/global="true"
```
```bash [kind-mesh2]
kubectl --context kind-mesh2 annotate service rebel-base service.cilium.io/global="true"
```
:::