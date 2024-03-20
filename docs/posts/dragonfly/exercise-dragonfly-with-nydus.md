---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/dragonfly_cover.jpg
date: 2024-01-09
tag:
  - P2P
  - Dragonfly
  - kubernetes
sticky: 1
prev:
  text: 'Dragonfly系列一：Dragonfly架构体系'
  link: '/posts/dragonfly/dragonfly-intro'
---

# Dragonfly系列二：Dragonfly 和 Nydus Mirror 模式集成实践

`Nydus` 作为 `Dragonfly` 的子项目优化了 `OCIv1` 镜像格式，并以此设计了一个镜像文件系统， 使容器可以按需下载镜像，不再需要下载完整镜像即可启动容器。 在最新版本中 `Dragonfly` 完成了和子项目 `Nydus` 的集成，让容器启动即可以按需下载镜像，减少下载量。 也可以在传输过程中利用 `Dragonfly` P2P 的传输方式，降低回源流量并且提升下载速度。

## 安装Dragonfly P2P集群

Dragonfly的`chart-config.yaml`配置：

:::details `chart-config.yaml`
```yaml
containerRuntime:
  containerd:
    enable: true
    injectConfigPath: true
    registries:
      - 'https://ghcr.io'

scheduler:
  image: dragonflyoss/scheduler
  tag: latest
  replicas: 1
  metrics:
    enable: true
  config:
    verbose: true
    pprofPort: 18066

seedPeer:
  image: dragonflyoss/dfdaemon
  tag: latest
  replicas: 1
  metrics:
    enable: true
  config:
    verbose: true
    pprofPort: 18066
    download:
      prefetch: true

dfdaemon:
  image: dragonflyoss/dfdaemon
  tag: latest
  metrics:
    enable: true
  config:
    verbose: true
    pprofPort: 18066
    download:
      prefetch: true
    proxy:
      defaultFilter: 'Expires&Signature&ns'
      security:
        insecure: true
      tcpListen:
        listen: 0.0.0.0
        port: 65001
      registryMirror:
        dynamic: true
        url: https://index.docker.io
      proxies:
        - regx: blobs/sha256.*
  hostNetwork: true


manager:
  image: dragonflyoss/manager
  tag: latest
  replicas: 1
  metrics:
    enable: true
  config:
    verbose: true
    pprofPort: 18066
```
:::

Helm安装，

```bash
$ helm repo add dragonfly https://dragonflyoss.github.io/helm-charts/
$ helm install --wait --timeout 10m --dependency-update --create-namespace --namespace dragonfly-system dragonfly dragonfly/dragonfly -f chart-config.yaml
```

## 安装`Nydus`

```bash
$ curl -fsSL -o config-nydus.yaml https://raw.githubusercontent.com/dragonflyoss/Dragonfly2/main/test/testdata/charts/config-nydus.yaml
$ helm install --wait --timeout 10m --dependency-update --create-namespace --namespace nydus-snapshotter nydus-snapshotter dragonfly/nydus-snapshotter -f config-nydus.yaml
```

## 在k8s集群运行`Nydus`镜像

使用 `Nydus` 镜像创建 Nginx pod 配置文件 `nginx-nydus.yaml` `ghcr.io/dragonflyoss/image-service/nginx:nydus-latest`。

```bash
$ cat <<EOF > nginx-nydus.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
    - name: nginx
      image: ghcr.io/dragonflyoss/image-service/nginx:nydus-latest
      imagePullPolicy: Always
      command: ["sh", "-c"]
      args:
        - tail -f /dev/null
EOF
$ kubectl apply -f nginx-nydus.yaml
```

在Nginx容器中执行date命令，

```bash
$ kubectl exec -it nginx -- date
Mon Apr 10 07:57:38 UTC 2023
```

## 验证下载的`Nydus`镜像

基于`mirror`模式通过 `Dragonfly` 验证下载的 `Nydus` 镜像：

```bash
$ DFDAEMON_POD_NAME=`kubectl -n dragonfly-system get pod -l component=dfdaemon --no-headers -o custom-columns=NAME:metadata.name`
$ kubectl -n dragonfly-system exec -it ${DFDAEMON_POD_NAME} -- sh -c 'grep "peer task done" /var/log/dragonfly/daemon/core.log'
Defaulted container "dfdaemon" out of: dfdaemon, wait-for-scheduler (init), update-containerd (init)
{"level":"info","ts":"2024-03-20 03:23:08.169","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 1287ms","peer":"192.168.239.98-2099-b83b5822-4ed6-4b12-88f3-8694e2ca899a","task":"012305ffb5673071848b32a28d42f87491ea2b7d0b216992574006faefb0fdf1","component":"PeerTask","trace":"308ffc0cd7ae3d613ada31c500e6ab86"}
{"level":"info","ts":"2024-03-20 03:23:09.762","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 1543ms","peer":"192.168.239.98-2099-b327b6a8-147b-47d0-b046-1a0088814b2e","task":"ad7fc9f4f56bae44b9139789e80ee0d4cd6ac7d8e0816503dc469205b234785f","component":"PeerTask","trace":"308ffc0cd7ae3d613ada31c500e6ab86"}
{"level":"info","ts":"2024-03-20 03:23:10.325","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 2089ms","peer":"192.168.239.98-2099-a9db50d1-66fb-4b9d-93d8-927f0b855cae","task":"02f70ff31a0e0a6b8bcb075ba30847cb201a02323dd0a8957b021b5f128d7b9a","component":"PeerTask","trace":"308ffc0cd7ae3d613ada31c500e6ab86"}
{"level":"info","ts":"2024-03-20 03:23:10.583","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 2333ms","peer":"192.168.239.98-2099-cc368d93-ceeb-491b-96ab-c2297a4c7102","task":"158a8b78f9f1c8effed6d1263207078b89939ca5fb8837a2a0127ff2099e1bd4","component":"PeerTask","trace":"308ffc0cd7ae3d613ada31c500e6ab86"}
{"level":"info","ts":"2024-03-20 03:23:26.115","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 852ms","peer":"192.168.239.98-2099-a87e3f14-2a12-4ef4-b28e-aa41e6f5fb36","task":"1dafab78656277d526b5aa40af40dd23f0e1f597fbfa4d542d85676fd85abab6","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:26.929","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 729ms","peer":"192.168.239.98-2099-f99fcec3-6214-4ec1-a904-1f2100e5d48c","task":"13eeeef5eb5a17985257cc1baf73794d4900044ddd0b4f5f33bd036aeac07c4b","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:26.997","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 825ms","peer":"192.168.239.98-2099-1d943e96-f65b-4958-8fe8-28faf358df43","task":"6796f10e157f819d9713b90299b34b384faba647f1ad67508a70ea0eb2ac7669","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:27.362","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 1148ms","peer":"192.168.239.98-2099-650a785f-7ef8-42e2-8c12-6103bdda9b40","task":"b469c739272c2e0dd9853639d9d509ed9dfc5cf724bfcd972c8041ad85dbe761","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:27.431","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 1180ms","peer":"192.168.239.98-2099-5a47e323-a9e7-487c-adc5-79305cb10995","task":"5d177f440a409a02e76a72029d191528aa395597ca97cd9fffdfa03f84fa6938","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:27.606","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 1299ms","peer":"192.168.239.98-2099-58d52a17-9039-4be9-8555-7999723f7538","task":"423345a04483e521dddaa2df1cb84a09ae24a494445423a3678de0e3933b8700","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:27.613","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 1333ms","peer":"192.168.239.98-2099-8ae7d902-ac24-4de4-abcd-381180418fe6","task":"650733b2e692b6a431f6ccddf71b6f6cfc8a624a3d8c9a197ec89a7f41d5ac93","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:30.117","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 3850ms","peer":"192.168.239.98-2099-0b86dd5b-348c-46e1-ae0b-b5ebe28bb74a","task":"62ef0030cc779997eaed3764da93da6cfe9bc227b72c427e2f4b3b77a1c6bdf0","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:30.308","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 4078ms","peer":"192.168.239.98-2099-0d9ae8d7-1491-465c-96a3-89ad8df957c2","task":"799f5416adf03a2b5855c2bebabc5826ecec3ed918fff7e03e47ecd607ef1963","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 03:23:31.789","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 5496ms","peer":"192.168.239.98-2099-e41800ff-7e36-4420-ada1-86b05d2041ae","task":"f24f9cd346e1cff5a6aabdd72904e4b00f47f2d6f344e9107ce5686d9c6545ef","component":"PeerTask","trace":"f6de93826f8290ee97fd94275ab93242"}
{"level":"info","ts":"2024-03-20 05:58:39.965","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 1294ms","peer":"192.168.239.98-2099-c1a4ff15-249f-42e7-ba8e-4af9c57fc9dd","task":"c7434a74a28e0ce65d65bf369301ed2360914e36266bbc2b2ee237612111c8b8","component":"PeerTask","trace":"67dce537ce79ae884d35fa348b2589e9"}
{"level":"info","ts":"2024-03-20 05:58:41.338","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 1256ms","peer":"192.168.239.98-2099-da6468a8-d830-407c-ac25-09cd651f7875","task":"97a2132b89cb27dd10373e0222a897884c9502f4f4c10f12d89eb1152c5d929a","component":"PeerTask","trace":"67dce537ce79ae884d35fa348b2589e9"}
{"level":"info","ts":"2024-03-20 05:58:43.664","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 3633ms","peer":"192.168.239.98-2099-a5ad016b-771b-437d-987f-853c3231e5a6","task":"d2ce045eeeb7a9f98f8aef3ed168b760448f09687cd0e5044b10b939b1d96236","component":"PeerTask","trace":"67dce537ce79ae884d35fa348b2589e9"}
{"level":"info","ts":"2024-03-20 05:58:44.855","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 4788ms","peer":"192.168.239.98-2099-bd859c25-dd1c-45e6-8422-9c8b315d9497","task":"8c69e218c5d18aca01065aeca60d18719d3770c7ff525c0ae0e38dc107a5ae68","component":"PeerTask","trace":"67dce537ce79ae884d35fa348b2589e9"}
{"level":"info","ts":"2024-03-20 05:58:53.368","caller":"peer/peertask_conductor.go:1349","msg":"peer task done, cost: 13318ms","peer":"192.168.239.98-2099-9c232e3a-9e7d-48c0-bd0d-1811208c2ebe","task":"5117ae638cde2cbb19fe8e2297b2929d8d4690eb50c190a29231fe54a3c1687a","component":"PeerTask","trace":"67dce537ce79ae884d35fa348b2589e9"}
```