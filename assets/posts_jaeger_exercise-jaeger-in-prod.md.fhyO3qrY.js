import{j as e,b as d,c as t,aa as o}from"./chunks/framework._Kr-eMMD.js";const u=JSON.parse('{"title":"Jaeger系列二：Jaeger线上环境部署","description":"","frontmatter":{"sidebar":false,"cover":"https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/Jaeger-cover1.jpg","date":"2023-05-11T00:00:00.000Z","author":"意琦行","tag":["Jaeger","分布式链路追踪","kubernetes"],"sticky":1,"prev":{"text":"Jaeger系列一：Jaeger 在 gin 框架和 gRPC 中的使用","link":"/posts/jaeger/jaeger-in-gin-and-grpc"},"head":[]},"headers":[],"relativePath":"posts/jaeger/exercise-jaeger-in-prod.md","filePath":"posts/jaeger/exercise-jaeger-in-prod.md","lastUpdated":1712407875000}'),c={name:"posts/jaeger/exercise-jaeger-in-prod.md"},a=o('<h1 id="jaeger系列二-jaeger线上环境部署" tabindex="-1">Jaeger系列二：Jaeger线上环境部署 <a class="header-anchor" href="#jaeger系列二-jaeger线上环境部署" aria-label="Permalink to &quot;Jaeger系列二：Jaeger线上环境部署&quot;">​</a></h1><p>本文主要记录了如何在生产环境中部署Jaeger各个组件，包括 <code>Agent</code>、<code>Collector</code>、<code>Query</code>、<code>Storage</code> 等等。</p><h2 id="概述" tabindex="-1">概述 <a class="header-anchor" href="#概述" aria-label="Permalink to &quot;概述&quot;">​</a></h2><p>测试部署时有官方提供的 <code>all-in-one</code> 的镜像，同时直接将数据存储在内存中，所以部署起来比较方便。</p><p>但是线上则建议单独部署各个组件和存储后端（这里采用ES存储）。</p><h3 id="架构" tabindex="-1">架构 <a class="header-anchor" href="#架构" aria-label="Permalink to &quot;架构&quot;">​</a></h3><p><img src="https://cdn.jsdelivr.net/gh/lixd/blog/images/tracing/jaeger-architecture.png" alt="" loading="lazy"></p><p>完整架构包含如下组件：</p><ul><li><code>jaeger-agent</code></li><li><code>jaeger-collector</code></li><li><code>jaeger-query</code></li><li><code>jaeger-ingester</code></li><li><code>elasticsearch</code></li><li><code>kafka</code></li></ul><h3 id="数据流" tabindex="-1">数据流 <a class="header-anchor" href="#数据流" aria-label="Permalink to &quot;数据流&quot;">​</a></h3><p>具体流程如下：</p><ol><li>客户端通过 <code>6831</code> 端口上报数据给 <code>agent</code></li><li>agent通过 <code>14250</code> 端口将数据发送给 <code>collector</code></li><li><code>collector</code> 将数据写入 <code>kafka</code></li><li><code>Ingester</code> 从 <code>kafka</code> 中读取数据并写入存储后端（<code>es</code>）</li><li><code>query</code> 从存储后端查询数据并展示</li></ol><h2 id="各组件介绍" tabindex="-1">各组件介绍 <a class="header-anchor" href="#各组件介绍" aria-label="Permalink to &quot;各组件介绍&quot;">​</a></h2><p>暂时只部署<code>collector、agent、query</code>和<code>es</code>这四个组件。</p><p>其中<code>collector、query</code>和<code>es</code>可以只部署一个。</p><p>但是<code>agent</code>则建议部署在每一台需要追踪的主机上，这样可以离 <code>client</code> 近一点。</p><h3 id="agent" tabindex="-1"><code>agent</code> <a class="header-anchor" href="#agent" aria-label="Permalink to &quot;`agent`&quot;">​</a></h3><p><code>jaeger-agent</code> 是客户端代理，需要部署在每台主机上。</p><table><thead><tr><th>端口</th><th>协议</th><th><div style="width:620px;">功能</div></th></tr></thead><tbody><tr><td><code>6831</code></td><td><code>UDP</code></td><td>客户端上报<code>jaeger.thrift compact</code>协议数据，大部分客户端都使用这个</td></tr><tr><td><code>6832</code></td><td><code>UDP</code></td><td><code>jaeger.thrift binary</code>协议数据。为<code>node</code>客户端单独开的一个端口，因为<code>node</code>不支持<code>jaeger.thrift compact</code>协议</td></tr><tr><td><code>5778</code></td><td><code>HTTP</code></td><td>服务器配置</td></tr><tr><td><code>5775</code></td><td><code>UDP</code></td><td><code>zipkin.thrift compact</code> 兼容<code>zipkin</code>的</td></tr><tr><td><code>14271</code></td><td><code>HTTP</code></td><td>健康检查和 <code>metrics</code></td></tr></tbody></table><h3 id="collector" tabindex="-1"><code>collector</code> <a class="header-anchor" href="#collector" aria-label="Permalink to &quot;`collector`&quot;">​</a></h3><p>收集器，可以部署多个。收集 <code>agent</code> 发来的数据并写入 <code>db</code> 或 <code>kafka</code>。</p><table><thead><tr><th>端口</th><th>协议</th><th><div style="width:620px;">功能</div></th></tr></thead><tbody><tr><td><code>14250</code></td><td><code>gRPC</code></td><td><code>jaeger-agent</code>通过该端口将收集的<code>span</code>以 <code>model.proto</code> 格式发送到 <code>collector</code></td></tr><tr><td><code>14268</code></td><td><code>HTTP</code></td><td>客户端可以通过该端口直接将<code>span</code>发送到 <code>collector</code>。</td></tr><tr><td><code>9411</code></td><td><code>HTTP</code></td><td>用于兼容 <code>zipkin</code></td></tr><tr><td><code>14269</code></td><td><code>HTTP</code></td><td>健康检查和 <code>metrics</code></td></tr></tbody></table><h3 id="query" tabindex="-1"><code>query</code> <a class="header-anchor" href="#query" aria-label="Permalink to &quot;`query`&quot;">​</a></h3><p>UI 界面，主要做数据展示。</p><table><thead><tr><th>端口</th><th>协议</th><th><div style="width:620px;">功能</div></th></tr></thead><tbody><tr><td><code>16686</code></td><td><code>HTTP</code></td><td>默认<code>url</code> <code>localhost:16686</code></td></tr><tr><td><code>16686</code></td><td><code>gRPC</code></td><td>gRPC查询服务？</td></tr><tr><td><code>16687</code></td><td><code>HTTP</code></td><td>健康检查和 <code>metrics</code></td></tr></tbody></table><h3 id="ingester" tabindex="-1"><code>ingester</code> <a class="header-anchor" href="#ingester" aria-label="Permalink to &quot;`ingester`&quot;">​</a></h3><p>主要从 <code>kafka</code> 中读取数据并写入存储后端。</p><table><thead><tr><th>端口</th><th>协议</th><th><div style="width:620px;">功能</div></th></tr></thead><tbody><tr><td><code>14270</code></td><td><code>HTTP</code></td><td>健康检查和 <code>metrics</code></td></tr></tbody></table><h3 id="后端存储" tabindex="-1">后端存储 <a class="header-anchor" href="#后端存储" aria-label="Permalink to &quot;后端存储&quot;">​</a></h3><p>用于存储收集的数据。</p><p>支持 <code>Cassandra</code> 和 <code>Elasticsearch</code>。</p><h3 id="kafka" tabindex="-1"><code>Kafka</code> <a class="header-anchor" href="#kafka" aria-label="Permalink to &quot;`Kafka`&quot;">​</a></h3><p>可以在收集器和后端存储之间做缓冲。</p>',33),r=[a];function i(l,h,n,s,g,p){return d(),t("div",null,r)}const k=e(c,[["render",i]]);export{u as __pageData,k as default};
