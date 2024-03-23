import{j as e,b as o,c as a,X as d}from"./chunks/framework.8L-hkVlo.js";const f=JSON.parse('{"title":"Dragonfly系列一：Dragonfly架构体系","description":"","frontmatter":{"sidebar":false,"cover":"https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/dragonfly_cover.jpg","date":"2024-01-07T00:00:00.000Z","tag":["P2P","Dragonfly","kubernetes"],"sticky":1,"next":{"text":"Dragonfly系列二：Dragonfly 和 Nydus Mirror 模式集成实践","link":"/posts/dragonfly/exercise-dragonfly-with-nydus"}},"headers":[],"relativePath":"posts/dragonfly/dragonfly-intro.md","filePath":"posts/dragonfly/dragonfly-intro.md","lastUpdated":1711213142000}'),r={name:"posts/dragonfly/dragonfly-intro.md"},l=d('<h1 id="dragonfly系列一-dragonfly架构体系" tabindex="-1">Dragonfly系列一：Dragonfly架构体系 <a class="header-anchor" href="#dragonfly系列一-dragonfly架构体系" aria-label="Permalink to &quot;Dragonfly系列一：Dragonfly架构体系&quot;">​</a></h1><p>Dragonfly是一个基于P2P的开源文件分发和图像加速系统。 它由云原生计算基金会 (CNCF) 作为孵化级项目托管。 其目标是解决云原生架构中的所有分发问题。 目前 Dragonfly 的重点是：</p><ul><li>简单：定义良好的面向用户的API（HTTP），对所有容器引擎无侵入；</li><li>高效：种子点支持，基于P2P的文件分发，节省企业带宽；</li><li>智能：主机级限速，由于主机检测而智能流量控制；</li><li>安全：块传输加密，HTTPS连接支持。</li></ul><p><img src="https://cdn.jsdelivr.net/gh/dragonflyoss/Dragonfly2/docs/images/arch.png" alt="" loading="lazy"></p><p>包含以下组件：</p><ul><li><code>Manager</code>：维护各个P2P集群之间的关系，动态配置管理和RBAC。 它还包含前端控制台，方便用户可视化操作集群。</li><li><code>Scheduler</code>：为下载节点选择最优的下载父节点。 异常控制<code>Dfdaemon</code>的回源。</li><li><code>Seed Peer</code>：<code>Dfdaemon</code>开启<code>Seed Peer</code>模式可以作为P2P集群中的回源下载peer，是整个集群中下载的根peer。</li><li><code>Peer</code>：使用<code>dfdaemon</code>部署，基于C/S架构，提供<code>dfget</code>命令下载工具，以及<code>dfget daemon</code>运行守护进程，提供任务下载能力。</li></ul><h2 id="dragonfly解决了什么问题" tabindex="-1">Dragonfly解决了什么问题？ <a class="header-anchor" href="#dragonfly解决了什么问题" aria-label="Permalink to &quot;Dragonfly解决了什么问题？&quot;">​</a></h2><p>一句话概括：<strong>源站的带宽瓶颈问题</strong></p><p>假设在上千、上万个节点，都需要加载一个镜像、文件或者是 AI 模型，这时候，就需要上千、上万次的并发下载文件。这个过程很容易达到带宽上限，导致整个加载流程的变慢，或者容器启动变慢。</p><p>解决方案：</p><ol><li><p>提高带宽上限</p><p>问题：硬件成本过高，且有瓶颈 -- 中心化的存储方案解决不了大规模场景</p></li><li><p><strong>利用 P2P 方式，利用节点的闲置带宽来缓解带宽瓶颈</strong></p><p>问题：着力于大规模场景，小规模场景并不受很大影响</p></li><li><p><strong>尽量少的加载资源</strong></p><p>问题：在构建镜像、文件、AI 模型时进行去重、压缩，并且在加载时做到按需加载</p></li></ol><p>那么 DragonFly 就是结合第二和第三种方式来解决<strong>源站带宽瓶颈问题的</strong>。</p><h2 id="怎么运行的" tabindex="-1">怎么运行的？ <a class="header-anchor" href="#怎么运行的" aria-label="Permalink to &quot;怎么运行的？&quot;">​</a></h2><p>当下载一个镜像或文件时，通过 <code>Peer</code> 的 HTTP Proxy 将下载请求代理到 <code>Dragonfly</code>。<code>Peer</code> 首先会向 <code>Scheduler</code> 注册 Task， <code>Scheduler</code> 会查看 Task 的信息，判断 Task 是否在 P2P 集群内第一次下载， 如果是第一次下载优先触发 <code>Seed Peer</code> 进行回源下载，并且下载过程中对 Task 基于 Piece 级别切分。注册成功后 <code>Peer</code> 会和 <code>Scheduler</code> 建立双向流， 然后将 <code>Seed Peer</code> 调度给 <code>Peer</code> 进行下载。<code>Seed Peer</code> 和 <code>Peer</code> 之间下载传输基于 Piece 级别进行流式传输。<code>Peer</code> 每下载成功一个 Piece， 会将信息上报给 <code>Scheduler</code> 供下次调度使用。如果 Task 在 P2P 集群内非第一次下载，那么 <code>Scheduler</code> 会调度其他 <code>Peer</code> 给当前 <code>Peer</code> 下载。 <code>Peer</code> 从不同的 <code>Peer</code> 下载 Piece，拼接并返回整个文件，那么 P2P 下载就完成了。</p><p><img src="https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/dragonfly-workflow.png" alt="" loading="lazy"></p><h2 id="ai-场景下如何进行加速" tabindex="-1">AI 场景下如何进行加速？ <a class="header-anchor" href="#ai-场景下如何进行加速" aria-label="Permalink to &quot;AI 场景下如何进行加速？&quot;">​</a></h2><p>把 AI 场景数据分为四类：</p><ul><li>数据集</li><li>模型</li><li>框架</li><li>外围数据</li></ul><p><img src="https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/ai-data-distribution.png" alt="" loading="lazy"></p><h3 id="训练阶段" tabindex="-1">训练阶段 <a class="header-anchor" href="#训练阶段" aria-label="Permalink to &quot;训练阶段&quot;">​</a></h3><p>要点</p><ul><li><code>Fluid</code>：进行数据编排，同时它的 runtime 是基于分布式文件系统如 <code>JuiceFS</code>；</li><li><code>JuiceFS</code>：加载是按每一个 chunk，适用于小规模，大规模情况下会打满存储；</li></ul><p>解决方案：与 Juice 社区进行沟通，将 <code>Dragonfly</code> 集成到 Juice 中，让 chunk 流量走 P2P 分发，由此有效缓解源站带宽；</p><h3 id="推理阶段" tabindex="-1">推理阶段 <a class="header-anchor" href="#推理阶段" aria-label="Permalink to &quot;推理阶段&quot;">​</a></h3><h4 id="第一种方案-直接使用-dragonfly-做-p2p-模型分发" tabindex="-1">第一种方案：直接使用 Dragonfly 做 P2P 模型分发 <a class="header-anchor" href="#第一种方案-直接使用-dragonfly-做-p2p-模型分发" aria-label="Permalink to &quot;第一种方案：直接使用 Dragonfly 做 P2P 模型分发&quot;">​</a></h4><p>在 AI 推理过程当中，<strong>P2P 是最好的解决方案</strong>。</p><div class="important custom-block github-alert"><p class="custom-block-title">为什么？</p><p></p><p>首先 AI 有两个前提：</p><ul><li>AI 推理服务过程当中具有并发性，需要启动一两千个服务进行线上 serving</li><li>AI 模型足够大，从上百 MB 到上百 G 都有可能，一千个推理节点同时加载大文件的情况下，源站带宽不管怎么样都会被打满的。内部一些大模型场景，在没有用 P2P 之前，加载整体一千个服务的时候，可能需要几个小时，使用 P2P 之后只需要几分钟。因为 <code>Dragonfly</code> 能做到最好的情况，让整个集群当中只有 1 个节点进行回源。这样就会让回源加载尽量快，此时加载过程中它的 piece 也能在 P2P 集群当中进行内网加载，由此大大提升速度。</li></ul></div><p>这是第一种方案：<strong>直接使用 Dragonfly 做 P2P 模型分发</strong>。</p><h4 id="第二种方案-是模型文件系统方案" tabindex="-1">第二种方案：是模型文件系统方案 <a class="header-anchor" href="#第二种方案-是模型文件系统方案" aria-label="Permalink to &quot;第二种方案：是模型文件系统方案&quot;">​</a></h4><p>用 <code>Nydus</code> 将文件构建为 <code>rafs</code> 格式的文件，这个过程能够做到<strong>去重和压缩</strong>，同时在加载时会按需加载 chunk，经过 <code>Dragonfly</code> 进行分发。此方案的问题在于集成比较麻烦。</p><h4 id="第三种方案-模型镜像方案-是快手公司落地的方案" tabindex="-1">第三种方案：<strong>模型镜像方案</strong>，是快手公司落地的方案 <a class="header-anchor" href="#第三种方案-模型镜像方案-是快手公司落地的方案" aria-label="Permalink to &quot;第三种方案：**模型镜像方案**，是快手公司落地的方案&quot;">​</a></h4><p>相似于模型系统文件方案，用 <code>Nydus</code> 转换为 <code>ocive</code> 格式，将<strong>模型和推理服务框架打在同一个镜像</strong>当中，转换为 <code>Nydus</code> 格式的镜像。加载过程当中，通过 <code>Nydus</code> 去分 chunk 和按需加载。</p><p>优势：部门交接简单，如训练部门和推理部门沟通，通过镜像版本的方式进行交付可以做到沟通成本最低化。</p>',33),c=[l];function t(n,i,s,p,g,h){return o(),a("div",null,c)}const u=e(r,[["render",t]]);export{f as __pageData,u as default};