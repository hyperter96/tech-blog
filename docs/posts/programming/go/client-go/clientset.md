---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/client-go-cover.jpeg
date: 2022-12-22
tag:
  - Go
  - Client-go
sticky: 1
prev:
  text: 'Client-go系列一: Client-go知识体系'
  link: '/posts/programming/go/client-go/intro'
next:
  text: 'Client-go系列三：认识Informer'
  link: '/posts/programming/go/client-go/informer'
---

# Client-go系列二: 认识ClientSet

> `Clientset` 是调用 Kubernetes 资源对象最常用的客户端，可以操作所有 Kubernetes 自身内置的资源对象.

## ClientSet 简介

`ClientSet`使用预生成的 API 对象来与 kube-apiserver 进行交互，类似于 RPC 的变成体验，好处是类型化的客户端使用程序编译来强制执行数据安全性和一些验证，但同时也带来了版本与类型强耦合的问题。

通过 `client-go` 提供的 `ClientSet` 对象来获取资源数据，主要有以下三个步骤：

1. 使用 `kubeconfig` 文件或者 `ServiceAccount`（`InCluster` 模式）来创建访问 Kubernetes API 的 Restful 配置参数，也就是代码中的 `rest.Config` 对象
2. 使用 `rest.Config` 参数创建 `ClientSet` 对象，这一步非常简单，直接调用 `kubernetes.NewForConfig(config)` 即可初始化
3. 然后是 `ClientSet` 对象的方法去获取各个 `Group` 下面的对应资源对象进行 `CRUD` 操作

`Clientset` 源码阅读的切入点就是其名字中的set，这是个集合，里面有很多东西，看一下 `Clientset` 数据结构的源码：

```go
type Clientset struct {
	*discovery.DiscoveryClient
	admissionregistrationV1      *admissionregistrationv1.AdmissionregistrationV1Client
	admissionregistrationV1beta1 *admissionregistrationv1beta1.AdmissionregistrationV1beta1Client
	internalV1alpha1             *internalv1alpha1.InternalV1alpha1Client
	appsV1                       *appsv1.AppsV1Client
	appsV1beta1                  *appsv1beta1.AppsV1beta1Client
	appsV1beta2                  *appsv1beta2.AppsV1beta2Client
	authenticationV1             *authenticationv1.AuthenticationV1Client
    ...
```

:::info 信息
由上可知：
- `Clientset` 是所有 `Group` 和 `Version` 对象组合的集合。
- kubernetes 的 `Group` 和 `Version` 的每个组合，都对应 `Clientset` 数据结构的一个字段。
- Clientset 其实就是把我们使用 `RESTClient` 操作资源的代码按照 `Group` 和 `Version` 分类再封装而已。
:::

## ClientSet编码

新建`main.go`，内容如下：

```go
package main

import (
	"flag"
	"log"
    "path/filepath"
	"context"

    "k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/util/homedir"
	v1 "k8s.io/api/core/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/client-go/tools/clientcmd"
)

func main() {
	var err error
	var config *rest.Config
	var kubeconfig *string

	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(可选) kubeconfig 文件的绝对路径")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "kubeconfig 文件的绝对路径")
	}
	flag.Parse()

	// 首先使用 inCluster 模式(需要去配置对应的 RBAC 权限，默认的sa是default->是没有获取deployments的List权限)
	if config, err = rest.InClusterConfig(); err != nil {
		// 使用 KubeConfig 文件创建集群配置 Config 对象
		if config, err = clientcmd.BuildConfigFromFlags("", *kubeconfig); err != nil {
			panic(err.Error())
		}
	}

    // 创建 ClientSet 实例
    clientset, err := kubernetes.NewForConfig(config)
    if err != nil {
        log.Fatal(err)
    }

    // 设置 list options
    listOptions := metav1.ListOptions{
        LabelSelector: "", 
        FieldSelector: "",
    }

    // 获取 default 命名空间下的 pod 列表
    pods, err := clientset.CoreV1().Pods(v1.NamespaceDefault).List(context.TODO(), listOptions)
    if err != nil {
        log.Fatal(err)
    }
	for _, pod := range pods.Items {
		log.Println(pod.Name)
	}
}
```

编码完成，执行`go run main.go`，即可获取指定`namespace`下所有`pod`的信息，控制台输出如下：
```bash
$ go run main.go
2022/12/16 23:09:40 net-tools-5478cb8f58-pn5bt
2022/12/16 23:09:40 rollouts-demo-7bc96b7dfc-rrt29
```