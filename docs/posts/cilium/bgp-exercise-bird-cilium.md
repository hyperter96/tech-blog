---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cilium-bgp-demo.svg
date: 2024-02-05
tag:
  - Cilium
  - 网络
  - cni
  - kubernetes
sticky: 1
next:
  text: 'Cilium系列二：Cilium在集群网格Cluster Mesh中的实践'
  link: '/posts/cilium/exercise-cluster-mesh'
---

# Cilium系列一：使用bird和cilium部署BGP模式的k8s集群

这是使用 Cilium BGP 控制平面 (BGP CP) 向外部 BGP 路由器通告路由以及在两个集群之间路由的演示。 每个集群执行以下操作：

1. 运行 2 个作为部署进行管理的 nginx pod。
2. 将 nginx pod 作为服务公开。
3. 使用 Cilium IP 池将外部 IP 分配给服务。
4. 使用 BGP CP 通告 nginx 服务。

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
:::warning 注意
使用两个工作节点，因此 nginx 部署中的每个 pod 都被安排到一个单独的节点。
:::

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

您现在有两个不同网络的 k8s 集群，且暂时无法相互通信。两个集群的节点信息如下，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 get nodes -o wide
NAME                    STATUS   ROLES           AGE    VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION                        CONTAINER-RUNTIME
cilium2-control-plane   Ready    control-plane   2d5h   v1.27.3   172.19.0.4    <none>        Debian GNU/Linux 11 (bullseye)   5.15.133.1-microsoft-standard-WSL2+   containerd://1.7.1
cilium2-worker          Ready    svr             2d5h   v1.27.3   172.19.0.3    <none>        Debian GNU/Linux 11 (bullseye)   5.15.133.1-microsoft-standard-WSL2+   containerd://1.7.1
cilium2-worker2         Ready    <none>          2d5h   v1.27.3   172.19.0.2    <none>        Debian GNU/Linux 11 (bullseye)   5.15.133.1-microsoft-standard-WSL2+   containerd://1.7.1
```
```bash [kind-cilium]
$ kubectl --context kind-cilium get nodes -o wide
NAME                   STATUS   ROLES           AGE    VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION                        CONTAINER-RUNTIME
cilium-control-plane   Ready    control-plane   2d5h   v1.27.3   172.18.0.2    <none>        Debian GNU/Linux 11 (bullseye)   5.15.133.1-microsoft-standard-WSL2+   containerd://1.7.1
cilium-worker          Ready    <none>          2d5h   v1.27.3   172.18.0.3    <none>        Debian GNU/Linux 11 (bullseye)   5.15.133.1-microsoft-standard-WSL2+   containerd://1.7.1
cilium-worker2         Ready    <none>          2d5h   v1.27.3   172.18.0.4    <none>        Debian GNU/Linux 11 (bullseye)   5.15.133.1-microsoft-standard-WSL2+   containerd://1.7.1
```
:::

## 安装Cilium

在第二个集群中安装 `Cilium v1.14`。 Kind 应该为 `kind-cilium2` 的 `context` 设置 `kubectl context`。 在本指南中使用 `kubectl config use-context` 命令在 `kind-cilium` 和 `kind-cilium2` 的 `context` 之间进行更改，例如 `cilium` 和 `cilium 2` 集群。

:::warning 注意
如果这是第一次使用 `Helm` 安装 `Cilium`，请使用 `install` 子命令而不是 `upgrade`。
:::

:::code-group
```bash [kind-cilium2]
$ helm upgrade --kube-context kind-cilium2 --install cilium cilium/cilium --namespace kube-system --version 1.14.0 --values - <<EOF
kubeProxyReplacement: strict
k8sServiceHost: cilium2-control-plane # use master node in kind network
k8sServicePort: 6443               # use api server port
hostServices:
  enabled: false
externalIPs:
  enabled: true
nodePort:
  enabled: true
hostPort:
  enabled: true
image:
  pullPolicy: IfNotPresent
ipam:
  mode: kubernetes
tunnel: disabled
ipv4NativeRoutingCIDR: 10.11.0.0/16
bgpControlPlane:
  enabled: true
autoDirectNodeRoutes: true
EOF
```
```bash [kind-cilium]
$ helm upgrade --kube-context kind-cilium --install cilium cilium/cilium --namespace kube-system --version 1.14.0 --values - <<EOF
kubeProxyReplacement: strict
k8sServiceHost: cilium-control-plane # use master node in kind network
k8sServicePort: 6443               # use api server port
hostServices:
  enabled: false
externalIPs:
  enabled: true
nodePort:
  enabled: true
hostPort:
  enabled: true
image:
  pullPolicy: IfNotPresent
ipam:
  mode: kubernetes
tunnel: disabled
ipv4NativeRoutingCIDR: 10.12.0.0/16
bgpControlPlane:
  enabled: true
autoDirectNodeRoutes: true
EOF
```
:::

等待cilium安装成功，

:::code-group
```bash [kind-cilium2]
$ cilium --context kind-cilium2 status --wait
    /¯¯\
 /¯¯\__/¯¯\    Cilium:             OK
 \__/¯¯\__/    Operator:           OK
 /¯¯\__/¯¯\    Envoy DaemonSet:    disabled (using embedded mode)
 \__/¯¯\__/    Hubble Relay:       disabled
    \__/       ClusterMesh:        disabled

DaemonSet              cilium             Desired: 2, Ready: 2/2, Available: 2/2
Deployment             cilium-operator    Desired: 2, Ready: 2/2, Available: 2/2
Containers:            cilium-operator    Running: 2
                       cilium             Running: 2
Cluster Pods:          3/3 managed by Cilium
Helm chart version:    1.14.0
Image versions         cilium             quay.io/cilium/cilium:v1.14.0@sha256:5a94b561f4651fcfd85970a50bc78b201cfbd6e2ab1a03848eab25a82832653a: 2
                       cilium-operator    quay.io/cilium/operator-generic:v1.14.0@sha256:3014d4bcb8352f0ddef90fa3b5eb1bbf179b91024813a90a0066eb4517ba93c9: 2
```
```bash [kind-cilium]
$ cilium --context kind-cilium status --wait
    /¯¯\
 /¯¯\__/¯¯\    Cilium:             OK
 \__/¯¯\__/    Operator:           OK
 /¯¯\__/¯¯\    Envoy DaemonSet:    disabled (using embedded mode)
 \__/¯¯\__/    Hubble Relay:       disabled
    \__/       ClusterMesh:        disabled

Deployment             cilium-operator    Desired: 2, Ready: 2/2, Available: 2/2
DaemonSet              cilium             Desired: 2, Ready: 2/2, Available: 2/2
Containers:            cilium             Running: 2
                       cilium-operator    Running: 2
Cluster Pods:          3/3 managed by Cilium
Helm chart version:    1.14.0
Image versions         cilium             quay.io/cilium/cilium:v1.14.0@sha256:5a94b561f4651fcfd85970a50bc78b201cfbd6e2ab1a03848eab25a82832653a: 2
                       cilium-operator    quay.io/cilium/operator-generic:v1.14.0@sha256:3014d4bcb8352f0ddef90fa3b5eb1bbf179b91024813a90a0066eb4517ba93c9: 2
```
:::

## 运行外部BGP路由

我们使用 Bird 作为外部路由器，并与每个集群中的 Cilium BGP 路由器对等。`bird.conf`的配置如下，

:::details `bird.conf`
```text
log "bird.log" all;
# debug protocols all;

protocol device {
    scan time 10;
}

# BGP peer cilium-control-plane node config
protocol bgp cluster1_cp {
    # IP of Bird container interface to kind-cilium cluster
    router id 172.18.0.5;

    ipv4 {
        import all;
        export all;
    };

    # Local settings (Assuming AS 65000 for our BIRD instance)
    local as 65000;

    # Peer cilium-control-plane node
    neighbor 172.18.0.2 as 65100;
}

# BGP peer cilium-worker node config
protocol bgp cluster1_worker {
    # IP of Bird container interface to kind-cilium cluster
    router id 172.18.0.5; # eth0 IP of Bird container

    ipv4 {
        import all;
        export all;
    };

    # Local settings (Assuming AS 65000 for our BIRD instance)
    local as 65000;

    # Peer cilium-worker node
    neighbor 172.18.0.3 as 65100;
}

# BGP peer cilium-worker2 node config
protocol bgp cluster1_worker2 {
    # IP of Bird container interface to kind-cilium cluster
    router id 172.18.0.5;

    ipv4 {
        import all;
        export all;
    };

    # Local settings (Assuming AS 65000 for our BIRD instance)
    local as 65000;

    # Peer cilium-worker2 node
    neighbor 172.18.0.4 as 65100;
}

# BGP peer cilium2-control-plane node config
protocol bgp cluster2_cp {
    # IP of Bird container interface to kind-cilium2 cluster
    router id 172.19.0.5;

    ipv4 {
        import all;
        export all;
    };

    # Local settings (Assuming AS 65000 for our BIRD instance)
    local as 65000;

    # Peer cilium2-control-plane node
    neighbor 172.19.0.4 as 65200;
}

# BGP peer cilium2-worker node config
protocol bgp cluster2_worker {
    # IP of Bird container interface to kind-cilium2 cluster
    router id 172.19.0.5;

    ipv4 {
        import all;
        export all;
    };

    # Local settings (Assuming AS 65000 for our BIRD instance)
    local as 65000;

    # Peer cilium2-worker node
    neighbor 172.19.0.3 as 65200;
}

# BGP peer cilium2-worker2 node config
protocol bgp cluster2_worker2 {
    # IP of Bird container interface to kind-cilium2 cluster
    router id 172.19.0.5;

    ipv4 {
        import all;
        export all;
    };

    # Local settings (Assuming AS 65000 for our BIRD instance)
    local as 65000;

    # Peer cilium-worker2 node
    neighbor 172.19.0.2 as 65200;
}

# Direct routes
protocol direct {
    interface "eth*", "lo";  # Listen to these interfaces for direct routes
}

# This protocol manages kernel route table
protocol kernel {
    learn;          # Learn existing routes from kernel
    persist;        # Don't remove routes on BIRD shutdown
    scan time 20;   # Scan kernel routing table every 20 seconds
    ipv4 {
        export all;     # Default is export none
        import none;    # Default is import all
    };
}
```
:::

拉取 `bird` 的镜像，

```bash
$ docker pull ghcr.io/akafeng/bird
```

启动 `bird-router`的容器，

```bash
$ docker run -d -v $(pwd):/etc/bird/ --cap-add=NET_ADMIN --network=kind --name=bird-router ghcr.io/akafeng/bird
```

待容器启动以后，进入容器，

```bash
$ docker exec -it bird-router sh
```

重新加载 `bird` 的配置，

```bash
birdc configure
```

验证网络接口配置和路由表：

```bash
$ ip addr list
$ ip route
```

验证 BGP 配置。 

:::warning 注意
在为两个集群配置 Cilium BGP CP 之前，配置的对等点不会 `ESTABLISHED`。
:::

## 运行 nginx sample 应用

两个集群同时创建 nginx 应用，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
EOF
```
```bash [kind-cilium]
$ kubectl --context kind-cilium apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
EOF
```
:::

各获取 nginx Pod 的IP，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 get po -o wide | grep nginx
nginx-55f598f8d-76knw   1/1     Running   0          39h   10.242.2.61    cilium2-worker    <none>           <none>
nginx-55f598f8d-lttxc   1/1     Running   0          39h   10.242.1.251   cilium2-worker2   <none>           <none>
```
```bash [kind-cilium]
$ kubectl --context kind-cilium get po -o wide | grep nginx
nginx-55f598f8d-mxcw6   1/1     Running   0          39h   10.241.1.140   cilium-worker    <none>           <none>
nginx-55f598f8d-xd4t8   1/1     Running   0          39h   10.241.2.19    cilium-worker2   <none>           <none>
```
:::

同一个集群下，测试两个nginx是否连通，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 exec po/nginx-55f598f8d-76knw -- curl -s -o /dev/null -w "%{http_code}" http://10.242.1.251
200
```
```bash [kind-cilium]
$ kubectl --context kind-cilium exec po/nginx-55f598f8d-mxcw6 -- curl -s -o /dev/null -w "%{http_code}" http://10.241.2.19
200
```
:::

每个集群内的连接已成功验证，您现在可以继续下一部分。

使用负载均衡器服务公开每个集群的 nginx 部署。 首先创建用于向负载均衡器服务分配地址的 IPAM 池：

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 apply -f - <<EOF
apiVersion: "cilium.io/v2alpha1"
kind: CiliumLoadBalancerIPPool
metadata:
  name: demo
spec:
  cidrs:
  - cidr: "10.12.0.0/16"
EOF
```
```bash [kind-cilium]
$ kubectl --context kind-cilium apply -f - <<EOF
apiVersion: "cilium.io/v2alpha1"
kind: CiliumLoadBalancerIPPool
metadata:
  name: demo
spec:
  cidrs:
  - cidr: "10.11.0.0/16"
EOF
```
:::

并暴露 nginx 服务，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 expose deployment nginx --type=LoadBalancer --port=80 --labels app=nginx
```
```bash [kind-cilium]
$ kubectl --context kind-cilium expose deployment nginx --type=LoadBalancer --port=80 --labels app=nginx
```
:::

每个集群的 nginx 服务都应该有一个从 IPAM 池分配的外部 IP。 检查两个集群中nginx服务的外部IP，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 get svc/nginx
NAME    TYPE           CLUSTER-IP    EXTERNAL-IP     PORT(S)        AGE
nginx   LoadBalancer   10.12.173.3   10.12.225.247   80:32313/TCP   39h
```
```bash [kind-cilium]
$ kubectl --context kind-cilium get svc/nginx
NAME    TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)        AGE
nginx   LoadBalancer   10.11.144.48   10.11.192.248   80:32047/TCP   39h
```
:::

在接下来的步骤中，BGP 将公布外部 IP，以提供负载均衡器服务的外部/集群间连接。

## 配置 BGP

Cilium BGP 配置分为两部分：

1. 注释将运行 BGP 的节点并配置对等策略以配置 BGP 对端
2. 通告路由等。

有关 BGP 控制平面的其他详细信息，请参阅[官方文档](https://docs.cilium.io/en/v1.14/network/bgp-control-plane/)。

注释两个集群的节点，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 annotate node/cilium2-control-plane cilium.io/bgp-virtual-router.65200="local-port=179"
$ kubectl --context kind-cilium2 annotate node/cilium2-worker cilium.io/bgp-virtual-router.65200="local-port=179"
$ kubectl --context kind-cilium2 annotate node/cilium2-worker2 cilium.io/bgp-virtual-router.65200="local-port=179"
```
```bash [kind-cilium]
$ kubectl --context kind-cilium annotate node/cilium-control-plane cilium.io/bgp-virtual-router.65100="local-port=179"
$ kubectl --context kind-cilium annotate node/cilium-worker cilium.io/bgp-virtual-router.65100="local-port=179"
$ kubectl --context kind-cilium annotate node/cilium-worker2 cilium.io/bgp-virtual-router.65100="local-port=179"
```
:::

:::warning 注意
在典型部署中，BGP CP 将不会在控制平面节点上运行，因为它们不运行工作负载 Pod。
:::

由于在此演示中每个集群都处于单独管理之下，因此使用了不同的自治系统 (AS) 编号，分别为 65100 和 65200。

将 BGP peer policy 应用于两个集群，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 apply -f - <<EOF
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPPeeringPolicy
metadata:
  name: demo
spec:
  nodeSelector:
    matchLabels:
      kubernetes.io/os: linux
  virtualRouters:
    - exportPodCIDR: true
      localASN: 65200
      neighbors:
        - peerASN: 65000
          peerAddress: 172.19.0.5/32 # eth1 IP of Bird router
      serviceSelector:
        matchLabels:
          app: nginx
EOF
```
```bash [kind-cilium]
$ kubectl --context kind-cilium apply -f - <<EOF
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPPeeringPolicy
metadata:
  name: demo
spec:
  nodeSelector:
    matchLabels:
      kubernetes.io/os: linux
  virtualRouters:
    - exportPodCIDR: true
      localASN: 65100
      neighbors:
        - peerASN: 65000
          peerAddress: 172.18.0.5/32 # eth0 IP of Bird router
      serviceSelector:
        matchLabels:
          app: nginx
EOF
```
:::

:::warning 注意
`exportPodCIDR` 字段的设置是为了让节点通告 Pod CIDR。 这将允许外部 Bird 路由器将响应流量路由回 cURL 客户端。
:::
由于 BGP CP 不会将路由添加到数据路径（即本地节点路由表），因此您必须在节点上创建到对方集群的 Service 和 Pod CIDR 的静态路由。

在两个集群中添加静态路由。 使用 `kubectl --context kind-cilium get po -n kube-system | grep cilium` 如果您需要 Cilium pod 的容器名称，

:::code-group
```bash [kind-cilium2]
$ kubectl --context kind-cilium2 get po -n kube-system | grep cilium
cilium-g7djj                                    1/1     Running   49 (2d2h ago)   2d5h
cilium-jq5xr                                    1/1     Running   49 (2d2h ago)   2d5h
cilium-operator-5c748d6d-5hnfx                  1/1     Running   2 (2d2h ago)    2d5h
cilium-operator-5c748d6d-q8gsl                  1/1     Running   1 (2d2h ago)    2d5h
cilium-sh6qh                                    1/1     Running   49 (2d2h ago)   2d5h
etcd-cilium2-control-plane                      1/1     Running   1 (2d2h ago)    2d6h
kube-apiserver-cilium2-control-plane            1/1     Running   1 (2d2h ago)    2d6h
kube-controller-manager-cilium2-control-plane   1/1     Running   3 (2d2h ago)    2d6h
kube-scheduler-cilium2-control-plane            1/1     Running   3 (2d2h ago)    2d6h
$ kubectl --context kind-cilium exec po/cilium-g7djj -n kube-system -- ip route add 10.11.0.0/16 via 172.19.0.5
$ kubectl --context kind-cilium exec po/cilium-g7djj -n kube-system -- ip route add 10.241.0.0/16 via 172.19.0.5
$ kubectl --context kind-cilium exec po/cilium-jq5xr -n kube-system -- ip route add 10.11.0.0/16 via 172.19.0.5
$ kubectl --context kind-cilium exec po/cilium-jq5xr -n kube-system -- ip route add 10.241.0.0/16 via 172.19.0.5
$ kubectl --context kind-cilium exec po/cilium-sh6qh -n kube-system -- ip route add 10.11.0.0/16 via 172.19.0.5
$ kubectl --context kind-cilium exec po/cilium-sh6qh -n kube-system -- ip route add 10.241.0.0/16 via 172.19.0.5
```
```bash [kind-cilium]
$ kubectl --context kind-cilium get po -n kube-system | grep cilium
cilium-2kfdw                                   1/1     Running   49 (2d2h ago)   2d5h
cilium-88mkj                                   1/1     Running   50 (2d2h ago)   2d5h
cilium-operator-5b5cc99864-nf657               1/1     Running   1 (2d2h ago)    2d5h
cilium-operator-5b5cc99864-xtbgh               1/1     Running   1 (2d2h ago)    2d5h
cilium-vrcj9                                   1/1     Running   50 (2d2h ago)   2d5h
etcd-cilium-control-plane                      1/1     Running   0               2d2h
kube-apiserver-cilium-control-plane            1/1     Running   0               2d2h
kube-controller-manager-cilium-control-plane   1/1     Running   1 (2d2h ago)    2d6h
kube-scheduler-cilium-control-plane            1/1     Running   2 (2d2h ago)    2d6h
$ kubectl --context kind-cilium exec po/cilium-2kfdw -n kube-system -- ip route add 10.12.0.0/16 via 172.18.0.5
$ kubectl --context kind-cilium exec po/cilium-2kfdw -n kube-system -- ip route add 10.242.0.0/16 via 172.18.0.5
$ kubectl --context kind-cilium exec po/cilium-88mkj -n kube-system -- ip route add 10.12.0.0/16 via 172.18.0.5
$ kubectl --context kind-cilium exec po/cilium-88mkj -n kube-system -- ip route add 10.242.0.0/16 via 172.18.0.5
$ kubectl --context kind-cilium exec po/cilium-vrcj9 -n kube-system -- ip route add 10.12.0.0/16 via 172.18.0.5
$ kubectl --context kind-cilium exec po/cilium-vrcj9 -n kube-system -- ip route add 10.242.0.0/16 via 172.18.0.5
```
:::

## 验证 BGP 路由连通两个集群

验证是否已使用 Bird 路由器建立了两个集群的 BGP speaker：

:::code-group
```bash [kind-cilium2]
$ cilium --context kind-cilium2 bgp peers
Node                    Local AS   Peer AS   Peer Address   Session State   Uptime      Family         Received   Advertised
cilium2-control-plane   65200      65000     172.19.0.5     established     30h35m47s   ipv4/unicast   7          2
                                                                                        ipv6/unicast   0          0
cilium2-worker          65200      65000     172.19.0.5     established     30h35m45s   ipv4/unicast   7          2
                                                                                        ipv6/unicast   0          0
cilium2-worker2         65200      65000     172.19.0.5     established     30h35m47s   ipv4/unicast   6          2
                                                                                        ipv6/unicast   0          0
```
```bash [kind-cilium]
$ cilium --context kind-cilium bgp peers
Node                   Local AS   Peer AS   Peer Address   Session State   Uptime      Family         Received   Advertised
cilium-control-plane   65100      65000     172.18.0.5     established     30h36m33s   ipv4/unicast   6          2
                                                                                       ipv6/unicast   0          0
cilium-worker          65100      65000     172.18.0.5     established     30h36m34s   ipv4/unicast   7          2
                                                                                       ipv6/unicast   0          0
cilium-worker2         65100      65000     172.18.0.5     established     30h36m31s   ipv4/unicast   7          2
                                                                                       ipv6/unicast   0          0
```
:::

进入 bird-router，

```bash
docker exec -it bird-router sh
```

验证路由表已更新，

```bash
$ ip route
default via 172.18.0.1 dev eth0 
10.11.192.248 via 172.18.0.2 dev eth0 proto bird metric 32 
10.12.225.247 via 172.19.0.2 dev eth1 proto bird metric 32 
10.241.0.0/24 via 172.18.0.2 dev eth0 proto bird metric 32 
10.241.1.0/24 via 172.18.0.3 dev eth0 proto bird metric 32 
10.241.2.0/24 via 172.18.0.4 dev eth0 proto bird metric 32 
10.242.0.0/24 via 172.19.0.4 dev eth1 proto bird metric 32 
10.242.1.0/24 via 172.19.0.2 dev eth1 proto bird metric 32 
10.242.2.0/24 via 172.19.0.3 dev eth1 proto bird metric 32 
172.18.0.0/16 dev eth0 proto kernel scope link src 172.18.0.5 
172.19.0.0/16 dev eth1 proto kernel scope link src 172.19.0.5
```

验证两个集群中的nginx服务是否连通，

:::code-group
```bash [kind-cilium2]
$ curl -s -o /dev/null -w "%{http_code}" http://10.12.225.247
200
```
```bash [kind-cilium]
$ curl -s -o /dev/null -w "%{http_code}" http://10.11.192.248
200
```
:::