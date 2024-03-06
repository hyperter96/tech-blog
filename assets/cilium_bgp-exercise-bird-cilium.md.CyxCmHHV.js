import{j as s,b as i,c as a,X as n}from"./chunks/framework.CrmOCDlt.js";const g=JSON.parse('{"title":"Cilium系列一：使用bird和cilium部署BGP模式的k8s集群","description":"","frontmatter":{"top":1,"tag":["Cilium","网络","cni"],"recommend":1,"sticky":1},"headers":[],"relativePath":"cilium/bgp-exercise-bird-cilium.md","filePath":"cilium/bgp-exercise-bird-cilium.md","lastUpdated":1709744263000}'),l={name:"cilium/bgp-exercise-bird-cilium.md"},e=n(`<h1 id="cilium系列一-使用bird和cilium部署bgp模式的k8s集群" tabindex="-1">Cilium系列一：使用bird和cilium部署BGP模式的k8s集群 <a class="header-anchor" href="#cilium系列一-使用bird和cilium部署bgp模式的k8s集群" aria-label="Permalink to &quot;Cilium系列一：使用bird和cilium部署BGP模式的k8s集群&quot;">​</a></h1><p>这是使用 Cilium BGP 控制平面 (BGP CP) 向外部 BGP 路由器通告路由以及在两个集群之间路由的演示。 每个集群执行以下操作：</p><ol><li>运行 2 个作为部署进行管理的 nginx pod。</li><li>将 nginx pod 作为服务公开。</li><li>使用 Cilium IP 池将外部 IP 分配给服务。</li><li>使用 BGP CP 通告 nginx 服务。</li></ol><p><img src="https://cdn.jsdelivr.net/gh/hyperter96/hyperter96.github.io/img/cilium-bgp-demo.svg" alt=""></p><h2 id="前置条件" tabindex="-1">前置条件 <a class="header-anchor" href="#前置条件" aria-label="Permalink to &quot;前置条件&quot;">​</a></h2><ol><li><code>kubectl</code></li><li><code>helm</code></li><li><code>kind</code></li><li><code>cilium-cli</code></li></ol><h2 id="安装集群" tabindex="-1">安装集群 <a class="header-anchor" href="#安装集群" aria-label="Permalink to &quot;安装集群&quot;">​</a></h2><p>使用<code>kind</code>安装第一个集群，</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> kind create cluster --config - </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;&lt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">EOF</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">kind: Cluster</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">apiVersion: kind.x-k8s.io/v1alpha4</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">networking:</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">  disableDefaultCNI: true   # do not install kindnet</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">  kubeProxyMode: none       # do not run kube-proxy</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">  podSubnet: &quot;10.241.0.0/16&quot;</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">  serviceSubnet: &quot;10.11.0.0/16&quot;</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">name: cilium</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">nodes:</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">- role: control-plane</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">- role: worker</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">- role: worker</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">EOF</span></span></code></pre></div><p>注意：使用两个工作节点，因此 nginx 部署中的每个 pod 都被安排到一个单独的节点。</p><p>创建用于第二个集群的 Docker 网络：</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">docker</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> network create -d=bridge </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\\</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    -o</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;com.docker.network.bridge.enable_ip_masquerade=true&quot;</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> \\</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    --attachable</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> \\</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">    &quot;kind2&quot;</span></span></code></pre></div><p>设置 <code>KIND_EXPERIMENTAL_DOCKER_NETWORK</code> 环境变量，让 <code>kind</code> 使用此网络而不是默认的 <code>kind</code> 网络：</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">export</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> KIND_EXPERIMENTAL_DOCKER_NETWORK</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">kind2</span></span></code></pre></div><p>创建第二个集群，</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">$</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> kind create cluster --config - </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;&lt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">EOF</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">kind: Cluster</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">apiVersion: kind.x-k8s.io/v1alpha4</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">networking:</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">  disableDefaultCNI: true   # do not install kindnet</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">  kubeProxyMode: none       # do not run kube-proxy</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">  podSubnet: &quot;10.242.0.0/16&quot;</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">  serviceSubnet: &quot;10.12.0.0/16&quot;</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">name: cilium2</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">nodes:</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">- role: control-plane</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">- role: worker</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">- role: worker</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">EOF</span></span></code></pre></div><p>删除环境变量，以便将来的集群安装使用默认类型的 Docker 网络。</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">unset</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> KIND_EXPERIMENTAL_DOCKER_NETWORK</span></span></code></pre></div><p>您现在有两个不同网络的 k8s 集群，且暂时无法相互通信。</p>`,19),p=[e];function t(h,k,d,r,o,c){return i(),a("div",null,p)}const u=s(l,[["render",t]]);export{g as __pageData,u as default};
