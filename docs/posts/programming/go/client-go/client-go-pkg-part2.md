---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/client-go-cover.jpeg
author: 熬小剑
date: 2023-01-25
tag:
  - Go
  - Client-go
sticky: 1
prev:
  text: 'Client-go系列六：Client-go类库（上）'
  link: '/posts/programming/go/client-go/client-go-pkg-part1'
---

# Client-go系列七：Client-go类库（下）

## 删除资源

要从集群中删除资源，可以对你要删除的资源使用删除方法。例如，要从 `project1` 命名空间中删除一个名为 `nginx-pod` 的 Pod，可以使用：

```go
err = clientset.
     CoreV1().
     Pods("project1").
     Delete(ctx, "nginx-pod", metav1.DeleteOptions{})
```

:::warning 注意📢：
不保证操作终止时资源被删除。删除操作不会有效地删除资源，但会标记资源被删除（通过设置字段 `.metadata.deletionTimestamp`），并且删除将以异步方式发生。
:::

`DryRun` - 这表明API服务器端的哪些操作应该被执行。唯一可用的值是 `metav1.DryRunAll`，表示要执行所有的操作，除了（将资源持久化到存储的操作）。使用这个选项，你可以得到命令的结果，而不是真的删除资源，并检查在这个删除过程中是否会发生错误。

`GracePeriodSeconds` - 这个值只在删除 pod 时有用。它表示在删除 pod 之前的持续时间，单位是秒。

该值必须是一个指向非负整数的指针。值为零表示立即删除。如果这个值为 `nil`，将使用 pod 的默认宽限期，如 pod spec 中的`TerminationGracePeriodSeconds` 字段所示。

你可以使用 `metav1.NewDeleteOptions` 函数来创建一个定义了 `GracePeriodSeconds的DeleteOptions` 的结构体：

```go
err = clientset.
     CoreV1().
     Pods("project1").
     Delete(ctx,
          "nginx-pod",
          *metav1.NewDeleteOptions(5),
     )
```

`Preconditions`（前提条件） - 当你删除一个对象时，你可能想确保删除预期的对象。前提条件字段让你指出你期望删除的资源，可以通过以下方式：

指明UID，所以如果预期的资源被删除，而另一个资源被创建了相同的名字，那么删除将失败，产生一个冲突错误。你可以使用`metav1.NewPreconditionDeleteOptions` 函数来创建一个 `DeleteOptions` 结构体，并设置 Preconditions 的UID：

```go
uid := createdPod.GetUID()
err = clientset.
     CoreV1().
     Pods("project1").
     Delete(ctx,
          "nginx-pod",
          *metav1.NewPreconditionDeleteOptions(
               string(uid),
          ),
     )
if errors.IsConflict(err) {
   [...]
}
```

指定 `ResourceVersion`，所以如果在此期间资源被更新，删除将失败，并出现 Conflict 错误。你可以使用 `metav1.NewRVDeletionPrecondition` 函数来创建一个 `DeleteOptions` 结构体，并设置前提条件的 `ResourceVersion`：

```go
rv := createdPod.GetResourceVersion()
err = clientset.
     CoreV1().
     Pods("project1").
     Delete(ctx,
          "nginx-pod",
          *metav1.NewRVDeletionPrecondition(
               rv,
          ),
     )
if errors.IsConflict(err) {
   [...]
}
```

`OrphanDependents` - 这个字段已被废弃，转而使用 `PropagationPolicy`。

`PropagationPolicy` - 这表明是否以及如何进行垃圾收集。参见第三章的 “`OwnerReferences`” 部分。可接受的值是：

- `metav1.DeletePropagationOrphan` - 向Kubernetes API表示将你正在删除的资源所拥有的资源变成孤儿，这样它们就不会被垃圾收集器删除。

- `metav1.DeletePropagationBackground` - 指示Kubernetes API在所有者资源被标记为删除后立即返回删除操作，而不是等待拥有的资源被垃圾收集器删除。

- `metav1.DeletePropagationForeground` - 指示 Kubernetes API 在所有者和 `BlockOwnerDeletion` 设置为 `true` 的自有资源被删除后，从 `Delete` 操作中返回。Kubernetes API将不会等待其他拥有的资源被删除。

以下是删除操作特有的可能错误：

- `IsNotFound` - 这个函数表示你在请求中指定的资源或命名空间不存在。
- `IsConflict` - 这个函数表示请求失败，因为一个前提条件没有被遵守（UID或`ResourceVersion`）。

## 删除资源集合

要从集群中删除资源集合，你可以为你要删除的资源使用 `DeleteCollection` 方法。例如，要从 `project1` 命名空间中删除 Pod 的集合：

```go
err = clientset.
     CoreV1().
     Pods("project1").
     DeleteCollection(
          ctx,
          metav1.DeleteOptions{},
          metav1.ListOptions{},
     )
```

必须向该函数提供两组选项：

- `DeleteOptions`，表示对每个对象进行删除操作的选项，如 “删除资源” 部分所述。
- `ListOptions`，细化要删除的资源集合，如 “获取资源列表” 部分所述。

## 更新资源

要更新集群中的资源，你可以为你要更新的资源使用更新方法。例如，使用以下方法来更新 `project1` 命名空间中的 `deployment`：

```go
updatedDep, err := clientset.
     AppsV1().
     Deployments("project1").
     Update(
          ctx,
          myDep,
          metav1.UpdateOptions{},
     )
```

当更新资源时，要声明到 `UpdateOptions` 结构体中的各种选项，与 “创建资源"一节中描述的 `CreateOptions` 中的选项相同。

更新操作可能出现的特定错误是：

- `IsInvalid` - 这个函数表示传递到结构中的数据是无效的。
- `IsConflict`（冲突）–该函数表示纳入结构中的 `ResourceVersion`（这里是 `myDep`）比集群中的版本要早。更多信息请参见第2章的 “更新资源管理冲突” 部分。

## 使用 `Strategic Merge Patch` 来更新资源

在第二章 “使用`Strategic Merge Patch`（战略合并补丁）更新资源 “一节中，你已经看到了用战略合并补丁对资源进行修补的过程。总而言之，你需要：

- 使用 “Patch” 操作：
- 为 `content-type`头指定特定的值
- 在正文中传递你想修改的唯一字段

使用 Client-go 库，你可以对你要修补的资源使用 `Patch` 方法。

```go
Patch(
     ctx context.Context,
     name string,
     pt types.PatchType,
     data []byte,
     opts metav1.PatchOptions,
     subresources ...string,
     ) (result *v1.Deployment, err error)
```

`PatchType` 表明你是想使用 StrategicMerge patch（`types.StrategicMergePatchType`）还是合并补丁（`types.MergePatchType`）。这些常数在`k8s.io/apimachinery/pkg/types`包中定义。

`data` 字段包含你想应用到资源的补丁。你可以直接写这个补丁数据，就像在第二章中做的那样，或者你可以使用 `controller-runtime` 的以下功能来帮助你建立这个补丁。这个库将在第10章中进行更深入的探讨。

```go
import "sigs.k8s.io/controller-runtime/pkg/client"
func StrategicMergeFrom(
     obj Object,
     opts ...MergeFromOption,
) Patch
```

`StrategicMergeFrom` 函数的第一个参数接受一个 `Object` 类型，代表任何 Kubernetes 对象。你将通过这个参数传递你想要修补的对象，在任何改变之前。

然后，该函数接受一系列的选项。目前唯一接受的选项是 `client.MergeFromWithOptimisticLock{}` 值。这个值要求库将 `ResourceVersion` 添加到补丁数据中，因此服务器将能够检查你要更新的资源版本是否是最后一个。

在你使用 `StrategicMergeFrom` 函数创建了 `Patch` 对象后，你可以创建你想打补丁的对象的深度拷贝，然后修改它。然后，当你完成更新对象后，你可以用 `Patch` 对象的专用数据方法建立补丁的数据。

作为例子，要为 Deployment 建立补丁数据，包含乐观锁的资源版本（`ResourceVersion`），你可以使用下面的代码（`createdDep` 是一个反映在集群中创建的Deployment 的结构体）：

```go
patch := client.StrategicMergeFrom(
     createdDep,
     pkgclient.MergeFromWithOptimisticLock{},
)
updatedDep := createdDep.DeepCopy()
updatedDep.Spec.Replicas = pointer.Int32(2)
patchData, err := patch.Data(updatedDep)
// patchData = []byte(`{
//   "metadata":{"resourceVersion":"4807923"},
//   "spec":{"replicas":2}
// }`)
patchedDep, err := clientset.
     AppsV1().Deployments("project1").Patch(
          ctx,
          "dep1",
          patch.Type(),
          patchData,
          metav1.PatchOptions{},
     )
```

注意 `MergeFrom` 和 `MergeFromWithOptions` 函数也是可用的，如果你喜欢执行一个合并补丁。

Patch 对象的 Type 方法可以用来检索补丁类型，而不是使用类型包中的常量。你可以在调用补丁操作时传递 `PatchOptions`。可能的选项有：

- `DryRun` - 这表明API服务器端的哪些操作应该被执行。唯一可用的值是 `metav1.DryRunAll`，表示执行所有操作，除了将资源持久化到存储。
- `Force` - 这个选项只能用于 Apply patch 请求，在处理 `StrategicMergePatch` 或 `MergePatch` 请求时必须取消设置。
- `FieldManager` - 这表示该操作的字段管理器的名称。这个信息将被用于未来的服务器端 Apply 操作。这个选项对于 `StrategicMergePatch` 或 `MergePatch` 请求是可选的。
`FieldValidation` - 这表明当结构体中出现重复或未知字段时，服务器应该如何反应。以下是可能的值：

    - `metav1.FieldValidationIgnore` - 忽略所有重复的或未知的字段
    - `metav1.FieldValidationWarn` - 当出现重复或未知字段时发出警告
    - `metav1.FieldValidationStrict` - 当出现重复字段或未知字段时失败。

注意，Patch 操作接受 `subresources` 参数。这个参数可以用来修补应用补丁方法的资源的子资源。例如，要修补一个 `Deployment` 的 `Status`，你可以使用`subresources` 参数的值 “`status`”。

`MergePatch` 操作特有的可能的错误是：

- `IsInvalid` - 这个函数指示作为补丁传递的数据是否无效。
- `IsConflict` - 这个函数表示并入补丁的资源版本（如果你在构建补丁数据时使用优化锁）是否比集群中的版本更早。更多信息可在第二章 “更新资源管理冲突 “部分找到。

## 用补丁在服务器端应用资源
第二章的 “在服务器端应用资源” 部分描述了服务器端应用补丁是如何工作的。总而言之，我们需要：

- 使用 “补丁 “操作
- 为 `content-type` 头指定一个特定的值
- 在正文中传递你想修改的唯一字段
- 提供一个 `fieldManager` 名称

使用 Client-go 库，你可以对你要修补的资源使用 `Patch` 方法。注意，你也可以使用 `Apply` 方法；见下一节，“使用`Apply`在服务器端应用资源”。

```go
Patch(
     ctx context.Context,
     name string,
     pt types.PatchType,
     data []byte,
     opts metav1.PatchOptions,
     subresources ...string,
) (result *v1.Deployment, err error)
```

`PatchType` 表示补丁的类型，这里是 `type.ApplyPatchType`，定义于 `k8s.io/apimachinery/pkg/types` 包。

`data` 字段包含你想应用到资源的补丁。你可以使用 `client.Apply` 值来构建这个数据。这个值实现了 `client.Patch` 接口，提供了Type和Data方法。

注意，你需要在你想打补丁的资源结构体中设置 `APIVersion` 和 `Kind` 字段。还要注意，这个 `Apply` 操作也可以用来创建资源。

补丁操作接受 `subresources` 参数。这个参数可以用来修补应用`Patch`方法的资源的子资源。例如，要修补 `Deployment` 的 `Status`，你可以使用 `subresources` 参数的值 “`status`”。

```go
import "sigs.k8s.io/controller-runtime/pkg/client"
wantedDep := appsv1.Deployment{
     Spec: appsv1.DeploymentSpec{
          Replicas: pointer.Int32(1),
     [...]
}
wantedDep.SetName("dep1")
wantedDep.APIVersion, wantedDep.Kind =
     appsv1.SchemeGroupVersion.
          WithKind("Deployment").
          ToAPIVersionAndKind()
patch := client.Apply
patchData, err := patch.Data(&wantedDep)
patchedDep, err := clientset.
     AppsV1().Deployments("project1").Patch(
          ctx,
          "dep1",
          patch.Type(),
          patchData,
          metav1.PatchOptions{
          FieldManager: "my-program",
     },
     )
```

你可以在调用 `Patch` 操作时传递 `PatchOptions`。以下是可能的选项：

- `DryRun` - 这表明API服务器端的哪些操作应该被执行。唯一可用的值是 `metav1.DryRunAll`，表示执行所有操作，除了将资源持久化到存储。
- `Force` - 这个选项表示强制应用请求。这意味着这个请求的字段管理器将获得其他字段管理器所拥有的冲突字段。
- `FieldManager` - 这表示该操作的字段管理器的名称。这个信息将被用于未来的服务器端 `Apply` 操作。
- `FieldValidation` - 这表明当结构体中出现重复或未知字段时，服务器应该如何反应。以下是可能的值：
- `metav1.FieldValidationIgnore` - 忽略所有重复的或未知的字段
- `metav1.FieldValidationWarn` - 当出现重复或未知字段时发出警告
- `metav1.FieldValidationStrict` - 当出现重复字段或未知字段时失败。

`ApplyPatch` 操作特有的可能的错误是：

- `IsInvalid` - 这个函数指示作为补丁传递的数据是否无效。
- `IsConflict` - 这个函数表示被补丁修改的一些字段是否有冲突，因为它们被另一个字段管理器拥有。为了解决这个冲突，你可以使用强制选项，这样这些字段就会被这个操作的字段管理器获得。

## 监视资源

第二章的 “监视资源 “部分描述了 Kubernetes API 如何观察资源。使用 Client-go 库，你可以对你想观察的资源使用`Watch`方法。

```go
Watch(
     ctx context.Context,
     opts metav1.ListOptions,
) (watch.Interface, error)
```

这个 `Watch` 方法返回一个实现了 `watch.Interface` 接口的对象，并提供以下方法：

```go
import "k8s.io/apimachinery/pkg/watch"
type Interface interface {
     ResultChan() <-chan Event
     Stop()
}
```

`ResultChan` 方法返回一个 Go通道（只能读取），你将能够接收所有的事件。

`Stop` 方法将停止 `Watch` 操作并关闭使用 `ResultChan` 接收的通道。

使用通道接收的 `watch.Event` 对象的定义如下：

```go
type Event struct {
     Type EventType
     Object runtime.Object
}
```

Type 字段可以得到第2章表2-2中早先描述的值，你可以在 `watch` 包中找到这些不同值的常量：`watch.Added`, `watch.Modified`, `watch.Deleted`, `watch.Bookmark`, 和 `watch.Error`。

`Object` 字段实现了 `runtime.Object` 接口，它的具体类型可以根据 `Type` 的值而不同。

对于除 `Error` 以外的类型，`Object` 的具体类型将是你正在监视的资源的类型（例如，如果你正在监视 `Deployment`，则是 `Deployment` 类型）。

对于 `Error` 类型，具体类型通常是 `metav1.Status`，但它可以是任何其他类型，取决于你正在观察的资源。作为一个例子，这里有一段观察部署的代码：

```go
import "k8s.io/apimachinery/pkg/watch"
watcher, err := clientset.AppsV1().
     Deployments("project1").
     Watch(
          ctx,
          metav1.ListOptions{},
     )
if err != nil {
     return err
}
for ev := range watcher.ResultChan() {
     switch v := ev.Object.(type) {
     case *appsv1.Deployment:
          fmt.Printf("%s %s\n", ev.Type, v.GetName())
     case *metav1.Status:
          fmt.Printf("%s\n", v.Status)
          watcher.Stop()
     }
}
```

在观察资源时，需要在 `ListOptions` 结构体中声明的各种选项如下：

- `LabelSelector, FieldSelector` - 这是用来过滤按标签或按字段观察的元素。这些选项在 “过滤列表结果” 部分有详细说明。
- `Watch, AllowWatchBookmarks` - Watch 选项表示正在运行一个观察操作。这个选项是在执行 `Watch` 方法时自动设置的；你不需要明确地设置它。
- `AllowWatchBookmarks` 选项要求服务器定期返回 `Bookmarks`。书签的使用在第二章的 “允许书签有效地重启观察请求” 一节中有所描述。
- `ResourceVersion, ResourceVersionMatch` - 这表明你想在资源列表的哪个版本上开始观察操作。

    请注意，当收到 `List` 操作的响应时，会为列表元素本身指出一个`ResourceVersion`值，以及列表中每个元素的`ResourceVersion`值。选项中指出的`ResourceVersion`是指列表的`ResourceVersion`。

- `ResourceVersionMatch` 选项不用于观察操作。对于观察操作，请执行以下操作：

    - 当 `ResourceVersion` 没有设置时，API将从最近的资源列表开始观察操作。该通道首先接收 `ADDED` 事件以声明资源的初始状态，然后在集群上发生变化时接收其他事件。
    - 当 `ResourceVersion` 被设置为一个特定的版本时，API将从资源列表的指定版本开始观察操作。该通道将不接收声明资源初始状态的 `ADDED` 事件，而只接收该版本之后集群上发生变化时的事件（可以是指定版本和你运行Watch操作之间发生的事件）。
    - 一个用例是观察一个特定资源的删除情况。为此，你可以

        1. 列出资源，包括你想删除的那个，并保存收到的列表的`ResourceVersion`。
        2. 对资源执行删除操作（删除是异步的，当操作终止时，资源可能不会被删除）。
        3. 通过指定在步骤1中收到的`ResourceVersion`，启动一个`Watch`操作。即使删除发生在步骤2和步骤3之间，你也能保证收到`DELETED`事件。

- 当 `ResourceVersion` 被设置为 “0 “时，API将在任何资源列表中启动`Watch`操作。该通道首先接收`ADDED`事件，以声明资源的初始状态，然后在这个初始状态之后集群上发生变化时接收其他事件。

​在使用这种语义时，你必须特别小心，因为`Watch`操作通常会从最新的版本开始；但是，从较早的版本开始也是可能的。

- TimeoutSeconds - 这将请求的持续时间限制在指定的秒数内。
- Limit, Continue - 这用于对列表操作的结果进行分页。这些选项不支持观察操作。

:::warning 注意📢：
如果你为 `Watch` 操作指定一个不存在的命名空间，你将不会收到 `NotFound` 错误。

还要注意的是，如果你指定了过期的 `ResourceVersion`，你在调用 `Watch` 方法时不会收到错误，但会得到`ERROR`事件，其中包含 `metav1.Status` 对象，表示一个`Reason`的值 `metav1.StatusReasonExpired`。
:::

`metav1.Status` 是一个基础对象，用来构建使用客户集的调用所返回的错误。你将能够在 “错误和状态” 部分了解更多。

## 错误和状态

如第一章所示，Kubernetes API 定义了 `Kinds` 来与调用者交换数据。目前，你应该考虑 `Kinds` 与资源有关，要么 `Kind` 有资源的单数名称（如Pod），要么 Kind 为资源列表（如PodList）。当一个 API 操作既没有返回资源也没有返回资源列表时，它使用一个普通的Kind，`metav1.Status`，来表示操作的状态。

### `metav1.Status`结构体的定义

`metav1.Status` 结构体的定义如下：

```go
type Status struct {
     Status      string
     Message     string
     Reason      StatusReason
     Details     *StatusDetails
     Code        int32
}
```

- `Status` - 这表示操作的状态，是 `metav1.StatusSuccess` 或 `metav1.StatusFailure`。
- `Message` - 这是对操作状态的自由形式的人类可读描述。
- `Code` - 这表示为操作返回的 HTTP 状态代码。
- `Reason`（原因）–这表示操作处于失败状态的原因。原因与给定的HTTP状态代码有关。定义的原因有：
- `StatusReasonBadRequest` (400) - 这个请求本身是无效的。这与 `StatusReasonInvalid` 不同，后者表明 API 调用可能成功，但数据无效。回复`StatusReasonBadRequest` 的请求永远不可能成功，无论数据如何。
- `StatusReasonUnauthorized` (401) - 授权凭证丢失、不完整或无效。
- `StatusReasonForbidden` (403) - 授权证书是有效的，但对资源的操作对这些证书是禁止的。
- `StatusReasonNotFound` (404) - 请求的资源或资源无法找到。
- `StatusReasonMethodNotAllowed` (405) - 在资源中请求的操作是不允许的，因为它没有实现。一个回复`StatusReasonMethodNotAllowed`的请求永远不会成功，不管是什么数据。
- `StatusReasonNotAcceptable` (406) - 客户端在 `Accept` 头中指出的接受类型都不可能。回复 `StatusReasonNotAcceptable` 的请求永远不会成功，无论数据如何。
- `StatusReasonAlreadyExists` (409) - 正在创建的资源已经存在。
- `StatusReasonConflict` (409) - 由于冲突，请求无法完成–例如，由于操作试图用旧的资源版本更新资源，或者由于删除操作中的前提条件没有被遵守。
- `StatusReasonGone` (410) - 项目已不再可用。
- `StatusReasonExpired` (410) - 内容已经过期，不再可用–例如，当用过期的资源版本执行`List`或`Watch`操作时。
- `StatusReasonRequestEntityTooLarge` (413) - 请求实体太大。
- `StatusReasonUnsupportedMediaType` (415) - 此资源不支持 `Content-Type` 标头中的内容类型。回复 `StatusReasonUnsupportedMediaType` 的请求永远不会成功，不管是什么数据。
- `StatusReasonInvalid` (422) - 为创建或更新操作发送的数据是无效的。`Causes`字段列举了数据的无效字段。
- `StatusReasonTooManyRequests` (429) - 客户端应该至少等待 `Details` 字段 `RetryAfterSeconds` 中指定的秒数，才能再次执行操作。
- `StatusReasonUnknown` (500) - 服务器没有指出任何失败的原因。
- `StatusReasonServerTimeout` (500) - 可以到达服务器并理解请求，但不能在合理时间内完成操作。客户端应该在 `Details` 字段 `RetryAfterSeconds` 中指定的秒数后重试该请求。
- `StatusReasonInternalError` (500) - 发生了一个内部错误；它是意料之外的，调用的结果是未知的。
- `StatusReasonServiceUnavailable` (503) - 请求是有效的，但是所请求的服务在这个时候不可用。一段时间后重试该请求可能会成功。
- `StatusReasonTimeout` (504) - 在请求中指定的超时时间内不能完成操作。如果指定了 `Details` 字段的`RetryAfterSeconds`字段，客户端应该在再次执行该操作之前等待这个秒数。

Details – 这些可以包含更多关于原因的细节，取决于 `Reason` 字段。

`Details` 字段的 `StatusDetails` 类型定义如下：

```go
type StatusDetails struct {
     Name string
     Group string
     Kind string
     UID types.UID
     Causes []StatusCause
     RetryAfterSeconds int32
}
```

如果指定的话，`Name`、`Group`、`Kind` 和 UID 字段表明哪个资源受到了故障的影响。

`RetryAfterSeconds` 字段，如果指定的话，表示客户端在再次执行操作之前应该等待多少秒。

`Causes` 字段列举了失败的原因。当执行创建或更新操作导致 `StatusReasonInvalid` 原因的失败时，`Causes` 字段列举了无效的字段和每个字段的错误类型。

`Causes` 字段的 `StatusCause` 类型定义如下：

```go
type StatusCause struct {
     Type       CauseType
     Message    string
     Field      string
}
```

### `CllientSet` 操作返回的错误

本章前面包含了对 `Clientset` 提供的各种操作的描述，这些操作一般会返回一个错误，你可以使用 `errors` 包中的函数来测试错误的原因–例如，用 `IsAlreadyExists` 这个函数。

这些错误的具体类型是 `errors.StatusError`，定义为：

```go
type StatusError struct {
     ErrStatus metav1.Status
}
```

可以看出，这个类型只包括本节前面已经探讨过的 `metav1.Status` 结构体。为这个 `StatusError` 类型提供了函数来访问底层的`Status`。

- `Is<ReasonValue>(err error) bool` - 本节前面列举的每个 `Reason` 值都有一个，表示错误是否属于特定状态。
- `FromObject(obj runtime.Object) error` - 当你在 `Watch` 操作中接收到 `metav1.Status` 时，你可以用这个函数建立一个 `StatusError` 对象。
- `(e *StatusError) Status() metav1.Status` - 返回基础状态。
- `ReasonForError(err error) metav1.StatusReason` - 返回基础状态的原因。
- `HasStatusCause(err error, name metav1.CauseType) bool` - 这表明一个错误是否声明了一个特定的原因，并给出了`CauseType`。
- `StatusCause(err error, name metav1.CseType) (metav1.StatusCause, bool)` - 如果给定的`CauseType`存在，返回该原因，否则返回`false`。
- `SuggestsClientDelay(err error) (int, bool)` - 这表明错误是否在状态的`RetryAfterSeconds`字段中指示了一个值以及该值本身。