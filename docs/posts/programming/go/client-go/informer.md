---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/client-go-cover.jpeg
date: 2022-12-25
tag:
  - Go
  - Client-go
sticky: 1
prev:
  text: 'Client-go系列二: 认识ClientSet'
  link: '/posts/programming/go/client-go/clientset'
next:
  text: 'Client-go系列四：Informer实战'
  link: '/posts/programming/go/client-go/informer-exercise'
---

# Client-go系列三：认识Informer

Informer 对于实现 kubernetes 的 `controller` 模式非常重要.

## Informer 简介

> 前面我们在使用 `ClientSet` 的时候了解到我们可以使用 `ClientSet` 来获取所有的原生资源对象，那么如果我们想要去一直获取集群的资源对象数据呢？岂不是需要用一个轮询去不断执行 `List()` 操作？
>
> 这显然是不合理的，实际上除了常用的 CRUD 操作之外，我们还需要进行 `Watch` 操作，监听资源对象的增、删、改、查操作，这样我们就可以根据自己的业务逻辑去处理这些数据了。

作为客户端，Client-go 实现了一套对应的 `list-watch` 进行用来处理对象的变化。这个机制在 Client-go 就是 `Informer` 机制。

`Informer` 机制运行原理如图：

![](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/client-go-image.png)

:::warning 注意📢：
Informer 的大体流程如下：

1. `new` 一个 `informer`，创建 `informer` 第一个参数是一个 `ListWatch` 的接口类型（这个就是获取 apiserver 数据）。
2. `informer.Run` 的时候，会 `new` 一个 `Reflector` 对象。`Reflector` 包含了 `ListWatch` ，接下来基本就是 `Reflector` 进行操作了。
3. `Reflector` 对 `ListWatch` 来的数据进行处理，这里使用到了 `DeltaFIFO` 队列对 `watch` 来的数据一个个的处理，`HandleDeltas` 函数。
4. 具体的处理逻辑分为两部分:
    - 通过操作 `cache.indexer` ，更新本地缓存 + 索引; 
    - 将 `watch` 的数据发送给 `Informer` 自定义的处理函数进行处理。
:::

要创建一个 `Informe`r 很简单：

```go
store, controller := cache.NewInformer {
	&cache.ListWatch{},
	&v1.Pod{},
	resyncPeriod, // how often the controller goes through all items remaining in the cache and fires the UpdateFunc again
	cache.ResourceEventHandlerFuncs{},
}
```

实际上，`Informer` 很少被使用，用的比较多的是 `SharedInformer`。

> 我们平时说的 `Informer` 其实就是 `SharedInformer`，它是可以共享使用的。如果同一个资源的 `Informer` 被实例化多次，那么就会运行多个 `ListAndWatch` 操作，这会加大 APIServer 的压力。而 `SharedInformer` 通过一个 `map` 来让同一类资源的 `Informer` 实现共享一个 `Refelctor`，这样就不会出现上面这个问题了。

## Informer 编码

> 直接阅读 Informer 机制代码会比较晦涩，通过 Informers Example 代码示例来理解 `Informer` ，印象会更深刻。Informers Example 代码示例如下：

```go
package main

import (
	"flag"
	"fmt"
	"path/filepath"
	"time"

	v1 "k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

func main() {
	var err error
	var config *rest.Config

	var kubeconfig *string

	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "[可选] kubeconfig 绝对路径")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "kubeconfig 绝对路径")
	}
	// 初始化 rest.Config 对象
	if config, err = rest.InClusterConfig(); err != nil {
		if config, err = clientcmd.BuildConfigFromFlags("", *kubeconfig); err != nil {
			panic(err.Error())
		}
	}
	// 创建 Clientset 对象
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	// 初始化 informer factory（为了测试方便这里设置每30s重新 List 一次）
	informerFactory := informers.NewSharedInformerFactory(clientset, time.Second*30)
	// 对 Deployment 监听
	deployInformer := informerFactory.Apps().V1().Deployments()
	// 创建 Informer（相当于注册到工厂中去，这样下面启动的时候就会去 List & Watch 对应的资源）
	informer := deployInformer.Informer()
	// 创建 Lister
	deployLister := deployInformer.Lister()
	// 注册事件处理程序
	informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    onAdd,
		UpdateFunc: onUpdate,
		DeleteFunc: onDelete,
	})

	stopper := make(chan struct{})
	defer close(stopper)

	// 启动 informer，List & Watch
	informerFactory.Start(stopper)
	// 等待所有启动的 Informer 的缓存被同步
	informerFactory.WaitForCacheSync(stopper)

	// 从本地缓存中获取 default 中的所有 deployment 列表
	deployments, err := deployLister.Deployments("default").List(labels.Everything())
	if err != nil {
		panic(err)
	}
	for idx, deploy := range deployments {
		fmt.Printf("%d -> %s\n", idx+1, deploy.Name)
	}
	<-stopper
}

func onAdd(obj interface{}) {
	deploy := obj.(*v1.Deployment)
	fmt.Println("add a deployment:", deploy.Name)
}

func onUpdate(old, new interface{}) {
	oldDeploy := old.(*v1.Deployment)
	newDeploy := new.(*v1.Deployment)
	fmt.Println("update deployment:", oldDeploy.Name, newDeploy.Name)
}

func onDelete(obj interface{}) {
	deploy := obj.(*v1.Deployment)
	fmt.Println("delete a deployment:", deploy.Name)
}
```

:::info 信息
1. 首先通过 `kubernetes.NewForConfig` 创建 `ClientSet` 对象。
2. `Informer` 需要通过 `ClientSet` 与 Kubernetes API Server 进行交互。
3. 另外，创建 `stopCh` 对象，该对象用于在程序进程退出之前通知 `Informer` 提前退出，因为 `Informer` 是一个持久运行的 `goroutine`。
4. `informers.NewSharedInformerFactory` 函数实例化了 `SharedInformer` 对象，它接收两个参数：
    - 第1个参数 `ClientSet` 是用于与 Kubernetes API Server 交互的客户端
    - 第2个参数 `time.Minute` 用于设置多久进行一次 `resync`（重新同步），`resync` 会周期性地执行 `List` 操作，将所有的资源存放在 `Informer Store` 中，如果该参数为 0，则禁用 `resync` 功能。
5. 在 Informers Example 代码示例中，通过 `informerFactory.Apps().V1().Deployments()` 。 `Informer` 可以得到具体 `Deployments` 资源的 `informer` 对象。通过 `informer.AddEventHandler` 函数可以为 `deployment` 资源添加资源事件回调方法，支持3种资源事件回调方法，分别介绍如下：
    - `AddFunc`：当创建 `deployment` 资源对象时触发的事件回调方法。
    - `UpdateFunc`：当更新 `deployment` 资源对象时触发的事件回调方法。
    - `DeleteFunc`：当删除 `deployment` 资源对象时触发的事件回调方法。
6. 在正常的情况下，使用 `Informer` 机制时触发资源事件回调方法后是将资源对象推送到 `WorkQueue` 或其他队列中(实际过程中大都是这样的)，在 Informers Example 代码示例中，我们直接输出触发的 `deployment` 资源的名称。
:::

编码完成，执行`go run main.go`，即可获取指定 `namespace` 下所有 `deployment` 的信息，控制台输出如下：

```bash
$ go run main.go
add a deployment: rancher-monitoring-kube-state-metrics
add a deployment: metrics-server
add a deployment: argocd-dex-server
add a deployment: argocd-notifications-controller      
add a deployment: argocd-repo-server
add a deployment: rancher-monitoring-grafana
add a deployment: fleet-agent
add a deployment: rancher-monitoring-operator
add a deployment: traefik
add a deployment: sample
add a deployment: argocd-applicationset-controller     
add a deployment: crane-scheduler
add a deployment: busybox
add a deployment: cloudcore
add a deployment: cattle-cluster-agent
add a deployment: crane-scheduler-controller
add a deployment: sample
add a deployment: kruise-controller-manager
add a deployment: argo-rollouts
add a deployment: argocd-redis
add a deployment: argocd-server
add a deployment: rancher-monitoring-prometheus-adapter
add a deployment: coredns
add a deployment: ops-pod-cleaner
add a deployment: nginx-deployment
1 -> busybox
2 -> sample
3 -> nginx-deployment
```

> [!IMPORTANT] 技巧
> 这样当我们启动 `Informer` 的时候首先会将集群的全量 `deployment` 数据同步到本地的缓存中，会触发 `AddFunc` 这个回调函数。