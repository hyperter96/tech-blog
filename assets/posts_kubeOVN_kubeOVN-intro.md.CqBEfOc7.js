import{j as e,c as o,b as c,aa as d}from"./chunks/framework.Cst8pIsI.js";const k=JSON.parse('{"title":"KubeOVN系列一：KubeOVN架构体系","description":"","frontmatter":{"sidebar":false,"date":"2023-12-11T00:00:00.000Z","tag":["KubeOVN","网络","cni","SDN","kubernetes"],"sticky":1,"next":{"text":"KubeOVN系列二：配置VPC网关连通外部公网","link":"/posts/kubeOVN/vpc-nat-gateway-config"},"head":[]},"headers":[],"relativePath":"posts/kubeOVN/kubeOVN-intro.md","filePath":"posts/kubeOVN/kubeOVN-intro.md","lastUpdated":1738671020000}'),n={name:"posts/kubeOVN/kubeOVN-intro.md"},a=d('<h1 id="kubeovn系列一-kubeovn架构体系" tabindex="-1">KubeOVN系列一：KubeOVN架构体系 <a class="header-anchor" href="#kubeovn系列一-kubeovn架构体系" aria-label="Permalink to &quot;KubeOVN系列一：KubeOVN架构体系&quot;">​</a></h1><p>总体来看，Kube-OVN 作为 Kubernetes 和 OVN 之间的一个桥梁，将成熟的 SDN 和云原生相结合。 这意味着 Kube-OVN 不仅通过 OVN 实现了 Kubernetes 下的网络规范，例如 <code>CNI</code>，<code>Service</code> 和 <code>Networkpolicy</code>，还将大量的 SDN 领域能力带入云原生，例如逻辑交换机，逻辑路由器，VPC，网关，QoS，ACL 和流量镜像。</p><p>同时 Kube-OVN 还保持了良好的开放性可以和诸多技术方案集成，例如 <code>Cilium，Submariner，Prometheus，KubeVirt</code> 等等。</p><p>组件介绍¶ Kube-OVN 的组件可以大致分为三类：</p><ul><li>上游 OVN/OVS 组件。</li><li>核心控制器和 Agent。</li><li>监控，运维工具和扩展组件。</li></ul><p><img src="https://kubeovn.github.io/docs/v1.12.x/static/architecture.png" alt="" loading="lazy"></p><h2 id="上游-ovn-ovs-组件" tabindex="-1">上游 OVN/OVS 组件 <a class="header-anchor" href="#上游-ovn-ovs-组件" aria-label="Permalink to &quot;上游 OVN/OVS 组件&quot;">​</a></h2><p>该类型组件来自 OVN/OVS 社区，并针对 Kube-OVN 的使用场景做了特定修改。 OVN/OVS 本身是一套成熟的管理虚机和容器的 SDN 系统，我们强烈建议 对 Kube-OVN 实现感兴趣的用户先去读一下 ovn-architecture(7) 来了解什么是 OVN 以及 如何和它进行集成。Kube-OVN 使用 OVN 的北向接口创建和调整虚拟网络，并将其中的网络概念映射到 Kubernetes 之内。</p><p>所有 OVN/OVS 相关组件都已打包成对应镜像，并可在 Kubernetes 中运行。</p><h3 id="ovn-central" tabindex="-1"><code>ovn-central</code> <a class="header-anchor" href="#ovn-central" aria-label="Permalink to &quot;`ovn-central`&quot;">​</a></h3><p><code>ovn-central Deployment</code> 运行 OVN 的管理平面组件，包括 <code>ovn-nb</code>, <code>ovn-sb</code>, 和 <code>ovn-northd</code>。</p><ul><li><code>ovn-nb</code>： 保存虚拟网络配置，并提供 API 进行虚拟网络管理。<code>kube-ovn-controller</code> 将会主要和 <code>ovn-nb</code> 进行交互配置虚拟网络。</li><li><code>ovn-sb</code>： 保存从 <code>ovn-nb</code> 的逻辑网络生成的逻辑流表，以及各个节点的实际物理网络状态。</li><li><code>ovn-northd</code>：将 <code>ovn-nb</code> 的虚拟网络翻译成 <code>ovn-sb</code> 中的逻辑流表。 多个 <code>ovn-central</code> 实例会通过 <code>Raft</code> 协议同步数据保证高可用。</li></ul><h3 id="ovs-ovn" tabindex="-1"><code>ovs-ovn</code> <a class="header-anchor" href="#ovs-ovn" aria-label="Permalink to &quot;`ovs-ovn`&quot;">​</a></h3><p><code>ovs-ovn</code> 以 <code>DaemonSet</code> 形式运行在每个节点，在 Pod 内运行了 <code>openvswitch</code>, <code>ovsdb</code>, 和 <code>ovn-controller</code>。这些组件作为 <code>ovn-central</code> 的 <code>Agent</code> 将逻辑流表翻译成真实的网络配置。</p><h2 id="核心控制器和-agent" tabindex="-1">核心控制器和 Agent <a class="header-anchor" href="#核心控制器和-agent" aria-label="Permalink to &quot;核心控制器和 Agent&quot;">​</a></h2><p>该部分为 Kube-OVN 的核心组件，作为 OVN 和 Kubernetes 之间的一个桥梁，将两个系统打通并将网络概念进行相互转换。 大部分的核心功能都在该部分组件中实现。</p><h3 id="kube-ovn-controller" tabindex="-1"><code>kube-ovn-controller</code> <a class="header-anchor" href="#kube-ovn-controller" aria-label="Permalink to &quot;`kube-ovn-controller`&quot;">​</a></h3><p>该组件为一个 <code>Deployment</code> 执行所有 Kubernetes 内资源到 OVN 资源的翻译工作，其作用相当于整个 Kube-OVN 系统的控制平面。 <code>kube-ovn-controller</code> 监听了所有和网络功能相关资源的事件，并根据资源变化情况更新 OVN 内的逻辑网络。主要监听的资源包括： <code>Pod</code>，<code>Service</code>，<code>Endpoint</code>，<code>Node</code>，<code>NetworkPolicy</code>，<code>VPC</code>，<code>Subnet</code>，<code>Vlan</code>，<code>ProviderNetwork</code>。</p><p>以 <code>Pod</code> 事件为例， <code>kube-ovn-controller</code> 监听到 <code>Pod</code> 创建事件后，通过内置的内存 IPAM 功能分配地址，并调用 <code>ovn-central</code> 创建 逻辑端口，静态路由和可能的 ACL 规则。接下来 kube-ovn-controller 将分配到的地址，和子网信息例如 CIDR，网关，路由等信息写会到 <code>Pod</code> 的 <code>annotation</code> 中。该 <code>annotation</code> 后续会被 <code>kube-ovn-cni</code> 读取用来配置本地网络。</p><h3 id="kube-ovn-cni" tabindex="-1"><code>kube-ovn-cni</code> <a class="header-anchor" href="#kube-ovn-cni" aria-label="Permalink to &quot;`kube-ovn-cni`&quot;">​</a></h3><p>该组件为一个 <code>DaemonSet</code> 运行在每个节点上，实现 CNI 接口，并操作本地的 <code>OVS</code> 配置单机网络。</p><p>该 <code>DaemonSet</code> 会复制 kube-ovn 二进制文件到每台机器，作为 <code>kubelet</code> 和 <code>kube-ovn-cni</code> 之间的交互工具，将相应 CNI 请求 发送给 <code>kube-ovn-cni</code> 执行。该二进制文件默认会被复制到 <code>/opt/cni/bin</code> 目录下。</p><p><code>kube-ovn-cni</code> 会配置具体的网络来执行相应流量操作，主要工作包括：</p><ol><li>配置 <code>ovn-controller</code> 和 <code>vswitchd</code>。</li><li>处理 <code>CNI add/del</code> 请求： <ol><li>创建删除 <code>veth</code> 并和 OVS 端口绑定。</li><li>配置 OVS 端口信息。</li><li>更新宿主机的 <code>iptables/ipset/route</code> 等规则。</li><li>动态更新容器 QoS.</li><li>创建并配置 <code>ovn0</code> 网卡联通容器网络和主机网络。</li><li>配置主机网卡来实现 Vlan/Underlay/EIP 等功能。</li><li>动态配置集群互联网关。</li></ol></li></ol><h2 id="监控-运维工具和扩展组件" tabindex="-1">监控，运维工具和扩展组件 <a class="header-anchor" href="#监控-运维工具和扩展组件" aria-label="Permalink to &quot;监控，运维工具和扩展组件&quot;">​</a></h2><p>该部分组件主要提供监控，诊断，运维操作以及和外部进行对接，对 Kube-OVN 的核心网络能力进行扩展，并简化日常运维操作。</p><h3 id="kube-ovn-speaker" tabindex="-1"><code>kube-ovn-speaker</code> <a class="header-anchor" href="#kube-ovn-speaker" aria-label="Permalink to &quot;`kube-ovn-speaker`&quot;">​</a></h3><p>该组件为一个 <code>DaemonSet</code> 运行在特定标签的节点上，对外发布容器网络的路由，使得外部可以直接通过 Pod IP 访问容器。</p><p>更多相关使用方式请参考 BGP 支持。</p><h3 id="kube-ovn-pinger" tabindex="-1"><code>kube-ovn-pinger</code> <a class="header-anchor" href="#kube-ovn-pinger" aria-label="Permalink to &quot;`kube-ovn-pinger`&quot;">​</a></h3><p>该组件为一个 <code>DaemonSet</code> 运行在每个节点上收集 OVS 运行信息，节点网络质量，网络延迟等信息，收集的监控指标可参考 <a href="https://kubeovn.github.io/docs/v1.12.x/reference/metrics/" target="_blank" rel="noreferrer">Kube-OVN 监控指标</a>。</p><h3 id="kube-ovn-monitor" tabindex="-1"><code>kube-ovn-monitor</code> <a class="header-anchor" href="#kube-ovn-monitor" aria-label="Permalink to &quot;`kube-ovn-monitor`&quot;">​</a></h3><p>该组件为一个 <code>Deployment</code> 收集 OVN 的运行信息，收集的监控指标可参考 Kube-OVN 监控指标。</p><h3 id="kubectl-ko" tabindex="-1"><code>kubectl-ko</code> <a class="header-anchor" href="#kubectl-ko" aria-label="Permalink to &quot;`kubectl-ko`&quot;">​</a></h3><p>该组件为 <code>kubectl</code> 插件，可以快速运行常见运维操作，更多使用请参考 <code>kubectl</code> 插件使用。</p>',35),t=[a];function r(l,i,b,u,s,v){return c(),o("div",null,t)}const p=e(n,[["render",r]]);export{k as __pageData,p as default};
