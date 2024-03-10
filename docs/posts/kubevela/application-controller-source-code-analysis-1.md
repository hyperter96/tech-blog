---
sidebar: false
cover: https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/k8s-1.jpeg
date: 2023-09-22
author: 意琦行
tag:
  - Kubevela
  - 应用交付
  - kubernetes
sticky: 1
prev:
  text: 'Kubevela系列一：初识 KubeVela，基于 OAM 模型的应用交付平台'
  link: '/posts/kubevela/get-to-know-kubevela'
next:
  text: 'Kubevela系列三：Application Controller 源码分析(下)'
  link: '/posts/kubevela/application-controller-source-code-analysis-2'
---

# Kubevela系列二：Application Controller 源码分析(上)

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

由于篇幅比较长，因此拆分成了上下两篇文章。

## Application 对象是什么

基于 OAM 模型，KubeVela将应用抽象成了一个 `Application` 对象，中文翻译可以叫做：应用部署计划。一个完整 `Application` 对象包含以下 4 部分内容：

- `Component`
- `Trait`
- `Policy`
- `Workflow`

具体可以参考这篇文章：[初识 KubeVela：基于 OAM 模型的应用交付平台](./application-controller-source-code-analysis-1.md)

### Demo

以下就是一个完整的 `Application` 对象，

:::details `first-vela-app.yaml`
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
            expose: true
      traits:
        - type: scaler
          properties:
            replicas: 1
  policies:
    - name: target-default
      type: topology
      properties:
        clusters: ["local"]
        namespace: "default"
    - name: target-prod
      type: topology
      properties:
        clusters: ["local"]
        namespace: "prod"
    - name: deploy-ha
      type: override
      properties:
        components:
          - type: webservice
            traits:
              - type: scaler
                properties:
                  replicas: 2
  workflow:
    mode:
      steps: StepByStep
      subSteps: StepByStep
    steps:
      - name: deploy2default
        type: deploy
        properties:
          policies: ["target-default"]
      - name: deploy2prod
        type: deploy
        properties:
          policies: ["target-prod", "deploy-ha"]
```
:::

根据 Yaml 可知，该 App 对象里包含了以下内容：

- 一个 `webservice` 类型的 `Component`
- 一个 `scaler` 类型的 traits
- 两个 `topology policy` 和一个 `override policy`
- 以及 两个 `workflowstep`

具体效果就是在 `local` 集群 `default` 命名空间部署一个单副本 `express-server` 服务，在 prod 命名空间部署一个两副本的 `express-server` 服务。

> [!IMPORTANT] 提问
> 那么 KubeVela 是怎么处理这个 `Application` 对象的呢？
>
> 我们执行 `kubectl apply` 将这个 app 对象 apply 到集群之后会经过哪些流程呢？

这就是本文分析的内容，从源码入手，分析 KubeVela 是如何处理 `Application` 对象的。

## 大致流程

看源码之前，先给到大家一个大致的流程，后续就按照这个顺序分析。

使用以下命令将一个 app 对象 apply 到集群之后，一般会经过以下流程：

```bash
kubectl apply -f app.yaml
```

首先是 KubeVela 运行的 `vela-core` pod 里面有一个 Application Controller 他会 watch `Application` 对象，我们的 app 对象一创建就会被 watch 到，然后进入 controller 流程。

- 1）首先解析 app 对象，解析为 内部的 `appfile`
    - App 对象是个用户看的，KubeVela 内部使用的是一个叫做 `appfile` 的结构体
    - 这里就会分离 app 里的 `component、policy、workflow` 等结构
- 2）查询 CRD 拿到对应插件里的 `spec.cue.template`
    - 因为 KubeVela 里面的插件也是通过 CRD 形式注册的，因此这里直接通过查询 CRD 拿到插件对象
    - CRD 的名字就是查询的类型
- 3）将 CUE 模板和组件里的参数合并生成 `k8s object`
    - 这部分就是调用的 CUE 的包了
- 4）将 `k8s object` 应用到对应集群里

## 源码分析

看这部内容之前，需要对 KubeVela 有一个大致的认识，比如

- 知道 `Application` 对象 由 `Component、Trait、Policy、Workflow` 等组成
- 知道 KubeVela 中的 `Component` 注册机制

具体代码在`pkg/controller/core.oam.dev/v1beta1/application/application_controller.go` 文件里。

整体分为 3 个大逻辑：

- 1）解析得到 `appFile`
- 2）构建 `applicationStep`
- 3）将资源部署到 k8s 集群

上篇里主要分析第一部分：如何解析 `Application` 对象，得到`appFile`对象。

这部分就是解析我们 apply 到集群的这个 `Application` 对象，将其转换为 KubeVela 内部的一个叫做 `appfile` 的对象。

:::warning 注意
这也是 Controller 中的第一部分逻辑，后续所有逻辑都是对 `appfile` 对象的处理。
:::

Controller 中将 `app` 对象解析为 `appfile` 结构体，大概就是下面这部分代码：

```go
func (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // 1. 获取 app 对象
    app := new(v1beta1.Application)
    if err := r.Get(ctx, client.ObjectKey{
       Name:      req.Name,
       Namespace: req.Namespace,
    }, app); err != nil {
       if !kerrors.IsNotFound(err) {
          logCtx.Error(err, "get application")
       }
       return r.result(client.IgnoreNotFound(err)).ret()
    }

    // 2. 构建一个 parser
    appParser := appfile.NewApplicationParser(r.Client, r.pd)
    handler, err := NewAppHandler(logCtx, r, app)
    if err != nil {
       return r.endWithNegativeCondition(logCtx, app, condition.ReconcileError(err), common.ApplicationStarting)
    }
    endReconcile, result, err := r.handleFinalizers(logCtx, app, handler)
    if err != nil {
       if app.GetDeletionTimestamp() == nil {
          return r.endWithNegativeCondition(logCtx, app, condition.ReconcileError(err), common.ApplicationStarting)
       }
       return result, err
    }
    if endReconcile {
       return result, nil
    }
    // 3. 使用 parser 解析 app 对象，得到 appFile
    appFile, err := appParser.GenerateAppFile(logCtx, app)
    if err != nil {
       r.Recorder.Event(app, event.Warning(velatypes.ReasonFailedParse, err))
       return r.endWithNegativeCondition(logCtx, app, condition.ErrorCondition("Parsed", err), common.ApplicationRendering)
    }
    // 省略
    return result, nil
  }
```

整体流程还是比较简单：

- 首先就是 controller 的标准操作，根据 `name + namespace` 调用 API 拿到 `app` 对象
- 然后就是构建了一个 `parser`，用于解析 `app` 对象
- 接着就是使用 `parser` 对象将 `app` 对象解析成了 `appfile`。

接下来就是分析一下 `parser` 是怎么做解析的。

### 构建 Parser：NewApplicationParser

首先是构建 `appParser` 对象用于解析 `application` 对象。

就这么一句话 `appParser` 对象 就创建好了。

```go
appParser := appfile.NewApplicationParser(r.Client, r.pd)
```

具体如下：

```go
// NewApplicationParser create appfile parser
func NewApplicationParser(cli client.Client, pd *packages.PackageDiscover) *Parser {
    return &Parser{
       client:     cli,
       pd:         pd,
       tmplLoader: LoadTemplate,
    }
}
```

一共三个参数：

- 1）`k8s client`，用于和 k8s 交互
- 2）`packageDiscover`：定义了 CUE 相关的包，由外部传进来，暂时不清楚是具体做什么的 todo
- 3）`tmplLoader`：这里面描述了 `parser` 该怎么和 k8s 交互拿到对应的目标对象

### 生成 AppFile：GenerateAppFile

拿到 `parser` 之后就开始解析 `Application` 了：

```go
appFile, err := appParser.GenerateAppFile(logCtx, app)
if err != nil {
    r.Recorder.Event(app, event.Warning(velatypes.ReasonFailedParse, err))
    return r.endWithNegativeCondition(logCtx, app, condition.ErrorCondition("Parsed", err), common.ApplicationRendering)
}
```

具体如下：

```go
func (p *Parser) GenerateAppFile(ctx context.Context, app *v1beta1.Application) (*Appfile, error) {
    if ctx, ok := ctx.(monitorContext.Context); ok {
       subCtx := ctx.Fork("generate-app-file", monitorContext.DurationMetric(func(v float64) {
          metrics.AppReconcileStageDurationHistogram.WithLabelValues("generate-appfile").Observe(v)
       }))
       defer subCtx.Commit("finish generate appFile")
    }
    if isLatest, appRev, err := p.isLatestPublishVersion(ctx, app); err != nil {
       return nil, err
    } else if isLatest {
       app.Spec = appRev.Spec.Application.Spec
       return p.GenerateAppFileFromRevision(appRev)
    }
    return p.GenerateAppFileFromApp(ctx, app)
}
```

可以看到，KubeVela 会根据情况使用不同的方法来解析：

- `GenerateAppFileFromRevision`
- `GenerateAppFileFromApp`

这是因为 KubeVela 给 `app` 增加了版本的概念，用一个 `app.oam.dev/publishVersion` 的 `annotation` 来处理，只有当用户手动修改了这个 `annotation` 之后，新的 `app` 对象才会生效，否则会一直使用旧版本。

:::warning 注意
也就是说只有第一次会直接解析 `app` 对象本身，后续都会先判断 `revision` 是否变化。

KubeVela 使用 `ApplicationRevision` CRD 对象来存储旧版本
:::

这里我们先不管 `GenerateAppFileFromRevision`，直接看 `GenerateAppFileFromApp` 就像，整体逻辑是差不多的。

具体如下：

```go
// GenerateAppFileFromApp converts an application to an Appfile
func (p *Parser) GenerateAppFileFromApp(ctx context.Context, app *v1beta1.Application) (*Appfile, error) {

    // 给 Policy 设置默认名字
    for idx := range app.Spec.Policies {
       if app.Spec.Policies[idx].Name == "" {
          app.Spec.Policies[idx].Name = fmt.Sprintf("%s:auto-gen:%d", app.Spec.Policies[idx].Type, idx)
       }
    }
    
    // 初始化一个 appFile 结构体，内部主要是一些初始化操作
    appFile := newAppFile(app)
    if app.Status.LatestRevision != nil {
       appFile.AppRevisionName = app.Status.LatestRevision.Name
    }

    // 核心逻辑，使用不同方法分别解析不同的类型的数据
    var err error
    if err = p.parseComponents(ctx, appFile); err != nil {
       return nil, errors.Wrap(err, "failed to parseComponents")
    }
    if err = p.parseWorkflowSteps(ctx, appFile); err != nil {
       return nil, errors.Wrap(err, "failed to parseWorkflowSteps")
    }
    if err = p.parsePolicies(ctx, appFile); err != nil {
       return nil, errors.Wrap(err, "failed to parsePolicies")
    }
    if err = p.parseReferredObjects(ctx, appFile); err != nil {
       return nil, errors.Wrap(err, "failed to parseReferredObjects")
    }

    return appFile, nil
}
```

通过 `newAppFile` 方法拿到了一个 `appFile` 结构体，该方法内部没有太多逻辑，主要是对 `map` 做一些 `make` 操作，防止后续 `panic`。

另外分别有 4 个方法来解析不同的组件，这是核心逻辑：

- `parseComponents`
- `parseWorkflowSteps`：这里会生成一些默认的 step，如果 `app` 里面没有定义指定的话
    - 即：没指定 Workflow 也会自动生成，用于执行部署操作
- `parsePolicies`
- `parseReferredObjects`
没有单独的 `parseTraits` 是因为 `Traits` 和 `Component` 是一起处理的，都在 `parseComponents` 里。

#### 解析 Component：parseComponents

KubeVela 中对于 component 的解析逻辑大致是这样的：

- 1）从 k8s 集群里加载对应的 `XDefinition` 对象，从该对象中拿到 CUE 模版
- 2）然后从 `app` 的 `component` 中拿到参数
- 3）最后将参数填充到模版里就得到最终的 k8s object 对象了。

向终端用户屏蔽底层的复杂度，用户只需要提供少量数据，经过插件处理后即可生成完整信息。

就像这样：

![图片](https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/kubevela-xdefinition-usage.png)

这里就使用 `parseComponents` 来分析具体的解析逻辑，其他几个都是类似的：

```go
// parseComponents resolve an Application Components and Traits to generate Component
func (p *Parser) parseComponents(ctx context.Context, af *Appfile) error {
    var comps []*Component
    for _, c := range af.app.Spec.Components {
       comp, err := p.parseComponent(ctx, c)
       if err != nil {
          return err
       }
       comps = append(comps, comp)
    }

    af.ParsedComponents = comps
    af.Components = af.app.Spec.Components
    setComponentDefinitions(af, comps)

    return nil
}
```

`parseComponents` 里面又调用了 `parseComponent` 组件，继续追踪：

```go
func (p *Parser) parseComponent(ctx context.Context, comp common.ApplicationComponent) (*Component, error) {
    // 解析 component
    workload, err := p.makeComponent(ctx, comp.Name, comp.Type, types.TypeComponentDefinition, comp.Properties)
    if err != nil {
       return nil, err
    }
    // 解析 traits
    if err = p.parseTraits(ctx, workload, comp); err != nil {
       return nil, err
    }
    return workload, nil
}
```

解析 `component` 和 `traits` 流程都是一样的，这里就只展示一个了，继续追踪 `makeComponent` 方法：

```go
func (p *Parser) makeComponent(ctx context.Context, name, typ string, capType types.CapType, props *runtime.RawExtension) (*Component, error) {
    templ, err := p.tmplLoader.LoadTemplate(ctx, p.client, typ, capType)
    if err != nil {
       return nil, errors.WithMessagef(err, "fetch component/policy type of %s", name)
    }
    return p.convertTemplate2Component(name, typ, props, templ)
}
```

Ok,已经到核心方法了，`p.tmplLoader.LoadTemplate(ctx, p.client, typ, capType)` 这里就是核心方法，

```go
func (fn TemplateLoaderFn) LoadTemplate(ctx context.Context, c client.Client, capName string, capType types.CapType) (*Template, error) {
    return fn(ctx, c, capName, capType)
}
```

我们的 `tmplLoader` 实际上是一个 `func` 类型，这里就是在调用自己，回过头去，我们前面创建 `appParser` 的时候给这个 `tmplLoader` 赋值了，这里就是用的那个

```go
// NewApplicationParser create appfile parser
func NewApplicationParser(cli client.Client, pd *packages.PackageDiscover) *Parser {
    return &Parser{
       client:     cli,
       pd:         pd,
       tmplLoader: LoadTemplate,
    }
}
```

那么核心的解析逻辑就是在 `LoadTemplate` 这个方法里面，简化后的代码如下：

```go
func LoadTemplate(ctx context.Context, cli client.Client, capName string, capType types.CapType) (*Template, error) {
    ctx = multicluster.WithCluster(ctx, multicluster.Local)
    switch capType {
    case types.TypeComponentDefinition, types.TypeWorkload:
    case types.TypeTrait:
    case types.TypePolicy:
    case types.TypeWorkflowStep:
    }
    return nil, fmt.Errorf("kind(%s) of %s not supported", capType, capName)
}
```

可以看到，这个方法里根据组件类型，走了不同逻辑去解析，这里我们需要追踪的是 `component` 的解析，因此就关注第一个 `case`，

```go
func LoadTemplate(ctx context.Context, cli client.Client, capName string, capType types.CapType) (*Template, error) {
    ctx = multicluster.WithCluster(ctx, multicluster.Local)
    // Application Controller only loads template from ComponentDefinition and TraitDefinition
    switch capType {
    case types.TypeComponentDefinition, types.TypeWorkload:
       // 根据名字去查询 ComponentDefinition 对象，也就是在 k8s 里面查询 CRD 对象
       cd := new(v1beta1.ComponentDefinition)
       err := oamutil.GetCapabilityDefinition(ctx, cli, cd, capName)
       if err !=nil {
        // 省略...
       }
       // 然后使用这个 CRD 对象构建出一个模版
       tmpl, err := newTemplateOfCompDefinition(cd)
       if err != nil {
          return nil, err
       }
       return tmpl, nil
 }
```

`GetCapabilityDefinition` 就不细讲了，就是使用 k8s client 从集群里查询 CRD，具体如下：

```go
func GetDefinition(ctx context.Context, cli client.Reader, definition client.Object, definitionName string) error {
    appNs := GetDefinitionNamespaceWithCtx(ctx)
    // 首先在 app 所在 namespace 查询
    if err := cli.Get(ctx, types.NamespacedName{Name: definitionName, Namespace: appNs}, definition); err != nil {
       if !apierrors.IsNotFound(err) {
          return err
       }
      // 没有的话再去 系统 namespace 下查询
       for _, ns := range []string{GetXDefinitionNamespaceWithCtx(ctx), oam.SystemDefinitionNamespace} {
          err = GetDefinitionFromNamespace(ctx, cli, definition, definitionName, ns)
          if !apierrors.IsNotFound(err) {
             return err
          }
       }
       return err
    }
    return nil
}
```

这里贴一个 `ComponentDefinition` 对象，看起来就比较清晰了,下面这个 `raw` 应该就是最简单的了：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  annotations:
    definition.oam.dev/description: Raw allow users to specify raw K8s object in properties.
      This definition is DEPRECATED, please use 'k8s-objects' instead.
    meta.helm.sh/release-name: kubevela
    meta.helm.sh/release-namespace: vela-system
  name: raw
  namespace: vela-system
spec:
  schematic:
    cue:
      template: |
        output: parameter
        parameter: {}        
  workload:
    type: autodetects.core.oam.dev
```

其中核心就是 `spec.schematic.cue.template`,这里面就是 CUE 语法写的模版，这部分逻辑的核心就是拿这个模板文件。

然后再回到 `makeComponent` 方法：

```go
func (p *Parser) makeComponent(ctx context.Context, name, typ string, capType types.CapType, props *runtime.RawExtension) (*Component, error) {
    templ, err := p.tmplLoader.LoadTemplate(ctx, p.client, typ, capType)
    if err != nil {
       return nil, errors.WithMessagef(err, "fetch component/policy type of %s", name)
    }
    return p.convertTemplate2Component(name, typ, props, templ)
}
```

拿到模版后进入 `convertTemplate2Component` 方法，这里就是将参数和模板进行组合：

```go
func (p *Parser) convertTemplate2Component(name, typ string, props *runtime.RawExtension, templ *Template) (*Component, error) {
    // 这里面的 props 是一个 json 格式数据，就是 app 里面定义的一些参数，
    // 因为 CUE 模板需要接收参数，所以从 app 里解析出来并传递给模板
    settings, err := util.RawExtension2Map(props)
    if err != nil {
       return nil, errors.WithMessagef(err, "fail to parse settings for %s", name)
    }
    cpType, err := util.ConvertDefinitionRevName(typ)
    if err != nil {
       cpType = typ
    }
    return &Component{
       Traits:             []*Trait{},
       Name:               name,
       Type:               cpType,
       CapabilityCategory: templ.CapabilityCategory,
       FullTemplate:       templ,
       Params:             settings,
       engine:             definition.NewWorkloadAbstractEngine(name, p.pd),
    }, nil
}
```

最终会通过 `component.engine` 这个解析引擎来组合参数和 CUE 模板，这个 engine 实际是一个接口：

```go
type AbstractEngine interface {
    Complete(ctx process.Context, abstractTemplate string, params interface{}) error
    HealthCheck(templateContext map[string]interface{}, healthPolicyTemplate string, parameter interface{}) (bool, error)
    Status(templateContext map[string]interface{}, customStatusTemplate string, parameter interface{}) (string, error)
    GetTemplateContext(ctx process.Context, cli client.Client, accessor util.NamespaceAccessor) (map[string]interface{}, error)
}
```

其中的 `Complete` 方法就是组合参数和模版的，解析工作比较繁琐，主要就是在调 CUE 的包，这里就不展示了，最终 `Complete` 完成后就得到了 yaml 内容，一般都是 `k8s object` 对象。

:::warning 注意
具体是个什么 `k8s object` 就看插件里面模版怎么定义的了
:::

小结：根据组件类型，去 k8s 集群中查询 `ComponentDefinition` 对象，拿到组件定义中的 CUE 模板，然后使用 CUE engine 将模板以及从 `Application` 对象中解析到的参数进行组合，得到最终的结果。

#### 解析工作流步骤：parseWorkflowSteps

由于 `Workflow` 比较特殊逻辑，KubeVela 中应用的部署依赖于 `Workflow`，因此如果用户创建 `Application` 对象时未指定 `Workflow` 那么这个 `Application` 对象就不会被部署起来，那前面的这些逻辑都没有任何意义了。

因此 KubeVela 在这部分添加了一些自定义逻辑，用于生成默认的 `Workflow`，以保证 `Application` 对象能够正常部署。

所以我们也单独分析一下，就是前面提到的 `parseWorkflowSteps` 方法：

```go
func (p *Parser) parseWorkflowSteps(ctx context.Context, af *Appfile) error {
    if err := p.loadWorkflowToAppfile(ctx, af); err != nil {
       return err
    }
    for _, workflowStep := range af.WorkflowSteps {
       err := p.fetchAndSetWorkflowStepDefinition(ctx, af, workflowStep.Type)
       if err != nil {
          return err
       }

       if workflowStep.SubSteps != nil {
          for _, workflowSubStep := range workflowStep.SubSteps {
             err := p.fetchAndSetWorkflowStepDefinition(ctx, af, workflowSubStep.Type)
             if err != nil {
                return err
             }
          }
       }
    }
    return nil
}
```

继续追踪 `loadWorkflowToAppfile` 方法
```go
func (p *Parser) loadWorkflowToAppfile(ctx context.Context, af *Appfile) error {
    var err error
    // parse workflow steps
    af.WorkflowMode = &workflowv1alpha1.WorkflowExecuteMode{
       Steps:    workflowv1alpha1.WorkflowModeDAG,
       SubSteps: workflowv1alpha1.WorkflowModeDAG,
    }
    // 如果用户手动指定了 Workflow 这里就解析一下
    if wfSpec := af.app.Spec.Workflow; wfSpec != nil {
       app := af.app
       mode := wfSpec.Mode
       // 根据 ref 中填的 name 找到对应 Workflow 
       if wfSpec.Ref != "" && mode == nil {
          wf := &workflowv1alpha1.Workflow{}
          if err := af.WorkflowClient(p.client).Get(ctx, ktypes.NamespacedName{Namespace: af.app.Namespace, Name: app.Spec.Workflow.Ref}, wf); err != nil {
             return err
          }
          mode = wf.Mode
       }
       af.WorkflowSteps = wfSpec.Steps
       af.WorkflowMode.Steps = workflowv1alpha1.WorkflowModeStep
       if mode != nil {
          if mode.Steps != "" {
             af.WorkflowMode.Steps = mode.Steps
          }
          if mode.SubSteps != "" {
             af.WorkflowMode.SubSteps = mode.SubSteps
          }
       }
    }
    // 然后开始生成 Workflow
    af.WorkflowSteps, err = step.NewChainWorkflowStepGenerator(
       &step.RefWorkflowStepGenerator{Client: af.WorkflowClient(p.client), Context: ctx},
       &step.DeployWorkflowStepGenerator{},
       &step.Deploy2EnvWorkflowStepGenerator{},
       &step.ApplyComponentWorkflowStepGenerator{},
    ).Generate(af.app, af.WorkflowSteps)
    return err
}
```

核心是下面这一部分
```go
af.WorkflowSteps, err = step.NewChainWorkflowStepGenerator(
    &step.RefWorkflowStepGenerator{Client: af.WorkflowClient(p.client), Context: ctx},
    &step.DeployWorkflowStepGenerator{},
    &step.Deploy2EnvWorkflowStepGenerator{},
    &step.ApplyComponentWorkflowStepGenerator{},
).Generate(af.app, af.WorkflowSteps)
```

通过 `chain` 形式，按顺序执行多个 `generator`，直到其中某一个步骤生成 `Workflow` 为止：

- `RefWorkflowStepGenerator`： KubeVela 中支持引用集群中已经创建好的 `Workflow`，这里则是在处理这部分逻辑，根据 `ref` 字段名找到对应的 `Workflow`。
- `DeployWorkflowStepGenerator`：根据 `topology` 类型的 `policy` 来生成 `Workflow`
- `Deploy2EnvWorkflowStepGenerator`：部署到指定环境，这个应该是和 VelaUX 配合使用的，暂时忽略
- `ApplyComponentWorkflowStepGenerator`：如果前面几个步骤都没有成功生成才会执行这部分逻辑，生成一个 `apply-component` 类型的 `WorkflowStep`，直接将组件部署到 `local` 集群的 `default` 命名空间。

以上 3 个 Generateor 按照层级分可以这样

- `RefWorkflowStepGenerator`：正常逻辑，只是解析了用户指定的 `RefWorkflow`
- `DeployWorkflowStepGenerator`：优化逻辑，自动根据 `topology policy` 生成 `Workflow`
- `ApplyComponentWorkflowStepGenerator`：兜底逻辑，就算没有任何 `Workflow` 以及 `topology` 类型的 `policy` 都能生成一个 `apply-component` 类型的 `WorkflowStep` 保证 `Component` 正常部署
也就是说，在最极限的情况下，`Application` 对象里我们可以只写 `Component`，就能保证正常运行。

:::warning 注意：
如果我们手动指定了一个 `WorkflowStep` 就会导致所有默认逻辑被会忽略，因为他们都有下面这个判断
```go
if len(existingSteps) > 0 {
    return existingSteps, nil
}
```
:::

#### DeployWorkflowStepGenerator

这里看一下 `DeployWorkflowStepGenerator` 是怎么根据 `topology policy` 生成 `Workflow` 的，具体实现如下：

```go
func (g *DeployWorkflowStepGenerator) Generate(app *v1beta1.Application, existingSteps []workflowv1alpha1.WorkflowStep) (steps []workflowv1alpha1.WorkflowStep, err error) {
    // 如果上一步生成了 step 这里直接返回
    if len(existingSteps) > 0 {
       return existingSteps, nil
    }
    // 然后根据 topology 策略生成 step
    var topologies []string
    var overrides []string
    for _, policy := range app.Spec.Policies {
       switch policy.Type {
       case v1alpha1.TopologyPolicyType:
          topologies = append(topologies, policy.Name)
       case v1alpha1.OverridePolicyType:
          overrides = append(overrides, policy.Name)
       }
    }
    for _, topology := range topologies {
       steps = append(steps, workflowv1alpha1.WorkflowStep{
          WorkflowStepBase: workflowv1alpha1.WorkflowStepBase{
             Name: "deploy-" + topology,
             Type: "deploy",
             Properties: util.Object2RawExtension(map[string]interface{}{
                "policies": append(overrides, topology),
             }),
          },
       })
    }
    // 特殊处理一下带 refObjets 组件的
    if len(topologies) == 0 {
       containsRefObjects := false
       for _, comp := range app.Spec.Components {
          if comp.Type == v1alpha1.RefObjectsComponentType {
             containsRefObjects = true
             break
          }
       }
       if containsRefObjects || len(overrides) > 0 {
          steps = append(steps, workflowv1alpha1.WorkflowStep{
             WorkflowStepBase: workflowv1alpha1.WorkflowStepBase{
                Name:       "deploy",
                Type:       DeployWorkflowStep,
                Properties: util.Object2RawExtension(map[string]interface{}{"policies": append([]string{}, overrides...)}),
             },
          })
       }
    }
    return steps, nil
}
```

具体逻辑：为每个 `topology policy` 生成一个 `step`，每个 `step` 中除了关联当前 `topology` 之外，还关联了全部的 `override policy`。

核心代码如下：

```go
    var topologies []string
    var overrides []string
    for _, policy := range app.Spec.Policies {
       switch policy.Type {
       case v1alpha1.TopologyPolicyType:
          topologies = append(topologies, policy.Name)
       case v1alpha1.OverridePolicyType:
          overrides = append(overrides, policy.Name)
       }
    }
    // 为每个 topology 策略生成一个步骤
    for _, topology := range topologies {
       steps = append(steps, workflowv1alpha1.WorkflowStep{
          WorkflowStepBase: workflowv1alpha1.WorkflowStepBase{
             Name: "deploy-" + topology,
             Type: "deploy",
             Properties: util.Object2RawExtension(map[string]interface{}{
                "policies": append(overrides, topology),
             }),
          },
       })
    }
```
#### ApplyComponentWorkflowStepGenerator

最后则是兜底逻辑的 `ApplyComponentWorkflowStepGenerator`，到这里如果前面几个 `Generateor` 都没有生成 `WorkflowStep` 那么就直接为每个 `Component` 生成一个`apply-component`类型的步骤，保证 `Component` 能够被部署出去。

> [!IMPORTANT]
> `apply-component` 类型的 `step` 用于实现一个 `component` 组件的部署，默认会部署到 `local` 集群的 `default` 命名空间（这个部署位置由第三部分逻辑指定的）。

```go
func (g *ApplyComponentWorkflowStepGenerator) Generate(app *v1beta1.Application, existingSteps []workflowv1alpha1.WorkflowStep) (steps []workflowv1alpha1.WorkflowStep, err error) {
    if len(existingSteps) > 0 {
       return existingSteps, nil
    }
    for _, comp := range app.Spec.Components {
       steps = append(steps, workflowv1alpha1.WorkflowStep{
          WorkflowStepBase: workflowv1alpha1.WorkflowStepBase{
             Name: comp.Name,
             Type: wftypes.WorkflowStepTypeApplyComponent,
             Properties: util.Object2RawExtension(map[string]string{
                "component": comp.Name,
             }),
          },
       })
    }
    return
}
```

#### Demo

这里准备了两个 `Application` 对象，大家可以用来测试一下这个逻辑。

首先是一个最简单的 app，只有 `component`，按照之前的分析，会走兜底逻辑，最终会被部署到 `local` 集群的 `default` 命名空间。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: simple-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
            expose: true
```
然后是一个带 `topology policy`的 app，按之前分析，会根据 `topology` 生成 `step`，因此会被部署到 `local` 集群的 `default` 和 `prod` 两个命名空间，同时生成的步骤会带上所有 `override policy`，因此，两个命名空间下都是两副本。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: simple-app-policy
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
            expose: true
  policies:
    - name: target-default
      type: topology
      properties:
        # local 集群即 Kubevela 所在的集群
        clusters: ["local"]
        namespace: "default"
    - name: target-prod
      type: topology
      properties:
        clusters: ["local"]
        # 此命名空间需要在应用部署前完成创建
        namespace: "prod"
    - name: deploy-ha
      type: override
      properties:
        components:
          - type: webservice
            traits:
              - type: scaler
                properties:
                  replicas: 2
```

另外的解析就不在一一分析了，都是类似的逻辑。

至此，我们就成功从 `Application` 对象中解析得到 `appFile` 对象了，这一部分逻辑到此结束。

### 分支逻辑：AppRevision

拿到 `appFile` 之后，有一些 `AppRevision` 相关的逻辑，前面说了 KubeVela 中的 app 是有版本控制的，因此这里会将 `appFile` 保存一下。

相关代码如下：

```go
appFile, err := appParser.GenerateAppFile(logCtx, app)

// 处理 AppRevision
if err := handler.PrepareCurrentAppRevision(logCtx, appFile); err != nil {}
if err := handler.FinalizeAndApplyAppRevision(logCtx); err != nil {}

if err := handler.UpdateAppLatestRevisionStatus(logCtx, r.patchStatus); err != nil {}
```

主要就是维护 `AppRevision` 对象，然后在 app 对象上打一些 `label` 来进行关联，不是主线逻辑就不深入分析了。

## 小结

至此，`appFile` 对象就拿到了，上篇分析就结束了。

主要分为两块：

- 1）解析 `component`：从 k8s 集群里加载对应的 `XDefinition` 对象，从该对象中拿到 CUE 模版，然后从 app 的 `component` 中拿到参数，然后将参数填充到模版里就得到最终的 `k8s object` 对象了。
- 2）解析 `WorkflowStep`：这部分其实比较简单，不过由于又优化逻辑和兜底逻辑存在，导致没有严格按照 `application` 对象生成 `step`，因此使用的时候会比较迷惑。
下篇会分析拿到 `appFile` 对象后，怎么生成 `ApplicationStep` 将这些 `k8s object` 对象部署出去的，以及过程中是如何处理这些 `policy` 的。