---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/cilium-kubeOVN-cover.png
date: 2024-02-20
tag:
  - Cilium
  - 网络
  - cni
  - kubernetes
sticky: 1
prev:
  text: 'Cilium系列二：Cilium在集群网格Cluster Mesh中的实践'
  link: '/posts/cilium/exercise-cluster-mesh'
next:
  text: 'Cilium系列四：Cilium集成Gateway API'
  link: '/posts/cilium/cilium-gateway-api'
---

# Cilium系列三：Cilium集成kubeOVN安装k8s集群

## 前提条件

- helm
- sealos二进制cli
- kubeOVN的安装脚本`install.sh`

节点规划如下：

|角色| 节点IP |集群版本|
|----|-------|--------|
|`master`|`192.168.239.35`|v1.29.0|
|`worker`|`192.168.239.167`|v1.29.0|
|`worker`|`192.168.239.98`|v1.29.0|

## 使用sealos安装k8s集群

因为之后需要安装Cilium，并替代kube-proxy，我们首先生成sealos的`Clusterfile`并对`Clusterfile`作修改，

```bash
$ sealos gen labring/kubernetes:v1.29.0 --masters=192.168.239.35 --nodes=192.168.239.167,192.168.239.98 -p "xxx" --output Clusterfile
```

在生成的`Clusterfile`中，添加skip-phases，

:::details InitConfiguration
```yaml
BootstrapTokens: null
CertificateKey: ""
LocalAPIEndpoint:
  AdvertiseAddress: 192.168.239.35
  BindPort: 6443
NodeRegistration:
  CRISocket: /run/containerd/containerd.sock
  IgnorePreflightErrors: null
  KubeletExtraArgs: null
  Name: ""
  Taints: null
Patches: null
SkipPhases: null  // [!code --]
SkipPhases: // [!code ++]
  - addon/kube-proxy // [!code ++]
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
```
:::
以及使用阿里云的镜像仓，
:::details ClusterConfiguration
```yaml
APIServer:
  CertSANs:
  - 127.0.0.1
  - apiserver.cluster.local
  - 10.103.97.2
  - 192.168.239.35
  ExtraArgs:
    audit-log-format: json
    audit-log-maxage: "7"
    audit-log-maxbackup: "10"
    audit-log-maxsize: "100"
    audit-log-path: /var/log/kubernetes/audit.log
    audit-policy-file: /etc/kubernetes/audit-policy.yml
    enable-aggregator-routing: "true"
    feature-gates: ""
  ExtraVolumes:
  - HostPath: /etc/kubernetes
    MountPath: /etc/kubernetes
    Name: audit
    PathType: DirectoryOrCreate
    ReadOnly: false
  - HostPath: /var/log/kubernetes
    MountPath: /var/log/kubernetes
    Name: audit-log
    PathType: DirectoryOrCreate
    ReadOnly: false
  - HostPath: /etc/localtime
    MountPath: /etc/localtime
    Name: localtime
    PathType: File
    ReadOnly: true
  - HostPath: /etc/kubernetes
    MountPath: /etc/kubernetes
    Name: audit
    PathType: DirectoryOrCreate
    ReadOnly: false
  - HostPath: /var/log/kubernetes
    MountPath: /var/log/kubernetes
    Name: audit-log
    PathType: DirectoryOrCreate
    ReadOnly: false
  - HostPath: /etc/localtime
    MountPath: /etc/localtime
    Name: localtime
    PathType: File
    ReadOnly: true
  TimeoutForControlPlane: null
CIImageRepository: ""
CIKubernetesVersion: ""
CertificatesDir: ""
ClusterName: ""
ComponentConfigs: null
ControlPlaneEndpoint: apiserver.cluster.local:6443
ControllerManager:
  ExtraArgs:
    bind-address: 0.0.0.0
    cluster-signing-duration: 876000h
    feature-gates: ""
  ExtraVolumes:
  - HostPath: /etc/localtime
    MountPath: /etc/localtime
    Name: localtime
    PathType: File
    ReadOnly: true
  - HostPath: /etc/localtime
    MountPath: /etc/localtime
    Name: localtime
    PathType: File
    ReadOnly: true
DNS:
  ImageRepository: ""
  ImageTag: ""
  Type: ""
Etcd:
  External: null
  Local:
    DataDir: ""
    ExtraArgs:
      listen-metrics-urls: http://0.0.0.0:2381
    ImageRepository: ""
    ImageTag: ""
    PeerCertSANs: null
    ServerCertSANs: null
FeatureGates: null
ImageRepository: "" // [!code --]
ImageRepository: "registry.aliyuncs.com/google_containers" // [!code ++]
KubernetesVersion: v1.29.0
Networking:
  DNSDomain: ""
  PodSubnet: 100.64.0.0/10
  ServiceSubnet: 10.96.0.0/22
Scheduler:
  ExtraArgs:
    bind-address: 0.0.0.0
    feature-gates: ""
  ExtraVolumes:
  - HostPath: /etc/localtime
    MountPath: /etc/localtime
    Name: localtime
    PathType: File
    ReadOnly: true
  - HostPath: /etc/localtime
    MountPath: /etc/localtime
    Name: localtime
    PathType: File
    ReadOnly: true
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
```
:::

### 安装Cilium

等待安装k8s集群成功以后，这时coredns还没起来，先安装Cilium，

```bash
$ helm install cilium cilium/cilium --namespace kube-system \
--set kubeProxyReplacement=strict \
--set k8sServiceHost=192.168.239.35 \
--set k8sServicePort=6443 \
--set hubble.relay.enabled=true \
--set hubble.ui.enabled=true \
--set prometheus.enabled=true \
--set operator.prometheus.enabled=true \
--set gatewayAPI.enabled=true \
--set-string extraConfig.enable-envoy-config=true \
--set hubble.metrics.enabled="{dns,drop,tcp,flow,port-distribution,icmp,http}"
```

由于Cni优先使用Cilium，之后安装的kubeOVN脚本`install.sh`需要做一下调整，

```shell
// 禁用kubeOVN的NetworkPolicy
ENABLE_NP=${ENABLE_NP:-false}

// 调整优先级
CNI_CONFIG_PRIORITY=${CNI_CONFIG_PRIORITY:-10}

// 启用loadBalancer的service
ENABLE_LB_SVC=${ENABLE_LB_SVC:-true}
```

### Cilium集成kubeOVN

由于Cilium集成kubeOVN，我们采用chaining模式，

```bash
$ kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: cni-configuration
  namespace: kube-system
data:
  cni-config: |-
    {
      "name": "generic-veth",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "kube-ovn",
          "server_socket": "/run/openvswitch/kube-ovn-daemon.sock",
          "ipam": {
              "type": "kube-ovn",
              "server_socket": "/run/openvswitch/kube-ovn-daemon.sock"
          }
        },
        {
          "type": "portmap",
          "snat": true,
          "capabilities": {"portMappings": true}
        },
        {
          "type": "cilium-cni"
        }
      ]
    }
EOF
```

并upgrade Cilium,

```bash
$ helm upgrade cilium cilium/cilium --namespace kube-system \
--reuse-values \
--set autoDirectNodeRoutes=true \
--set ipv4NativeRoutingCIDR=10.16.0.0/16 \
--set loadBalancer.acceleration=native \
--set cni.chainingMode=generic-veth \
--set cni.customConf=true \
--set cni.configMap=cni-configuration \
--set enableIPv4Masquerade=false \
--set enableIdentityMark=false \
--set routingMode=native
```

## 异常问题

### hubble relay异常

升级完以后，如果发现hubble的状态不正常，查看日志发现

```bash
$ kubectl logs -f  hubble-relay-67ffc5f588-qr8nt -n kube-system
 level=warning msg="Failed to create peer client for peers synchronization; will try again after the timeout has expired" error="context deadline exceeded" subsys=hubble-relay target="hubble-peer.kube-system.svc.cluster.local:443"
```

集群中`coredns`的配置没有`cluster.local`的解析，我们手动增加一个即可。

```yaml
apiVersion: v1
data:
  Corefile: |
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cili-cluster.tclocal in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        prometheus :9153
        forward . /etc/resolv.conf {
           max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
    cluster.local.:53 { // [!code ++]
        errors // [!code ++]
        health { // [!code ++]
           lameduck 5s // [!code ++]
        } // [!code ++]
        ready // [!code ++]
        kubernetes cluster.local in-addr.arpa ip6.arpa { // [!code ++]
           pods insecure // [!code ++]
           fallthrough in-addr.arpa ip6.arpa // [!code ++]
           ttl 30 // [!code ++]
        } // [!code ++]
        prometheus :9153 // [!code ++]
        cache 30 // [!code ++]
        loop // [!code ++]
        reload // [!code ++]
        loadbalance // [!code ++]
    } // [!code ++]
kind: ConfigMap
metadata:
  name: coredns
```