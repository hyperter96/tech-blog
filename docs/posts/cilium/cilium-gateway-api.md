---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubernetes-gateway-api-cilium.jpg
date: 2024-02-22
tag:
  - Cilium
  - 网络
  - cni
  - kubernetes
sticky: 1
prev:
  text: 'Cilium系列三：Cilium集成kubeOVN安装k8s集群'
  link: '/posts/cilium/install-cluster-with-kubeOVN'
---

# Cilium系列四：Cilium集成Gateway API

## 前置条件

- Cilium 必须配置为启用 NodePort，使用 `nodePort.enabled=true` 或使用 `kubeProxyReplacement=true`或者`kubeProxyReplacement=strict` 启用 `kube-proxy` 替换。 有关更多信息，请参阅 `kube-proxy` 替换。
- 必须使用 `--enable-l7-proxy` 标志（默认情况下启用）启用 L7 代理来配置 Cilium。
- 必须预先安装 Gateway API v1.0.0 中的以下 CRD。 请参阅此[文档](https://gateway-api.sigs.k8s.io/guides/?h=crds#getting-started-with-gateway-api)了解安装步骤。 或者，可以使用下面的代码片段。

    ```bash
    $ kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/gateway-api/v1.0.0/config/crd/standard/gateway.networking.k8s.io_gatewayclasses.yaml
    $ kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/gateway-api/v1.0.0/config/crd/standard/gateway.networking.k8s.io_gateways.yaml
    $ kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/gateway-api/v1.0.0/config/crd/standard/gateway.networking.k8s.io_httproutes.yaml
    $ kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/gateway-api/v1.0.0/config/crd/standard/gateway.networking.k8s.io_referencegrants.yaml
    $ kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/gateway-api/v1.0.0/config/crd/experimental/gateway.networking.k8s.io_grpcroutes.yaml
    $ kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/gateway-api/v1.0.0/config/crd/experimental/gateway.networking.k8s.io_tlsroutes.yaml
    ```
- 与 Ingress 类似，网关 API 控制器创建 LoadBalancer 类型的服务，因此您的环境需要支持它。

## 安装Cilium

启用GatewayAPI集成，

```bash
$ helm upgrade cilium cilium/cilium \
    --namespace kube-system \
    --reuse-values \
    --set kubeProxyReplacement=true \
    --set-string extraConfig.enable-envoy-config=true \
    --set gatewayAPI.enabled=true
```

## Demo实战和解析

### HTTP服务暴露

我们以`bookinfo`的应用为Demo,

```bash
$ kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.11/samples/bookinfo/platform/kube/bookinfo.yaml
```

您将在 `basic-http.yaml` 中找到 `Gateway` 和 `HTTPRoute` 定义。

:::details `basic-http.yaml`
```yaml
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
spec:
  gatewayClassName: cilium
  listeners:
  - protocol: HTTP
    port: 80
    name: web-gw
    allowedRoutes:
      namespaces:
        from: Same
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: http-app-1
spec:
  parentRefs:
  - name: my-gateway
    namespace: default
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /details
    backendRefs:
    - name: details
      port: 9080
  - matches:
    - headers:
      - type: Exact
        name: magic
        value: foo
      queryParams:
      - type: Exact
        name: great
        value: example
      path:
        type: PathPrefix
        value: /
      method: GET
    backendRefs:
    - name: productpage
      port: 9080
```
:::

上面的示例创建了一个名为 `my-gateway` 的网关，该网关侦听端口 `80`。定义了两条路由，一条用于 `/details` 到`details`服务，另一条用于 `/` 到`productpage`服务。

现在网关已准备就绪，您可以向服务发出 HTTP 请求。

```bash
$ GATEWAY=$(kubectl get gateway my-gateway -o jsonpath='{.status.addresses[0].value}')
$ curl --fail -s http://"$GATEWAY"/details/1 | jq
{
  "id": 1,
  "author": "William Shakespeare",
  "year": 1595,
  "type": "paperback",
  "pages": 200,
  "publisher": "PublisherA",
  "language": "English",
  "ISBN-10": "1234567890",
  "ISBN-13": "123-1234567890"
}
$ curl -v -H 'magic: foo' http://"$GATEWAY"\?great\=example
...
<!DOCTYPE html>
<html>
  <head>
    <title>Simple Bookstore App</title>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="static/bootstrap/css/bootstrap.min.css">

<!-- Optional theme -->
<link rel="stylesheet" href="static/bootstrap/css/bootstrap-theme.min.css">

  </head>
  <body>


<p>
    <h3>Hello! This is a simple bookstore application consisting of three services as shown below</h3>
</p>

<table class="table table-condensed table-bordered table-hover"><tr><th>name</th><td>http://details:9080</td></tr><tr><th>endpoint</th><td>details</td></tr><tr><th>children</th><td><table class="table table-condensed table-bordered table-hover"><tr><th>name</th><th>endpoint</th><th>children</th></tr><tr><td>http://details:9080</td><td>details</td><td></td></tr><tr><td>http://reviews:9080</td><td>reviews</td><td><table class="table table-condensed table-bordered table-hover"><tr><th>name</th><th>endpoint</th><th>children</th></tr><tr><td>http://ratings:9080</td><td>ratings</td><td></td></tr></table></td></tr></table></td></tr></table>

<p>
    <h4>Click on one of the links below to auto generate a request to the backend as a real user or a tester
    </h4>
</p>
<p><a href="/productpage?u=normal">Normal user</a></p>
<p><a href="/productpage?u=test">Test user</a></p>



<!-- Latest compiled and minified JavaScript -->
<script src="static/jquery.min.js"></script>

<!-- Latest compiled and minified JavaScript -->
<script src="static/bootstrap/js/bootstrap.min.js"></script>

  </body>
</html>

```

### 流量分配

HTTP 流量分割是根据预定义的权重或其他标准将传入流量发送到多个后端服务的过程。 Cilium Gateway API 内置了对流量分割的支持，允许用户轻松地跨多个后端服务分配传入流量。 这对于金丝雀测试或 A/B 场景非常有用。

此示例使用  Gateway API 对不同后端的传入流量进行负载平衡，从相同的权重 `50/50` 开始，然后使用 `99/1` 权重分布进行测试。

我们将使用由 `echo` 服务器组成的部署。应用程序将回复客户端，并在回复正文中包含有关接收原始请求的 Pod 和 Node 的信息。 我们将使用此信息来说明网关如何操纵流量。

```bash
$ kubectl apply -f https://raw.githubusercontent.com/cilium/cilium/HEAD/examples/kubernetes/gateway/echo.yaml
```

部署 Gateway 和 HTTPRoute，请注意，这两项服务之间的比例是 `50/50`。

:::details `splitting.yaml`
```yaml
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: cilium-gw
spec:
  gatewayClassName: cilium
  listeners:
  - protocol: HTTP
    port: 80
    name: web-gw-echo
    allowedRoutes:
      namespaces:
        from: Same
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: example-route-1
spec:
  parentRefs:
  - name: cilium-gw
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /echo
    backendRefs:
    - kind: Service
      name: echo-1
      port: 8080
      weight: 50
    - kind: Service
      name: echo-2
      port: 8090
      weight: 50
```
:::

前面的示例创建了一个名为 `cilium-gw` 的网关，该网关侦听端口 `80`。定义了一条路由，并包含两个不同的 `backendRef`（`echo-1` 和 `echo-2`）以及与它们关联的权重。

```bash
$ kubectl get gateway cilium-gw
NAME        CLASS    ADDRESS          PROGRAMMED   AGE
cilium-gw   cilium   192.168.239.98   True         83s
```

#### 流量分配均匀

现在网关已准备就绪，您可以向服务发出 HTTP 请求。

```bash
$ GATEWAY=$(kubectl get gateway cilium-gw -o jsonpath='{.status.addresses[0].value}')
$ curl --fail -s http://$GATEWAY/echo

Hostname: echo-1-7d88f779b-m6r46

Pod Information:
    node name:      kind-worker2
    pod name:       echo-1-7d88f779b-m6r46
    pod namespace:  default
    pod IP: 10.0.2.15

Server values:
    server_version=nginx: 1.12.2 - lua: 10010

Request Information:
    client_address=10.0.2.252
    method=GET
    real path=/echo
    query=
    request_version=1.1
    request_scheme=http
    request_uri=http://172.18.255.200:8080/echo

Request Headers:
    accept=*/*
    host=172.18.255.200
    user-agent=curl/7.81.0
    x-forwarded-proto=http
    x-request-id=ee152a07-2be2-4539-b74d-ebcebf912907

Request Body:
    -no body in request-
```

重复该命令几次。 您应该看到回复在 Pod 和节点之间均匀平衡。 通过运行循环并计算请求数来验证流量是否均匀分配到多个 Pod：

```bash
while true; do curl -s -k "http://$GATEWAY/echo" >> curlresponses.txt ;done
```

使用 `Ctrl+C` 停止循环。 验证响应是否或多或少均匀分布。

```bash
$ cat curlresponses.txt| grep -c "Hostname: echo-1"
1221
$ cat curlresponses.txt| grep -c "Hostname: echo-2"
1162
```

#### 流量分配不均

通过使用 `kubectl edit httproute` 或在重新应用之前更新原始清单中的值来更新 `HTTPRoute` 权重。 例如，为 `echo-1` 设置 `99`，为 `echo-2` 设置 `1`：

```yaml
backendRefs:
- kind: Service
  name: echo-1
  port: 8080
  weight: 99
- kind: Service
  name: echo-2
  port: 8090
  weight: 1
```

通过运行循环并计算请求数来验证流量是否在多个 Pod 中不均匀分配：

```bash
while true; do curl -s -k "http://$GATEWAY/echo" >> curlresponses991.txt ;done
```

使用 ``Ctrl+C`` 停止循环。 验证响应是否或多或少均匀分布。

```bash
$ cat curlresponses991.txt| grep -c "Hostname: echo-1"
24739
$ cat curlresponses991.txt| grep -c "Hostname: echo-2"
239
```