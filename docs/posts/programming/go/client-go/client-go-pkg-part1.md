---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/client-go-cover.jpeg
author: 熬小剑
date: 2023-01-21
tag:
  - Go
  - Client-go
sticky: 1
prev:
  text: 'Client-go系列五：API Machinery'
  link: '/posts/programming/go/client-go/api-machinery'
next:
  text: 'Client-go系列七：Client-go类库（下）'
  link: '/posts/programming/go/client-go/client-go-pkg-part2'
---

# Client-go系列六：Client-go类库（上）

本章探讨了 Client-go 库，它是一个高级别库，开发者可以使用 Go 语言与 Kubernetes API 进行交互。Client-go 库汇集了 Kubernetes API 和 API Machinery，提供了一个预先配置了 Kubernetes API 对象的 `Scheme` 和一个用于 Kubernetes API 的 `RESTMapper` 实现。它还提供了一套客户端，用于以简单的方式对Kubernetes API 的资源执行操作。

要使用这个库，你需要从其中导入包，前缀为 `k8s.io/client-go`。例如，要使用包 `kubernetes`，让我们使用以下内容：

```go
import (
    "k8s.io/client-go/kubernetes"
)
```

你还需要下载一个 `client-go` 库的版本。为此，你可以使用 `go get` 命令来获得你要使用的版本：

```bash
go get k8s.io/client-go@v0.24.4
```

Client-go 库的版本与 Kubernetes 的版本是一致的–`0.24.4`版本对应服务器的`1.24.4`版本。

Kubernetes 是向后兼容的，所以你可以在较新版本的集群中使用旧版本的Client-go，但你很可能希望得到一个最新的版本，以便能够使用当前的功能，因为只有bug修复被回传到以前的 Client-go 版本，而不是新功能。

## 连接到集群

连接到 Kubernetes API 服务器之前的第一步是让配置连接到它–即服务器的地址、证书、连接参数等。

`rest` 包提供了一个 `rest.Config` 结构体，它包含了一个应用程序连接到 REST API 服务器所需的所有配置信息。

### 集群内配置

默认情况下，在 Kubernetes Pod 上运行的容器包含连接到API服务器所需的所有信息：

Pod 使用的 `ServiceAccount` 提供的令牌和根证书可以在这个目录中找到：
```bash
/var/run/secrets/kubernetes.io/serviceaccount/
```

请注意，可以通过在 Pod 使用的 `ServiceAccount` 中设置 `automountServiceAccountToken: false`，或直接在 Pod 的 `Spec` 中设置`automountServiceAccountToken: false` 来禁用这种行为。

环境变量，`KUBERNETES_SERVICE_HOST` 和 `KUBERNETES_SERVICE_PORT`，定义在容器环境中，由 `kubelet` 添加，定义了联系API server 的主机和端口。

当一个应用程序专门在 Pod 的容器内运行时，你可以使用以下函数来创建一个适当的 `rest.Config` 结构体，利用刚才描述的信息：
```go
import "k8s.io/client-go/rest"
func InClusterConfig() (*Config, error)
```

### 集群外的配置
Kubernetes 工具通常依赖于 `kubeconfig` 文件–即一个包含一个或几个 Kubernetes 集群的连接配置的文件。

你可以通过使用 `clientcmd` 包中的以下函数之一，根据这个 `kubeconfig` 文件的内容建立一个 `rest.Config` 结构体。

#### 从内存中的`kubeconfig`
`RESTConfigFromKubeConfig` 函数可以用来从作为一个字节数组的 `kubeconfig` 文件的内容中建立一个 `rest.Config` 结构体：

```go
func RESTConfigFromKubeConfig(
     configBytes []byte,
) (*rest.Config, error)
```

如果 `kubeconfig` 文件包含几个上下文（`context`），将使用当前的上下文，而其他的上下文将被忽略。例如，你可以先读取一个 `kubeconfig` 文件的内容，然后使用以下函数：

```go
import "k8s.io/client-go/tools/clientcmd"
configBytes, err := os.ReadFile(
     "/home/user/.kube/config",
)
if err != nil {
     return err
}
config, err := clientcmd.RESTConfigFromKubeConfig(
     configBytes,
)
if err != nil {
     return err
}
```

#### 从磁盘上的kubeconfig
`BuildConfigFromFlags` 函数可用于从 API server 的URL中建立 `rest.Config` 结构体，或基于给定路径的 `kubeconfig` 文件，或两者都是。

```go
func BuildConfigFromFlags(
     masterUrl,
     kubeconfigPath string,
) (*rest.Config, error)
```

下面的代码可以让你得到一个 `rest.Config` 结构体：

```go
import "k8s.io/client-go/tools/clientcmd"
config, err := clientcmd.BuildConfigFromFlags(
     "",
     "/home/user/.kube/config",
)
```
下面的代码从 `kubeconfig` 获取配置，并重写了 api server 的 URL：

```go
config, err := clientcmd.BuildConfigFromFlags(
     "https://192.168.1.10:6443",
     "/home/user/.kube/config",
)
```

#### 来自个性化的kubeconfig
前面的函数在内部使用一个 `api.Config` 结构体，代表 `kubeconfig` 文件中的数据（不要与包含 REST HTTP 连接参数的 `rest.Config` 结构体混淆）。

如果你需要操作这个中间数据，你可以使用 `BuildConfigFromKubeconfigGetter` 函数，接受一个 `kubeconfigGetter` 函数作为参数，它本身将返回一个 `api.Config` 结构体。

```go
BuildConfigFromKubeconfigGetter(
     masterUrl string,
     kubeconfigGetter KubeconfigGetter,
) (*rest.Config, error)
type KubeconfigGetter
     func() (*api.Config, error)
```

例如，以下代码将用 `clientcmd.Load` 或 `clientcmd.LoadFromFile` 函数从 `kubeconfigGetter` 函数加载 `kubeconfig` 文件：

```go
import (
     "k8s.io/client-go/tools/clientcmd"
     "k8s.io/client-go/tools/clientcmd/api"
)
config, err :=
clientcmd.BuildConfigFromKubeconfigGetter(
     "",
     func() (*api.Config, error) {
          apiConfig, err := clientcmd.LoadFromFile(
               "/home/user/.kube/config",
          )
          if err != nil {
               return nil, nil
          }
          // TODO: manipulate apiConfig
          return apiConfig, nil
     },
)
```

#### 来自多个`kubeconfig`文件

`kubectl` 工具默认使用 `$HOME/.kube/config kubeconfig`文件，你可以使用 `KUBECONFIG` 环境变量指定另一个 `kubeconfig` 文件路径。

不仅如此，你还可以在这个环境变量中指定一个 `kubeconfig` 文件路径的列表，这些 `kubeconfig` 文件在被使用之前将被合并成一个而已。你可以用这个函数获得同样的行为： `NewNonInteractiveDeferredLoadingClientConfig`。

```go
func NewNonInteractiveDeferredLoadingClientConfig(
     loader ClientConfigLoader,
     overrides *ConfigOverrides,
) ClientConfig
```

`clientcmd.ClientConfigLoadingRules` 类型实现了 `ClientConfigLoader` 接口，你可以用下面的函数得到这个类型的值：

```go
func NewDefaultClientConfigLoadingRules()
 *ClientConfigLoadingRules
```

这个函数将获得 `KUBECONFIG` 环境变量的值，如果它存在的话，以获得要合并的 `kubeconfig` 文件的列表，或者将退回到使用位于 `$HOME/.kube/config` 的默认`kubeconfig`文件。

使用下面的代码来创建 `rest.Config` 结构体，你的程序将具有与 `kubectl` 相同的行为，如前所述：

```go
import (
     "k8s.io/client-go/tools/clientcmd"
)
config, err :=
clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
     clientcmd.NewDefaultClientConfigLoadingRules(),
     nil,
).ClientConfig()
```

#### 用CLI标志重写`kubeconfig`

已经表明，这个函数的第二个参数，`NewNonInteractiveDeferredLoadingClientConfig`，是一个 `ConfigOverrides` 结构。这个结构包含覆盖合并 `kubeconfig` 文件结果的一些字段的值。

你可以自己在这个结构体中设置特定的值，或者，如果你正在使用 `spf13/pflag` 库（即 `github.com/spf13/pflag`）创建一个CLI，你可以使用下面的代码为你的CLI自动声明默认标志，并将它们绑定到 `ConfigOverrides` 结构体：

```go
import (
     "github.com/spf13/pflag"
     "k8s.io/client-go/tools/clientcmd"
)
var (
     flags pflag.FlagSet
     overrides clientcmd.ConfigOverrides
     of = clientcmd.RecommendedConfigOverrideFlags("")
)
clientcmd.BindOverrideFlags(&overrides, &flags, of)
flags.Parse(os.Args[1:])
config, err :=
clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
     clientcmd.NewDefaultClientConfigLoadingRules(),
     &overrides,
).ClientConfig()
```

注意，你可以在调用函数 `RecommendedConfigOverrideFlags` 时为添加的标志声明一个前缀。

## 获取 `ClientSet`

Kubernetes 包提供了创建 `kubernetes.Clientset` 类型的 `ClientSet` 的函数。

- `func NewForConfig(c *rest.Config) (*Clientset, error)` - `NewForConfig` 函数返回 `ClientSet`，使用提供的 `rest.Config` 与上一节中看到的方法之一构建。
- `func NewForConfigOrDie(c *rest.Config) *Clientset` - 这个函数和前一个函数一样，但是在出错的情况下会 `panic` ，而不是返回错误。这个函数可以与硬编码的配置一起使用，你会想要断言其有效性。
- `NewForConfigAndClient( c *rest.Config、 httpClient *http.Client ) (*Clientset, error)`

     这个 `NewForConfigAndClient` 函数使用提供的 `rest.Config` 和提供的 `http.Client` 返回一个 `Clientset`。

之前的函数 `NewForConfig` 使用的是用函数 `rest.HTTPClientFor` 构建的默认 HTTP 客户端。如果你想在构建客户集之前个性化HTTP客户端，你可以使用这个函数来代替。

### 使用 `ClientSet`

`kubernetes.Clientset` 类型实现了 `kubernetes.Interface` 接口，定义如下：

```go
type Interface interface {
     Discovery() discovery.DiscoveryInterface
     [...]
     AppsV1()          appsv1.AppsV1Interface
     AppsV1beta1()     appsv1beta1.AppsV1beta1Interface
     AppsV1beta2()     appsv1beta2.AppsV1beta2Interface
     [...]
     CoreV1()           corev1.CoreV1Interface
     [...]
}
```

第一个方法 `Discovery()` 提供了对一个接口的访问，该接口提供了发现集群中可用的分组、版本和资源的方法，以及资源的首选版本。这个接口还提供对服务器版本和 OpenAPI v2 和v3定义的访问。这将在发现客户端部分详细研究。

除了 `Discovery()` 方法外，`kubernetes.Interface` 由一系列方法组成，Kubernetes API 定义的每个 `Group/Version` 都有一个。当你看到这个接口的定义时，就可以理解 `ClientSet` 是一组客户端，每个客户端都专门用于自己的分组/版本。

每个方法都会返回一个值，该值实现了该分组/版本的特定接口。例如，`kubernetes.Interface`的`CoreV1()` 方法返回一个值，实现 `corev1.CoreV1Interface` 接口，定义如下：

```go
type CoreV1Interface interface {
     RESTClient() rest.Interface
     ComponentStatusesGetter
     ConfigMapsGetter
     EndpointsGetter
     [...]
}
```

这个 `CoreV1Interface` 接口的第一个方法是 `RESTClient() rest.Interface`，它是一个用来获取特定 `Group/Version` 的 REST 客户端的方法。这个低级客户端将被 `Group/Version` 客户端内部使用，你可以使用这个 REST 客户端来构建这个 `CoreV1Interface` 接口的其他方法所不能原生提供的请求。

由 REST 客户端实现的接口 `rest.Interface` 定义如下：

```go
type Interface interface {
     GetRateLimiter()            flowcontrol.RateLimiter
     Verb(verb string)           *Request
     Post()                      *Request
     Put()                       *Request
     Patch(pt types.PatchType)   *Request
     Get()                       *Request
     Delete()                    *Request
     APIVersion()                schema.GroupVersion
}
```

正如你所看到的，这个接口提供了一系列的方法–`Verb`、`Post`、`Put`、`Patch`、`Get` 和 `Delete`–它们返回一个带有特定 `HTTP Verb` 的 Request 对象。在 “如何使用这些Request对象来完成操作 “一节中，将进一步研究这个问题。

`CoreV1Interface` 中的其他方法被用来获取分组/版本中每个资源的特定方法。例如，`ConfigMapsGetter` 嵌入式接口的定义如下：

```go
type ConfigMapsGetter interface {
     ConfigMaps(namespace string) ConfigMapInterface
}
```

然后，接口 `ConfigMapInterface`由方法 `ConfigMaps` 返回，定义如下：

```go
type ConfigMapInterface interface {
     Create(
          ctx context.Context,
          configMap *v1.ConfigMap,
          opts metav1.CreateOptions,
     ) (*v1.ConfigMap, error)
     Update(
          ctx context.Context,
          configMap *v1.ConfigMap,
          opts metav1.UpdateOptions,
     ) (*v1.ConfigMap, error)
     Delete(
          ctx context.Context,
          name string,
          opts metav1.DeleteOptions,
     ) error
     [...]
}
```

你可以看到，这个接口提供了一系列的方法，每个 Kubernetes API 动词都有一个。

每个与操作相关的方法都需要一个 `Option` 结构体作为参数，以操作的名称命名： `CreateOptions`, `UpdateOptions`, `DeleteOptions` 等等。这些结构体和相关的常量都定义在这个包中：`k8s.io/apimachinery/pkg/apis/meta/v1`。

最后，要对一个 `Group-Version` 的资源进行操作，你可以按照这个模式对 `namespaced` 资源进行连锁调用，其中 `namespace` 可以是空字符串，以表示一个集群范围的操作：

```go
clientset.
     GroupVersion().
     NamespacedResource(namespace).
     Operation(ctx, options)
```
那么，以下是不带命名空间的资源的模式：

```go
clientset.
    GroupVersion().
     NonNamespacedResource().
     Operation(ctx, options)
```

例如，使用下面的方法来列出命名空间 `project1` 中 `core/v1` 分组/版本的 Pods：

```go
podList, err := clientset.
     CoreV1().
     Pods("project1").
     List(ctx, metav1.ListOptions{})
```
要获得所有命名空间的 pod 列表，你需要指定一个空的命名空间名称：

```go
podList, err := clientset.
     CoreV1().
     Pods("").
     List(ctx, metav1.ListOptions{})
```
要获得节点的列表（这些节点是没有命名的资源），请使用这个：

```go
nodesList, err := clientset.
     CoreV1().
     Nodes().
     List(ctx, metav1.ListOptions{})
```

下面的章节详细描述了使用 Pod 资源的各种操作。在处理非命名空间的资源时，你可以通过删除命名空间参数来应用同样的例子。

## 检查请求
如果你想知道在调用 client-go 方法时，哪些 HTTP 请求被执行，你可以为你的程序启用日志记录。Client-go库使用[klog库](https://github.com/kubernetes/klog)，你可以用以下代码为你的命令启用日志标志：

```go
import (
     "flag"
     "k8s.io/klog/v2"
)
func main() {
     klog.InitFlags(nil)
     flag.Parse()
     [...]
}
```
现在，你可以用标志 `-v <level>` 来运行你的程序–例如，`-v 6` 来获得每个请求的URL调用。你可以在表2-1中找到更多关于定义的日志级别的细节。

## 创建资源

要在集群中创建一个新的资源，你首先需要使用专用的 `Kind` 结构体在内存中声明这个资源，然后为你要创建的资源使用创建方法。例如，使用下面的方法，在 `project1` 命名空间中创建一个名为 `nginx-pod` 的 Pod：
```go
wantedPod := corev1.Pod{
     Spec: corev1.PodSpec{
          Containers: []corev1.Container{
               {
                    Name:  "nginx",
                    Image: "nginx",
               },
          },
     },
}
wantedPod.SetName("nginx-pod")
createdPod, err := clientset.
     CoreV1().
     Pods("project1").
     Create(ctx, &wantedPod, v1.CreateOptions{})
```

在创建资源时，用于声明 `CreateOptions` 结构体的各种选项是：

- `DryRun` - 这表明API服务器端的哪些操作应该被执行。唯一可用的值是 `metav1.DryRunAll`，表示执行所有的操作，除了将资源持久化到存储。

使用这个选项，你可以得到命令的结果，即在集群中创建的确切对象，而不是真正的创建，并检查在这个创建过程中是否会发生错误。

- `FieldManager` - 这表示这个操作的字段管理器的名称。这个信息将被用于未来的服务器端应用操作。
- `FieldValidation` - 这表明当结构中出现重复或未知字段时，服务器应该如何反应。以下是可能的值：

     - `metav1.FieldValidationIgnore` 忽略所有重复的或未知的字段
     - `metav1.FieldValidationWarn` 当出现重复或未知字段时发出警告。
     - `metav1.FieldValidationStrict` 当重复字段或未知字段出现时失败。

​ 请注意，使用这个方法，你将无法定义重复或未知的字段，因为你是使用结构体来定义对象。

如果出现错误，你可以用 `k8s.io/apimachinery/pkg/api/errors` 包中定义的函数测试其类型。所有可能的错误都在 “错误和状态 “一节中定义，这里是针对 `Create` 操作的可能错误：

- `IsAlreadyExists` - 这个函数指示请求是否因为集群中已经存在同名的资源而失败：

     ```go
     if errors.IsAlreadyExists(err) {
          // ...
     }
     ```
- `IsNotFound` - 这个函数表示你在请求中指定的命名空间是否不存在。
- `IsInvalid` - 这个函数表示传入结构体的数据是否无效。

## 获取资源的信息

要获得集群中某一特定资源的信息，可以使用 `Get` 方法，从该资源中获取信息。例如，要获得 `project1` 命名空间中名为 `nginx-pod` 的 pod 的信息：

```go
pod, err := clientset.
     CoreV1().
     Pods("project1").
     Get(ctx, "nginx-pod", metav1.GetOptions{})
```

在获取资源的信息时，声明到 `GetOptions` 结构体中的各种选项是：

- `ResourceVersion` - 请求一个不早于指定版本的资源版本。
- 如果 `ResourceVersion` 是 “0”，表示返回该资源的任何版本。你通常会收到资源的最新版本，但这并不保证；由于分区或陈旧的缓存，在高可用性集群上可能会收到较旧的版本。
- 如果没有设置该选项，你将保证收到资源的最新版本。

获取操作特有的可能错误是：

- `IsNotFound` - 这个函数表示你在请求中指定的命名空间不存在，或者指定名称的资源不存在。

## 获取资源列表

要获得集群中的资源列表，你可以为你想要列出的资源使用 `List` 方法。例如，使用下面的方法来列出 `project1` 命名空间中的 pods：
```go
podList, err := clientset.
     CoreV1().
     Pods("project1").
     List(ctx, metav1.ListOptions{})
```

或者，要获得所有命名空间中的 pod 列表，使用：

```go
podList, err := clientset.
     CoreV1().
     Pods("").
     List(ctx, metav1.ListOptions{})
```
在列出资源时，需要向 `ListOptions` 结构体声明的各种选项如下：

- `LabelSelector, FieldSelector` - 这是用来按标签或按字段过滤列表的。这些选项在 “过滤列表结果 “部分有详细介绍。
- `Watch, AllowWatchBookmarks` - 这是用来运行 `watch` 操作。这些选项在 “观察资源 “部分有详细介绍。
- `ResourceVersion, ResourceVersionMatch` - 这表明你想获得哪个版本的资源列表。
     
     请注意，当收到 `List` 操作的响应时，`List`元素本身的 `ResourceVersion` 值，以及`List`中每个元素的 `ResourceVersion` 值都会被指出。选项中指出的资源版本指的是 `List` 的资源版本。

- 对于没有分页的列表操作（你可以参考 “分页结果 “和 “观察资源” 部分，了解这些选项在其他情况下的行为）：

     - 当 `ResourceVersionMatch` 没有被设置时，其行为与`Get`操作相同：
     - `ResourceVersion` 表示你应该返回一个不比指定版本早的列表。
     - 如果 `ResourceVersion`是 “0”，这表明有必要返回列表的任何版本。一般来说，你会收到它的最新版本，但这并不保证；在高可用性的集群上，由于分区或陈旧的缓存，收到旧版本的情况可能发生。
     - 如果不设置该选项，你就能保证收到列表的最新版本。
     - 当 `ResourceVersionMatch` 被设置为 `metav1.ResourceVersionMatchExact` 时，`ResourceVersion` 值表示你想获得的列表的确切版本。
     - 将 `ResourceVersion` 设置为 “0”，或者不定义它，是无效的。
     - 当`ResourceVersionMatch`设置为 `metav1.ResourceVersionMatchNotOlderThan` 时，`ResourceVersion` 表示你将获得一个不比指定版本老的列表。
     - 如果`ResourceVersion`是 “0”，这表示将返回列表的任何版本。你通常会收到列表的最新版本，但这并不保证；在高可用性集群中，由于分区或陈旧的缓存，收到旧版本的情况可能发生。
     - 不定义`ResourceVersion`是无效的。

- `TimeoutSeconds` - 这将请求的持续时间限制在指定的秒数内。
- `Limit, Continue` - 这用于对列表的结果进行分页。这些选项在第二章的 “分页结果 “部分有详细说明。

以下是 `List` 操作特有的可能错误：

- `IsResourceExpired` - 这个函数表示指定的 `ResourceVersion` 与 `ResourceVersionMatch`，设置为 `metav1.ResourceVersionMatchExact`，已经过期。

:::warning 注意📢：
如果你为 `List` 操作指定一个不存在的命名空间，你将不会收到 `NotFound` 错误。
:::

## 筛选列表的结果

正如第2章 “过滤列表结果"一节所述，可以用标签选择器和字段选择器来过滤列表操作的结果。本节展示了如何使用API Machinery 库的字段和标签包来创建一个适用于 `LabelSelector` 和 `FieldSelector` 选项的字符串。

### 使用标签包设置LabelSelector
下面是使用API Machinery 库的 `labels` 包的必要导入信息。

```go
import (
     "k8s.io/apimachinery/pkg/labels"
)
```

该包提供了几种建立和验证 `LabelsSelector` 字符串的方法：使用 `Requirements`，解析 `labelSelector` 字符串，或使用一组键值对。

#### 使用 Requirements

你首先需要使用下面的代码创建一个 `label.Selector` 对象：

```go
labelsSelector := labels.NewSelector()
```

然后，你可以使用 `labs.NewRequirement` 函数创建 `Requirement` 对象：

```go
func NewRequirement(
     key string,
     op selection.Operator,
     vals []string,
     opts ...field.PathOption,
) (*Requirement, error)
```

- `op` 的可能值的常量在 `selection` 包中定义（即 `k8s.io/apimachinery/pkg/selection`）。vals 字符串数组中的值的数量取决于操作：
- `selection.In; selection.NotIn` - 附加到 key 的值必须等于(In)/必须不等于(NotIn)vals定义的值中的一个。

     `vals`必须不是空的。

- `selection.Equals; selection.DoubleEquals; selection.NotEquals` - 附加到key的值必须等于（Equals, DoubleEquals）或者不等于（NotEquals）vals中定义的值。

     `vals`必须包含一个单一的值。

- `selection.Exists; selection.DoesNotExist` - 键必须被定义（Exists）或必须不被定义（DoesNotExist）。

     `vals`必须是空的。

- `selection.Gt; selection.Lt` - 附加在键上的值必须大于（Gt）或小于（Lt）vals中定义的值。

     `vals`必须包含一个单一的值，代表一个整数。

例如，为了要求键 `mykey` 的值等于 `value1`，你可以声明 `Requirement`：

```go
req1, err := labels.NewRequirement(
     "mykey",
     selection.Equals,
     []string{"value1"},
)
```
在定义 `Requirement` 后，你可以使用选择器上的 `Add` 方法将需求添加到选择器中：

```go
labelsSelector = labelsSelector.Add(*req1, *req2)
```

最后，你可以用以下方法获得 `LabelSelector` 选项所要传递的字符串：

```go
s := labelsSelector.String()
```

#### 解析 `LabelSelector` 字符串

如果你已经有一个描述标签选择器的字符串，你可以用 `Parse` 函数检查其有效性。`Parse` 函数将验证该字符串并返回一个 `LabelSelector` 对象。您可以在这个 `LabelSelector` 对象上使用 `String` 方法来获得由 `Parse` 函数验证的字符串。

作为一个例子，下面的代码将解析、验证并返回标签选择器的典型形式，“`mykey = value1, count < 5`”：
```go
selector, err := labels.Parse(
     "mykey = value1, count < 5",
)
if err != nil {
     return err
}
s := selector.String()
// s = "mykey=value1,count<5"
```

#### 使用键值对的集合
当你只想使用等价(Equal)操作时，可以使用 `ValidatedSelectorFromSet` 这个函数，以满足一个或几个要求：

```go
func ValidatedSelectorFromSet(
     ls Set
) (Selector, error)
```
在这种情况下，`Set` 将定义你想检查的键值对的集合，以确保等价(Equal)。

作为一个例子，下面的代码将声明一个标签选择器，要求键 `key1`，等于`value1`，键 `key2`，等于`value2`：

```go
set := labels.Set{
     "key1": "value1",
     "key2": "value2",
}
selector, err = labels.ValidatedSelectorFromSet(set)
s = selector.String()
// s = "key1=value1,key2=value2"
```

### 使用 `Fields` 包设置 `Fieldselector`

下面是用于从 API Machinery 中导入 `Fields` 包的必要代码。

```go
import (
     "k8s.io/apimachinery/pkg/fields"
)
```

该包提供了几种建立和验证 `FieldSelector` 字符串的方法：组装术语选择器(term selector)，解析 `fieldSelector` 字符串，或使用一组键值对。

#### 组装术语选择器

你可以用函数 `OneTermEqualSelector` 和 `OneTermNotEqualSelector` 创建一个术语选择器，然后用函数 `AndSelectors` 组装选择器来建立一个完整的字段选择器。

```go
func OneTermEqualSelector(
     k, v string,
) Selector
func OneTermNotEqualSelector(
     k, v string,
) Selector
func AndSelectors(
     selectors ...Selector,
) Selector
```

例如，这段代码建立了一个字段选择器，在字段 `status.Phase`上有一个 Equal 条件，在字段 `spec.restartPolicy` 上有一个 NotEqual 条件：

```go
fselector = fields.AndSelectors(
     fields.OneTermEqualSelector(
          "status.Phase",
          "Running",
     ),
     fields.OneTermNotEqualSelector(
          "spec.restartPolicy",
          "Always",
     ),
)
fs = fselector.String()
```

#### 解析字段选择器字符串

如果你已经有一个描述字段选择器的字符串，你可以用 `ParseSelector` 或 `ParseSelectorOrDie` 函数检查其有效性。`ParseSelector` 函数将验证该字符串并返回一个 `fields.Selector` 对象。你可以在这个 `fields.Selector` 对象上使用 `String` 方法来获得由 `ParseSelector` 函数验证的字符串。

作为一个例子，这段代码将解析、验证并返回字段选择器的典型形式 “`status.Phase = Running, spec.restartPolicy != Always`”：

```go
selector, err := fields.ParseSelector(
     "status.Phase=Running, spec.restartPolicy!=Always",
)
if err != nil {
     return err
}
s := selector.String()
// s = "spec.restartPolicy!=Always,status.Phase=Running"
```

#### 使用键值对的集合

当你想对一个或几个单一的选择器只使用等价操作时，可以使用`SelectorFromSet`这个函数。

```go
func SelectorFromSet(ls Set) Selector
```

在这种情况下，`Set`将定义你要检查的键值对的集合，以确保平等。

作为一个例子，下面的代码将声明一个字段选择器，要求键 `key1` 等于 `value1`，键 `key2`，等于`value2`：

```go
set := fields.Set{
     "field1": "value1",
     "field2": "value2",
}
selector = fields.SelectorFromSet(set)
s = selector.String()
// s = "key1=value1,key2=value2"
```