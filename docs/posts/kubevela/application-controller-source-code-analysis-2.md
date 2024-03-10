---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/k8s-2.jpeg
date: 2023-09-23
author: 意琦行
tag:
  - Kubevela
  - 应用交付
  - kubernetes
sticky: 1
prev:
  text: 'Kubevela系列二：Application Controller 源码分析(上)'
  link: '/posts/kubevela/application-controller-source-code-analysis-1'
next:
  text: 'Kubevela系列四：插件指南-轻松扩展你的平台专属能力'
  link: '/posts/kubevela/addon-build-instruction'
---

# Kubevela系列三：Application Controller 源码分析(下)

本文主要分析 KubeVela 中的 App Controller 部分源码，分享 app 对象 apply 到集群之后 KubeVela 的运作流程，从而更好的理解 KubeVela。

本文旨在通过分析源码，解决一个大问题和几个小问题。

> [!IMPORTANT] 提问
> KubeVela 中的 `Application` 对象是怎么工作的?
>
> 几个小问题：
> 
> - App 中的 `components` 是怎么转换为 `k8s object` 的
> - App 中的 `policy` 分别是怎么工作的
> - App 中的 `workflow` 是怎么运行的

## 前言
看这部内容之前，需要对 KubeVela 有一个大致的认识，比如

- 知道 `Application` 对象 由 `Component、Trait、Policy、Workflow` 等组成
- 知道 KubeVela 中的 `Component` 注册机制

再次建议看一下这篇文章：[Kubevela系列一：初识 KubeVela，基于 OAM 模型的应用交付平台](./get-to-know-kubevela.md)

具体代码在`pkg/controller/core.oam.dev/v1beta1/application/application_controller.go` 文件里。

整体分为 3 个大逻辑：

- 1）解析得到 `appFile`
- 2）构建 `applicationStep`
- 3）将资源部署到 k8s 集群

下篇里主要分析第二和第三部分：如何解析 `Application` 对象，得到 `appFile` 对象。

## 生成应用步骤：GenerateApplicationSteps

这里就进入了第二个大的逻辑，根据 `appFile` 生成 `ApplicationStep`，这里的 `Step` 和前面提到的 `WorkflowStep` 有所区别，这里的 `ApplicationStep` 是真正用于执行的。

:::tip
相当于 `WorkflowStep` 定义了需要执行什么操作，`ApplicationStep` 则是真正的执行对象。
:::

### 获取 `workflowInstance` & `Runners`

拿到 `appFile` 之后下一个比较重要的逻辑就是`GenerateApplicationSteps`:

```go
workflowInstance, runners, err := handler.GenerateApplicationSteps(logCtx, app, appParser, appFile)
```

这个方法还是挺复杂的，最终得到了一个 `instance`和一个 `runner`，其中 `runner` 是比较重要的，

这里面实际就是注册了一些 `func`，具体如下：

```tip
核心为里面的 `xxx.Install` 方法，后续用到时再具体分析，这里先略过
```

```go
func (h *AppHandler) GenerateApplicationSteps(ctx monitorContext.Context,
    app *v1beta1.Application,
    appParser *appfile.Parser,
    af *appfile.Appfile) (*wfTypes.WorkflowInstance, []wfTypes.TaskRunner, error) {

    handlerProviders := providers.NewProviders()
    kube.Install(handlerProviders, h.Client, appLabels, &kube.Handlers{
       Apply:  h.Dispatch,
       Delete: h.Delete,
    })
    
    configprovider.Install(handlerProviders, h.Client, func(ctx context.Context, resources []*unstructured.Unstructured, applyOptions []apply.ApplyOption) error {
       for _, res := range resources {
          res.SetLabels(util.MergeMapOverrideWithDst(res.GetLabels(), appLabels))
       }
       return h.resourceKeeper.Dispatch(ctx, resources, applyOptions)
    })
    
    oamProvider.Install(handlerProviders, app, af, h.Client, h.applyComponentFunc(
       appParser, appRev, af), h.renderComponentFunc(appParser, appRev, af))
    pCtx := velaprocess.NewContext(generateContextDataFromApp(app, appRev.Name))
    renderer := func(ctx context.Context, comp common.ApplicationComponent) (*appfile.Component, error) {
       return appParser.ParseComponentFromRevisionAndClient(ctx, comp, appRev)
    }
    
    multiclusterProvider.Install(handlerProviders, h.Client, app, af,
       h.applyComponentFunc(appParser, appRev, af),
       h.checkComponentHealth(appParser, appRev, af),
       renderer)
       
    terraformProvider.Install(handlerProviders, app, renderer)
    
    query.Install(handlerProviders, h.Client, nil)
    
    
    // 省略...
 }
```

可以看到有各种 `Install`，这里注册上之后，后面的逻辑里就会用到这些东西，因此暂时不展开分析了，等用到了再细说。

至此，我们获取到了一个 `workflowInstance` 和 `runners` 对象。

### ExecuteRunners

核心就下面两句：

```go
workflowExecutor := executor.New(workflowInstance, r.Client, nil)
workflowState, err := workflowExecutor.ExecuteRunners(authCtx, runners)
```

使用前面的 `workflowInstance` 构建了 `workflowExecutor`，然后通过 `workflowExecutor` 运行了前面拿到的 `runners` 对象。这里的 `ExecuteRunners` 是一个接口，最终实现在[这里](http://github.com/kubevela/workflow/pkg/executor/workflow.go#L102)，精简后的代码如下：

```go
func (w *workflowExecutor) ExecuteRunners(ctx monitorContext.Context, taskRunners []types.TaskRunner) (v1alpha1.WorkflowRunPhase, error) {
    // new 一个用于执行 Workflow 的 engine
    e := newEngine(ctx, wfCtx, w, status, taskRunners)
    // 核心方法
    err = e.Run(ctx, taskRunners, dagMode)
    if err != nil {
       ctx.Error(err, "run steps")
       StepStatusCache.Store(cacheKey, len(status.Steps))
       return v1alpha1.WorkflowStateExecuting, err
    }

    return e.checkWorkflowPhase(), nil
}
```

继续追踪这个 `Run` 方法：

```go
func (e *engine) Run(ctx monitorContext.Context, taskRunners []types.TaskRunner, dag bool) error {
    var err error
    if dag {
       err = e.runAsDAG(ctx, taskRunners, false)
    } else {
       err = e.steps(ctx, taskRunners, dag)
    }

    e.checkFailedAfterRetries()
    e.setNextExecuteTime(ctx)
    return err
}
```

这里会根据是否是 DAG 走不同的 `case`，默认是 `false`，所以走 `e.steps`:

> [!IMPORTANT]
> 这个 DAG 的值应该是来源于 `Application` 中的 `workflow.mode` 字段，默认为 `StepByStep`，因此 这个 dag 就是 `false`

```go
func (e *engine) steps(ctx monitorContext.Context, taskRunners []types.TaskRunner, dag bool) error {
    
    for index, runner := range taskRunners {
       options := e.generateRunOptions(ctx, e.findDependPhase(taskRunners, index, dag))
       // 核心方法
       status, operation, err := runner.Run(wfCtx, options)
       if err != nil {
          return err
       }
       e.finishStep(operation)
       // 省略...
    }
    return nil
}
```

就是 `for` 循环里面执行 `runner.Run` 方法，然后由于这里的 `runners` 是上一步`GenerateApplicationSteps` 中返回的，因此现在在回过头去看一下这些 `runners` 是什么，这里直接把相关代码贴过来：

```go
runners, err := generator.GenerateRunners(ctx, instance, wfTypes.StepGeneratorOptions{
    Providers:       handlerProviders,
    PackageDiscover: h.pd,
    ProcessCtx:      pCtx,
    TemplateLoader:  template.NewWorkflowStepTemplateRevisionLoader(appRev, h.Client.RESTMapper()),
    Client:          h.Client,
    StepConvertor: map[string]func(step workflowv1alpha1.WorkflowStep) (workflowv1alpha1.WorkflowStep, error){
       wfTypes.WorkflowStepTypeApplyComponent: func(lstep workflowv1alpha1.WorkflowStep) (workflowv1alpha1.WorkflowStep, error) {
          copierStep := lstep.DeepCopy()
          if err := convertStepProperties(copierStep, app); err != nil {
             return lstep, errors.WithMessage(err, "convert [apply-component]")
          }
          copierStep.Type = wfTypes.WorkflowStepTypeBuiltinApplyComponent
          return *copierStep, nil
       },
    },
})
```

然后 `GenerateRunners` 方法内部比较复杂，连续跳了好几个接口才走到最终的实现,具体代码在 这里,核心代码如下：

```go
func (t *TaskLoader) makeTaskGenerator(templ string) (types.TaskGenerator, error) {
    return func(wfStep v1alpha1.WorkflowStep, genOpt *types.TaskGeneratorOptions) (types.TaskRunner, error) {
       // 省略其他逻辑...
       
       
       tRunner := new(taskRunner)
       tRunner.name = wfStep.Name
       // 核心部分，设置 run 方法
       tRunner.run = func(ctx wfContext.Context, options *types.TaskRunOptions) (stepStatus v1alpha1.StepStatus, operations *types.Operation, rErr error) {
           // 省略其他逻辑...
          if err := exec.doSteps(tracer, ctx, taskv); err != nil {
             tracer.Error(err, "do steps")
             exec.err(ctx, true, err, types.StatusReasonExecute)
             return exec.status(), exec.operation(), nil
          }

          return exec.status(), exec.operation(), nil
       }
       return tRunner, nil
    }, nil
}
```

里面的核心方法就是创建了 `runner`，然后为 `run` 方法赋值了，那么我们在前面看到的 `taskrunner.run` 方法实际就是在执行这个方法。

然后这个 `run` 方法里面比较重要的就是这句：

```go
if err := exec.doSteps(tracer, ctx, taskv); err != nil {
    tracer.Error(err, "do steps")
    exec.err(ctx, true, err, types.StatusReasonExecute)
    return exec.status(), exec.operation(), nil
}
```

这里面就是在真的执行 `Workflow` 了

```go
func (exec *executor) doSteps(ctx monitorContext.Context, wfCtx wfContext.Context, v *value.Value) error {
    // 省略其他逻辑...
    return v.StepByFields(func(fieldName string, in *value.Value) (bool, error) {
      // 省略其他逻辑...
       do := OpTpy(in)
       if do == "" {
          return false, nil
       }
       if do == "steps" {
          if err := exec.doSteps(ctx, wfCtx, in); err != nil {
             return false, err
          }
       } else {
          provider := opProvider(in)
          if err := exec.Handle(ctx, wfCtx, provider, do, in); err != nil {
             return false, errors.WithMessagef(err, "run step(provider=%s,do=%s)", provider, do)
          }
       }

       if exec.suspend || exec.terminated || exec.wait {
          return true, nil
       }
       return false, nil
    })
}
```

然后这里根据 `operation type` 也分了 3 个 `case`：

```go
do := OpTpy(in)
if do == "" {
    return false, nil
}
if do == "steps" {
    if err := exec.doSteps(ctx, wfCtx, in); err != nil {
        return false, err
    }
} else {
    provider := opProvider(in)
    if err := exec.Handle(ctx, wfCtx, provider, do, in); err != nil {
        return false, errors.WithMessagef(err, "run step(provider=%s,do=%s)", provider, do)
    }
}
```

一般我们手动指定的 `Workflow` 都是 `deploy`，因此会进入到最后的 `else` 这个 `case`，那么继续追踪 `ecec.Handle` 方法：

```go
func (exec *executor) Handle(ctx monitorContext.Context, wfCtx wfContext.Context, provider string, do string, v *value.Value) error {
    // 根据 provider 和 do 的类型找到对应的handler
    h, exist := exec.handlers.GetHandler(provider, do)
    if !exist {
       return errors.Errorf("handler not found")
    }
    // 最后就是执行这个 handler
    return h(ctx, wfCtx, v, exec)
}
```

这里面的 `handler` 实际上就是前面 `GenerateApplicationSteps` 的时候不是很多 `Install` 方法吗，就是在注册 `hanlder`,就像这样：

```go
// pkg/controller/core.oam.dev/v1beta1/application/generator.go#L114
    multiclusterProvider.Install(handlerProviders, h.Client, app, af,
       h.applyComponentFunc(appParser, appRev, af),
       h.checkComponentHealth(appParser, appRev, af),
       renderer)
```

继续追踪 `Install` ：

```go
func Install(p wfTypes.Providers, c client.Client, app *v1beta1.Application, af *appfile.Appfile, apply oamProvider.ComponentApply, healthCheck oamProvider.ComponentHealthCheck, renderer oamProvider.WorkloadRenderer) {
    prd := &provider{Client: c, app: app, af: af, apply: apply, healthCheck: healthCheck, renderer: renderer}
    p.Register(ProviderName, map[string]wfTypes.Handler{
       "make-placement-decisions":              prd.MakePlacementDecisions,
       "patch-application":                     prd.PatchApplication,
       "list-clusters":                         prd.ListClusters,
       "get-placements-from-topology-policies": prd.GetPlacementsFromTopologyPolicies,
       "deploy":                                prd.Deploy,
    })
}
```

可以看到就是调用了 `Register` 方法，把这些 `hander` 给注册进来了。

:::warning 注意
这也是一种常见的写法，方法的注册和调用分发，通过注册的方式来解耦。
:::

那么我们这里是 `deploy` 对应的就是 `prd.Deploy` 这个方法：

```go
// pkg/workflow/providers/multicluster/multicluster.go#L153
func (p *provider) Deploy(ctx monitorContext.Context, _ wfContext.Context, v *value.Value, act wfTypes.Action) error {
    param := DeployParameter{}
    if err := v.CueValue().Decode(&param); err != nil {
       return err
    }
    if param.Parallelism <= 0 {
       return errors.Errorf("parallelism cannot be smaller than 1")
    }
    executor := NewDeployWorkflowStepExecutor(p.Client, p.af, p.apply, p.healthCheck, p.renderer, param)
    healthy, reason, err := executor.Deploy(ctx)
    if err != nil {
       return err
    }
    if !healthy {
       act.Wait(reason)
    }
    return nil
}
```

直接进入 `executor.Deploy` 方法。

这里先小结一下，这部分主要根据 `WorkflowStep` 生成 `ApplicationStep`，然后构建 `workflow` engine 来执行具体步骤。

然后具体执行的方法是在`GenerateApplicationSteps` 方法里注册上去的，根据名字选择执行不同的方法。

下面就选择最核心的 `Deploy` 方法来分析，其他的步骤根据各种实现就有所不同了，大家感兴趣的可以去`GenerateApplicationSteps`方法里翻一下。

## 部署逻辑：`Deploy`
这部分开始就是具体的部署逻辑，前面在解析 `appFile` 的时候我们的 `component` 已经解析完成了，从 `XDefine` 里拿到 CUE 模板，从 app 对象的 `component` 里拿到对应参数，然后将二者合并生成最终的 `k8s object` 对象。

:::tip
如果对这部分逻辑不清楚，可以回过头去看一下上篇第一部分 解析 `appFile`
:::

这里就会将前面得到的 `k8s object` 对象部署到集群里去。这里需要两部分参数：

- 1）部署到哪个集群那个命名空间
- 2）部署什么内容

下面的代码会告诉我们答案，`Deploy` 具体代码如下：

```go
func (executor *deployWorkflowStepExecutor) Deploy(ctx context.Context) (bool, string, error) {
    policies, err := selectPolicies(executor.af.Policies, executor.parameter.Policies)
    if err != nil {
       return false, "", err
    }
    policies = append(policies, fillInlinePolicyNames(executor.parameter.InlinePolicies)...)
    // 首先是 loadComponents，这里的 render 方法是通过外部传进去的，实际上就是前面分析过的方法
    components, err := loadComponents(ctx, executor.renderer, executor.cli, executor.af, executor.af.Components, executor.parameter.IgnoreTerraformComponent)
    if err != nil {
       return false, "", err
    }

    // 这里就是在处理 topology 类型的 policy，解析出 component 需要被分发到哪些集群去
    placements, err := pkgpolicy.GetPlacementsFromTopologyPolicies(ctx, executor.cli, executor.af.Namespace, policies, resourcekeeper.AllowCrossNamespaceResource)
    if err != nil {
       return false, "", err
    }
    // 这里就是在处理 override policy，对不同集群内容分别处理
    components, err = overrideConfiguration(policies, components)
    if err != nil {
       return false, "", err
    }
    // 这里在处理 replication 类型的 policy，他是把一个应用多个副本数分到不同集群
    components, err = pkgpolicy.ReplicateComponents(policies, components)
    if err != nil {
       return false, "", err
    }
    // 核心，apply 到 k8s 集群
    return applyComponents(ctx, executor.apply, executor.healthCheck, components, placements, int(executor.parameter.Parallelism))
}
```

分为三个步骤：

- 1）加载 `component`
- 2）分别处理不同类型的 `policy`
    - `Topology`
    - `Override`
    - `Replication`
- 3）`applyComponents`

:::warning 注意📢：
这里是 `deployWorkflowStepExecutor` ，也就是说执行的步骤对应的是 `Application` 对象里面 `spec.workflow.steps` 中的某一个步骤 ，因此如果有多个 `step` 则会分别走多次流程，而且是互不干扰的
:::

> [!IMPORTANT]
> 所以每个 step 关联了哪些策略是影响最大的

比如 `step1` 关联了 `topology1` 和 `override1` 这两个策略：

- 1） `topology` 策略指定要部署到 `cluster1` 的 `default` 命名空间
- 2）`override` 策略对默认参数做了一些自定义

等该 `step` 执行之后，效果就是部署到 `cluster1` 的 `default` 命名空间的应用是有自定义效果的

`step2` 只关联了 `topology2`：要部署到 `cluster2` 的 `default` 命名空间，由于没有 `override` 策略，因此部署到 `cluster2`的`default` 命名空间的应用就是默认值。

### `topology` 策略：`GetPlacementsFromTopologyPolicies`

这部分主要是根据 `topology` 类型的 `policy` 拿到具体要部署的集群的命名空间。

:::details `GetPlacementsFromTopologyPolicies`函数
```go
func GetPlacementsFromTopologyPolicies(ctx context.Context, cli client.Client, appNs string, policies []v1beta1.AppPolicy, allowCrossNamespace bool) ([]v1alpha1.PlacementDecision, error) {
    placements := make([]v1alpha1.PlacementDecision, 0)
    placementMap := map[string]struct{}{}
    addCluster := func(cluster string, ns string, validateCluster bool) error {
       if validateCluster {
          if _, e := multicluster.NewClusterClient(cli).Get(ctx, cluster); e != nil {
             return errors.Wrapf(e, "failed to get cluster %s", cluster)
          }
       }
       if !allowCrossNamespace && (ns != appNs && ns != "") {
          return errors.Errorf("cannot cross namespace")
       }
       placement := v1alpha1.PlacementDecision{Cluster: cluster, Namespace: ns}
       name := placement.String()
       if _, found := placementMap[name]; !found {
          placementMap[name] = struct{}{}
          placements = append(placements, placement)
       }
       return nil
    }
    hasTopologyPolicy := false
    for _, policy := range policies {
       // 只处理 topology 类型的额 policy
       if policy.Type == v1alpha1.TopologyPolicyType {
          if policy.Properties == nil {
             return nil, fmt.Errorf("topology policy %s must not have empty properties", policy.Name)
          }
          hasTopologyPolicy = true
          clusterLabelSelector := GetClusterLabelSelectorInTopology(topologySpec)
          
          // 核心逻辑
          switch {
          case topologySpec.Clusters != nil:
             // 如果policy 里面指定了要分发到哪些集群就直接使用，调用 addCluster 方法
             // 将其加入到 placements 数组里
             for _, cluster := range topologySpec.Clusters {
                if err := addCluster(cluster, topologySpec.Namespace, true); err != nil {
                   return nil, err
                }
             }
          case clusterLabelSelector != nil:
             // 如果是通过 labelSelector 方式来选择集群，那就先把集群查询出来
             // 然后调用 addCluster 方法添加
             clusterList, err := multicluster.NewClusterClient(cli).List(ctx, client.MatchingLabels(clusterLabelSelector))
             for _, cluster := range clusterList.Items {
                if err = addCluster(cluster.Name, topologySpec.Namespace, false); err != nil {
                   return nil, err
                }
             }
          default:
             if err := addCluster(pkgmulticluster.Local, topologySpec.Namespace, false); err != nil {
                return nil, err
             }
          }
       }
    }
    // 兜底策略，如果没有指定 topology 类型的 policy 那就部署到 hub 集群
    if !hasTopologyPolicy {
       placements = []v1alpha1.PlacementDecision{{Cluster: multicluster.ClusterLocalName}}
    }
    return placements, nil
}
```
:::

补上一个 `placement` 的定义：

```go
type PlacementDecision struct {
    Cluster   string `json:"cluster"`
    Namespace string `json:"namespace"`
}
```

逻辑比较简单，`topology` 类型的 `policy` 里面有两种方式指定集群，一个是直接指定集群名，另一个是指定 `label`，然后这里就根据 `label` 查询到对应的集群。

至于命名空间暂时只提供了直接指定名字的方式，因为只能指定一个命名空间，因此对于多个集群也只能部署到同一个命名空间。

现在 `topology` 类型的 `policy` 是怎么生效的应该就比较清晰了，

> [!IMPORTANT]
> 就是根据 `topology` 策略里的配置拿到需要部署的集群,如果没有就默认部署到 `local` 集群的 `default` 命名空间。
>
> 这也就是为什么有时候没有指定 `Policy` 应用也能部署起来。

### 覆盖策略：`overrideConfiguration`

再看一下覆盖策略，代码比较简单，拿到 `override` 类型的策略，然后解析 `properties` 中的配置并覆盖到 `component` 上。

这里是用的 `for` 循环，因此指定了多个 `override` 策略则是都会生效，如果都修改同一个值则是后面的策略会覆盖前面的策略。

:::tip
多个策略，按顺序依次覆盖，后者覆盖前者。
:::

```go
func overrideConfiguration(policies []v1beta1.AppPolicy, components []common.ApplicationComponent) ([]common.ApplicationComponent, error) {
    var err error
    for _, policy := range policies {
       if policy.Type == v1alpha1.OverridePolicyType {
          if policy.Properties == nil {
             return nil, fmt.Errorf("override policy %s must not have empty properties", policy.Name)
          }
          overrideSpec := &v1alpha1.OverridePolicySpec{}
          if err := utils.StrictUnmarshal(policy.Properties.Raw, overrideSpec); err != nil {
             return nil, errors.Wrapf(err, "failed to parse override policy %s", policy.Name)
          }
          components, err = envbinding.PatchComponents(components, overrideSpec.Components, overrideSpec.Selector)
          if err != nil {
             return nil, errors.Wrapf(err, "failed to apply override policy %s", policy.Name)
          }
       }
    }
    return components, nil
}
```

关于这个 `override` 策略具体是怎和某个组件关联的，有必要提一下， 因为比较容易理解错。

:::tip
具体的组件定义：[`override.cue`](https://github.com/kubevela/kubevela/blob/26faaaf4f921d274ec745ee1f9ddfc2589987dc5/vela-templates/definitions/internal/policy/override.cue)
:::

内容如下：

```cue
"override": {
        annotations: {}
        description: "Describe the configuration to override when deploying resources, it only works with specified `deploy` step in workflow."
        labels: {}
        attributes: {}
        type: "policy"
}

template: {

        #PatchParams: {
                // +usage=Specify the name of the patch component, if empty, all components will be merged
                name?: string
                // +usage=Specify the type of the patch component.
                type?: string
                // +usage=Specify the properties to override.
                properties?: {...}
                // +usage=Specify the traits to override.
                traits?: [...{
                        // +usage=Specify the type of the trait to be patched.
                        type: string
                        // +usage=Specify the properties to override.
                        properties?: {...}
                        // +usage=Specify if the trait should be remove, default false
                        disable: *false | bool
                }]
        }

        parameter: {
                // +usage=Specify the overridden component configuration.
                components: [...#PatchParams]
                // +usage=Specify a list of component names to use, if empty, all components will be selected.
                selector?: [...string]
        }
}
```

有 `components` 和 `selector` 两个参数，具体代码见：`pkg/policy/envbinding/patch.go#L135`

- `components`：这部分用于指定修改某个组件内的某些参数，通过 `name + type` 来定位到唯一组件，可以修改多个组件参数。
    - 由于组件的 `name` 不是必填的，因此没有指定 `name` 时会按照 `type` 匹配 `component`，如果同类型有多个 `component` 都会被覆盖
- `selector`：直接修改要部署的 `component` 列表，上一步 `components` 里只能做参数差异化，如果直接不想部署某些组件就可以使用 `selector` 参数来实现。未在 `selector` 列表中的 `component` 会被过滤掉，不会真正被部署。
    - 不填(参数为 `nil` )默认会部署所有 `component`
    - 如果是空数组则所有 `component` 都会被过滤掉

`Components` 匹配规则如下：

- 没有 `name` 就按照 `type` 匹配
- 有就同时按 `name + type` 匹配

```go
for _, comp := range patchComponents {
    if comp.Name == "" {
       // when no component name specified in the patch
       // 1. if no type name specified in the patch, it will merge all components
       // 2. if type name specified, it will merge components with the specified type
       for compName, baseComp := range compMaps {
          if comp.Type == "" || comp.Type == baseComp.Type {
             compMaps[compName], err = MergeComponent(baseComp, comp.DeepCopy())
             if err != nil {
                errs = append(errs, errors.Wrapf(err, "failed to merge component %s", compName))
             }
          }
       }
    } else {
       // when component name (pattern) specified in the patch, it will find the component with the matched name
       // 1. if the component type is not specified in the patch, the matched component will be merged with the patch
       // 2. if the matched component uses the same type, the matched component will be merged with the patch
       // 3. if the matched component uses a different type, the matched component will be overridden by the patch
       // 4. if no component matches, and the component name is a valid kubernetes name, a new component will be added
       addComponent := regexp.MustCompile("[a-z]([a-z-]{0,61}[a-z])?").MatchString(comp.Name)
       if re, err := regexp.Compile(strings.ReplaceAll(comp.Name, "*", ".*")); err == nil {
          for compName, baseComp := range compMaps {
             if re.MatchString(compName) {
                addComponent = false
                if baseComp.Type != comp.Type && comp.Type != "" {
                   compMaps[compName] = comp.ToApplicationComponent()
                } else {
                   compMaps[compName], err = MergeComponent(baseComp, comp.DeepCopy())
                   if err != nil {
                      errs = append(errs, errors.Wrapf(err, "failed to merge component %s", comp.Name))
                   }
                }
             }
          }
       }
       if addComponent {
          compMaps[comp.Name] = comp.ToApplicationComponent()
          compOrders = append(compOrders, comp.Name)
       }
    }
}
```

`selector` 逻辑也比较简单，不在里面的组件就直接过滤掉。

```go
// if selector is enabled, filter
compOrders = utils.FilterComponents(compOrders, selector)

// fill in new application
newComponents := []common.ApplicationComponent{}
for _, compName := range compOrders {
    newComponents = append(newComponents, *compMaps[compName])
}
```

小结一下，`override policy` 有两个作用：

- 1）修改某个组件的参数，实现差异化部署，比如可以调整副本数或者镜像等信息
- 2）直接指定不部署某个策略，进一步实现差异化部署，比如某些组件可能不用部署到测试环境，就可以在这里过滤掉。

### 部署到集群：`applyComponents`

到这里，我们已经拿到有要部署的集群和命名空间，以及要部署的内容，这里就开始真正的 apply 操作了。

:::warning 注意📢：
这里的 apply 可以看做 `kubectl apply`中的 apply。
:::

已经接近真相了，再加把劲，追踪一下 `applyComponents`:

这个方法也很复杂，我们只看重点，就是 apply 方法

```go
func applyComponents(ctx context.Context, apply oamProvider.ComponentApply, healthCheck oamProvider.ComponentHealthCheck, components []common.ApplicationComponent, placements []v1alpha1.PlacementDecision, parallelism int) (bool, string, error) {
  // 省略...
    _, _, healthy, err := apply(ctx, task.component, nil, task.placement.Cluster, task.placement.Namespace)
    if err != nil {
        return &applyTaskResult{healthy: healthy, err: err, task: task}
    }
  // 省略...
}
```

然后这个 apply 方法实际是外部传进来的，是这样调用的：

```go
applyComponents(ctx, executor.apply, executor.healthCheck, components, placements, int(executor.parameter.Parallelism))
```

合理推测，这个可能是之前 `Install` 的时候赋值的，翻回去看一下：

```go
// Install register handlers to provider discover.
func Install(p wfTypes.Providers, c client.Client, app *v1beta1.Application, af *appfile.Appfile, apply oamProvider.ComponentApply, healthCheck oamProvider.ComponentHealthCheck, renderer oamProvider.WorkloadRenderer) {
    prd := &provider{Client: c, app: app, af: af, apply: apply, healthCheck: healthCheck, renderer: renderer}
    p.Register(ProviderName, map[string]wfTypes.Handler{
       "make-placement-decisions":              prd.MakePlacementDecisions,
       "patch-application":                     prd.PatchApplication,
       "list-clusters":                         prd.ListClusters,
       "get-placements-from-topology-policies": prd.GetPlacementsFromTopologyPolicies,
       "deploy":                                prd.Deploy,
    })
}
```

可以看到，这里正好有一个 apply 参数传进来:

```go
prd := &provider{Client: c, app: app, af: af, apply: apply, healthCheck: healthCheck, renderer: renderer}
    p.Register(ProviderName, map[string]wfTypes.Handler{
```

回到外面，这个 apply 对应的就是：

```go
multiclusterProvider.Install(handlerProviders, h.Client, app, af,
    h.applyComponentFunc(appParser, appRev, af),
    h.checkComponentHealth(appParser, appRev, af),
    renderer)
```

`applyComponentFunc` 如下：

```go
// pkg/controller/core.oam.dev/v1beta1/application/generator.go#L361
func (h *AppHandler) applyComponentFunc(appParser *appfile.Parser, appRev *v1beta1.ApplicationRevision, af *appfile.Appfile) oamProvider.ComponentApply {
    return func(baseCtx context.Context, comp common.ApplicationComponent, patcher *value.Value, clusterName string, overrideNamespace string) (*unstructured.Unstructured, []*unstructured.Unstructured, bool, error) {
      // 省略其他逻辑...
       if utilfeature.DefaultMutableFeatureGate.Enabled(features.MultiStageComponentApply) {
          manifestDispatchers, err := h.generateDispatcher(appRev, readyWorkload, readyTraits, overrideNamespace)
          if err != nil {
             return nil, nil, false, errors.WithMessage(err, "generateDispatcher")
          }

          for _, dispatcher := range manifestDispatchers {
             if isHealth, err := dispatcher.run(ctx, wl, appRev, clusterName); !isHealth || err != nil {
                return nil, nil, false, err
             }
          }
       } else {
          dispatchResources := readyTraits
          if !wl.SkipApplyWorkload {
             dispatchResources = append([]*unstructured.Unstructured{readyWorkload}, readyTraits...)
          }

          if err := h.Dispatch(ctx, clusterName, common.WorkflowResourceCreator, dispatchResources...); err != nil {
             return nil, nil, false, errors.WithMessage(err, "Dispatch")
          }
          _, _, _, isHealth, err = h.collectHealthStatus(ctx, wl, appRev, overrideNamespace, false)
          if err != nil {
             return nil, nil, false, errors.WithMessage(err, "CollectHealthStatus")
          }
       }

       if DisableResourceApplyDoubleCheck {
          return readyWorkload, readyTraits, isHealth, nil
       }
       workload, traits, err := getComponentResources(auth.ContextWithUserInfo(ctx, h.app), manifest, wl.SkipApplyWorkload, h.Client)
       return workload, traits, isHealth, err
    }
}
```

这里根据是否开启了 `features.MultiStageComponentApply` 特性分为两个分支

> [!IMPORTANT]
> `MultiStageComponentApply`: 启用多阶段组件资源部署能力。当启用时，组件内的资源下发可分不同批次下发。

```go
if utilfeature.DefaultMutableFeatureGate.Enabled(features.MultiStageComponentApply) {
    manifestDispatchers, err := h.generateDispatcher(appRev, readyWorkload, readyTraits, overrideNamespace)
    if err != nil {
       return nil, nil, false, errors.WithMessage(err, "generateDispatcher")
    }

    for _, dispatcher := range manifestDispatchers {
       if isHealth, err := dispatcher.run(ctx, wl, appRev, clusterName); !isHealth || err != nil {
          return nil, nil, false, err
       }
    }
} else {
    if err := h.Dispatch(ctx, clusterName, common.WorkflowResourceCreator, dispatchResources...); err != nil {
       return nil, nil, false, errors.WithMessage(err, "Dispatch")
    }
```

这个特性默认为 `false`，因此我们直接进入下面的 `h.Dispatch` 方法：

```go
// Dispatch apply manifests into k8s.
func (h *AppHandler) Dispatch(ctx context.Context, cluster string, owner string, manifests ...*unstructured.Unstructured) error {
    manifests = multicluster.ResourcesWithClusterName(cluster, manifests...)
    
    // 核心逻辑
    if err := h.resourceKeeper.Dispatch(ctx, manifests, nil); err != nil {
       return err
    }
    for _, mf := range manifests {
       // 记录 apply 过的资源
       h.addAppliedResource(false, ref)
    }
    return nil
}
```

里面又调用了一个 `Dispatch` 方法，继续追踪：

```go
func (h *resourceKeeper) Dispatch(ctx context.Context, manifests []*unstructured.Unstructured, applyOpts []apply.ApplyOption, options ...DispatchOption) (err error) {
    if utilfeature.DefaultMutableFeatureGate.Enabled(features.ApplyOnce) ||
       (h.applyOncePolicy != nil && h.applyOncePolicy.Enable && h.applyOncePolicy.Rules == nil) {
       options = append(options, MetaOnlyOption{})
    }
    h.ClearNamespaceForClusterScopedResources(manifests)
    // 0. check admission
    if err = h.AdmissionCheck(ctx, manifests); err != nil {
       return err
    }
    // 1. pre-dispatch check
    opts := []apply.ApplyOption{apply.MustBeControlledByApp(h.app), apply.NotUpdateRenderHashEqual()}
    if len(applyOpts) > 0 {
       opts = append(opts, applyOpts...)
    }
    if utilfeature.DefaultMutableFeatureGate.Enabled(features.PreDispatchDryRun) {
       if err = h.dispatch(ctx,
          velaslices.Map(manifests, func(manifest *unstructured.Unstructured) *unstructured.Unstructured { return manifest.DeepCopy() }),
          append([]apply.ApplyOption{apply.DryRunAll()}, opts...)); err != nil {
          return fmt.Errorf("pre-dispatch dryrun failed: %w", err)
       }
    }
    // 2. record manifests in resourcetracker
    if err = h.record(ctx, manifests, options...); err != nil {
       return err
    }
    // 3. apply manifests
    if err = h.dispatch(ctx, manifests, opts); err != nil {
       return err
    }
    return nil
}
```

里面做了一些检查，然后做了记录，最终 apply 的实现在 `h.dispatch(ctx, manifests, opts)` 里面：

一路往下跳，最终进入 apply 方法：

```go
func (h *resourceKeeper) dispatch(ctx context.Context, manifests []*unstructured.Unstructured, applyOpts []apply.ApplyOption) error {
    errs := velaslices.ParMap(manifests, func(manifest *unstructured.Unstructured) error {

       
       return h.applicator.Apply(applyCtx, manifest, ao...)
       
    }, velaslices.Parallelism(MaxDispatchConcurrent))
    return velaerrors.AggregateErrors(errs)
}
```

核心就在 `h.applicator.Apply(applyCtx, manifest, ao...)`

```go
func (a *APIApplicator) Apply(ctx context.Context, desired client.Object, ao ...ApplyOption) error {
   // 如果已经存在就返回，没有就创建
    existing, err := a.createOrGetExisting(ctx, applyAct, a.c, desired, ao...)
    if err != nil {
       return err
    }
    if existing == nil {
       return nil
    }


    // 然后判断是否需要 recreate
    shouldRecreate, err := needRecreate(strategy.RecreateFields, existing, desired)
    if err != nil {
       return fmt.Errorf("failed to evaluate recreateFields: %w", err)
    }
    if shouldRecreate {
       // 需要的话就 delete 然后在 create
       if existing.GetDeletionTimestamp() == nil { // check if recreation needed
          if err = a.c.Delete(ctx, existing); err != nil {
             return errors.Wrap(err, "cannot delete object")
          }
       }
       return errors.Wrap(a.c.Create(ctx, desired), "cannot recreate object")
    }

    // 最后在有更新的话就，区分是 update 还是 patch 调用不同的方法
    switch strategy.Op {
    case v1alpha1.ResourceUpdateStrategyReplace:
       return errors.Wrapf(a.c.Update(ctx, desired, options...), "cannot update object")
    case v1alpha1.ResourceUpdateStrategyPatch:
       fallthrough
    default:
       return errors.Wrapf(a.c.Patch(ctx, desired, patch), "cannot patch object")
    }
}
```

可以看到，这里就真正的在调用 `k8s api` 来实现部署操作了。

OK，至此，我们渲染出来的 `k8s object` 终于是 apply 到集群里了。

整个流程还是有这么复杂..

这里分析的时候还是只看了核心逻辑，加上其他非核心逻辑的话，简直不敢想。

## FAQ

这里记录了一下，自己的一些疑问，实际上分析完源码后大部分都被解开了。

> [!IMPORTANT] 提问
> 问题一：多个 `override policy` 会怎么执行？
>
> 根据覆盖策略：`overrideConfiguration`章节可知，多个 `override` 会按先后顺序进行覆盖，以后生效的为准。
>
> 问题二：为什么 `Application` 中不指定 `Workflow` 也能执行？
>
> 因为在 Application Controller 逻辑中检测到未指定任何 `Workflow` 时会自动生成用于部署的 `Workflow`。
>
> - 情况一：指定了 `topology policy` 只是没有指定 `Workflow`
>
>   根据第一部分`DeployWorkflowStepGenerator`可知，会根据 `topology policy` 生成默认 `Workflow`。
>
> - 情况二：连 `topology policy` 都没有指定
>
>   第一部分`ApplyComponentWorkflowStepGenerator`会默认会每个 `component` 生成一个 `step` 用于部署。
>
>   第三部分获取目标集群和命名空间：`GetPlacementsFromTopologyPolicies`在没有指定部署位置时会默认部署到 `local` 集群的 `default` 命名空间。
>
> 因此：未指定 `topology policy` 和 `Workflow` 的 `Application` 也会被部署到 `local` 集群的 `default` 命名空间。

:::warning 注意📢：
但是如果手动指定了一个 `WorkflowStep` 就会导致上述逻辑失效，最终 `Application` 对象可能无法被部署出来。
:::

因此要么不写 `Workflow`，要么就保证 `Workflow` 是对的。

## 小结

流程和之前说的差不多，大致分为这几个步骤：

- 1）首先解析 app 对象，解析为 内部的 `appfile`
    - App 对象是个用户看的，KubeVela 内部使用的是一个叫做 `appfile` 的结构体
    - 这里就会分离 app 里的 `component、policy、workflow` 等结构
- 2）查询 CRD 拿到对应插件里的 `spec.cue.template`
    - 因为 KubeVela 里面的插件也是通过 CRD 形式注册的，因此这里直接通过查询 CRD 拿到插件对象
    - CRD 的名字就是查询的类型
- 3）将 CUE 模板和组件里的参数合并生成 `k8s object`
    - 这部分就是调用的 CUE 的包了
- 4）生成 `Workflow` 并执行，`Workflow` 里有一个 apply 类型的 `handler`，就是把 `k8s object` 应用到对应集群里
    - 每个步骤是单独执行的，互不干扰。
    - 每个步骤执行都会根据关联的策略计算目标集群、组件参数覆盖等数据

比较重要的就是两部分吧：

- 1）app 对象在 KubeVela 内部是怎么解析成 `appFile` 然后渲染成 `k8s object` 的
- 2）`ExecuteRunners` 部分，`Workflow` 是什么生成的，各种类型的 `policy` 是怎么处理的

