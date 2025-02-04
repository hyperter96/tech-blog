import{j as e,c as i,b as n,s,aa as t,f as a}from"./chunks/framework.Cst8pIsI.js";const p3=JSON.parse('{"title":"通过强化学习实现反馈优化层的自动 LoRA 微调","description":"","frontmatter":{"sidebar":false,"cover":"https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/background2.jpg","date":"2025-2-2","tag":["AI","人工智能","强化学习","Fine Tuning"],"sticky":1,"head":[]},"headers":[],"relativePath":"posts/ai/reinforcement-lora-ft.md","filePath":"posts/ai/reinforcement-lora-ft.md","lastUpdated":1738671020000}'),l={name:"posts/ai/reinforcement-lora-ft.md"},Q=s("h1",{id:"通过强化学习实现反馈优化层的自动-lora-微调",tabindex:"-1"},[a("通过强化学习实现反馈优化层的自动 LoRA 微调 "),s("a",{class:"header-anchor",href:"#通过强化学习实现反馈优化层的自动-lora-微调","aria-label":'Permalink to "通过强化学习实现反馈优化层的自动 LoRA 微调"'},"​")],-1),h=s("p",null,"要实现基于强化学习（RL）的自动 LoRA（Low-Rank Adaptation）微调，需将模型微调过程转化为策略优化问题，通过动态奖励机制引导模型参数更新。以下是分步实现方案：",-1),T=s("p",null,"将 LoRA 微调抽象为马尔可夫决策过程（MDP）：",-1),p=s("li",null,"状态（State）：当前模型性能、验证集指标（如准确率、F1）、训练数据分布特征。",-1),r={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},k={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.025ex"},xmlns:"http://www.w3.org/2000/svg",width:"1.02ex",height:"1.025ex",role:"img",focusable:"false",viewBox:"0 -442 451 453","aria-hidden":"true"},d=s("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[s("g",{"data-mml-node":"math"},[s("g",{"data-mml-node":"mi"},[s("path",{"data-c":"1D45F",d:"M21 287Q22 290 23 295T28 317T38 348T53 381T73 411T99 433T132 442Q161 442 183 430T214 408T225 388Q227 382 228 382T236 389Q284 441 347 441H350Q398 441 422 400Q430 381 430 363Q430 333 417 315T391 292T366 288Q346 288 334 299T322 328Q322 376 378 392Q356 405 342 405Q286 405 239 331Q229 315 224 298T190 165Q156 25 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 114 189T154 366Q154 405 128 405Q107 405 92 377T68 316T57 280Q55 278 41 278H27Q21 284 21 287Z",style:{"stroke-width":"3"}})])])],-1),o=[d],E=s("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[s("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[s("mi",null,"r")])],-1),c={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},g={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.025ex"},xmlns:"http://www.w3.org/2000/svg",width:"1.448ex",height:"1.025ex",role:"img",focusable:"false",viewBox:"0 -442 640 453","aria-hidden":"true"},m=s("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[s("g",{"data-mml-node":"math"},[s("g",{"data-mml-node":"mi"},[s("path",{"data-c":"1D6FC",d:"M34 156Q34 270 120 356T309 442Q379 442 421 402T478 304Q484 275 485 237V208Q534 282 560 374Q564 388 566 390T582 393Q603 393 603 385Q603 376 594 346T558 261T497 161L486 147L487 123Q489 67 495 47T514 26Q528 28 540 37T557 60Q559 67 562 68T577 70Q597 70 597 62Q597 56 591 43Q579 19 556 5T512 -10H505Q438 -10 414 62L411 69L400 61Q390 53 370 41T325 18T267 -2T203 -11Q124 -11 79 39T34 156ZM208 26Q257 26 306 47T379 90L403 112Q401 255 396 290Q382 405 304 405Q235 405 183 332Q156 292 139 224T121 120Q121 71 146 49T208 26Z",style:{"stroke-width":"3"}})])])],-1),y=[m],H=s("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[s("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[s("mi",null,"α")])],-1),V={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},_={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"0"},xmlns:"http://www.w3.org/2000/svg",width:"1.593ex",height:"1.532ex",role:"img",focusable:"false",viewBox:"0 -677 704 677","aria-hidden":"true"},u=s("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[s("g",{"data-mml-node":"math"},[s("g",{"data-mml-node":"mi"},[s("path",{"data-c":"1D447",d:"M40 437Q21 437 21 445Q21 450 37 501T71 602L88 651Q93 669 101 677H569H659Q691 677 697 676T704 667Q704 661 687 553T668 444Q668 437 649 437Q640 437 637 437T631 442L629 445Q629 451 635 490T641 551Q641 586 628 604T573 629Q568 630 515 631Q469 631 457 630T439 622Q438 621 368 343T298 60Q298 48 386 46Q418 46 427 45T436 36Q436 31 433 22Q429 4 424 1L422 0Q419 0 415 0Q410 0 363 1T228 2Q99 2 64 0H49Q43 6 43 9T45 27Q49 40 55 46H83H94Q174 46 189 55Q190 56 191 56Q196 59 201 76T241 233Q258 301 269 344Q339 619 339 625Q339 630 310 630H279Q212 630 191 624Q146 614 121 583T67 467Q60 445 57 441T43 437H40Z",style:{"stroke-width":"3"}})])])],-1),w=[u],f=s("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[s("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[s("mi",null,"T")])],-1),x={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},L={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.466ex"},xmlns:"http://www.w3.org/2000/svg",width:"34.612ex",height:"2.086ex",role:"img",focusable:"false",viewBox:"0 -716 15298.4 922","aria-hidden":"true"},F=t("",1),A=[F],M=s("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[s("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[s("mi",null,"R"),s("mo",null,"="),s("mi",{mathvariant:"normal"},"Δ"),s("mtext",null,"Accuracy"),s("mo",null,"−"),s("mi",null,"λ"),s("mo",null,"⋅"),s("mtext",null,"TrainingCost")])],-1),C=s("li",null,"环境（Environment）：模型训练过程 + 验证集评估。",-1),D=t("",9),Z={class:"MathJax",jax:"SVG",display:"true",style:{direction:"ltr",display:"block","text-align":"center",margin:"1em 0",position:"relative"}},v={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-4.196ex"},xmlns:"http://www.w3.org/2000/svg",width:"53.37ex",height:"5.892ex",role:"img",focusable:"false",viewBox:"0 -750 23589.5 2604.4","aria-hidden":"true"},b=t("",1),B=[b],R=s("mjx-assistive-mml",{unselectable:"on",display:"block",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",overflow:"hidden",width:"100%"}},[s("math",{xmlns:"http://www.w3.org/1998/Math/MathML",display:"block"},[s("msub",null,[s("mi",null,"R"),s("mi",null,"t")]),s("mo",null,"="),s("munder",null,[s("mrow",{"data-mjx-texclass":"OP"},[s("munder",null,[s("mrow",null,[s("mi",{mathvariant:"normal"},"Δ"),s("mtext",null,"Accuracy")]),s("mo",null,"⏟")])]),s("mrow",{"data-mjx-texclass":"ORD"},[s("mtext",null,"性能增益")])]),s("mo",null,"−"),s("mi",null,"λ"),s("mo",null,"⋅"),s("munder",null,[s("mrow",{"data-mjx-texclass":"OP"},[s("munder",null,[s("mrow",null,[s("mo",{stretchy:"false"},"("),s("mtext",null,"TrainingTime"),s("mo",null,"+"),s("msub",null,[s("mtext",null,"GPU"),s("mrow",{"data-mjx-texclass":"ORD"},[s("mtext",null,"MemUsage")])]),s("mo",{stretchy:"false"},")")]),s("mo",null,"⏟")])]),s("mrow",{"data-mjx-texclass":"ORD"},[s("mtext",null,"资源成本")])])])],-1),S=t("",2),P=s("p",null,"初始化：",-1),j={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},q={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.186ex"},xmlns:"http://www.w3.org/2000/svg",width:"5.169ex",height:"1.692ex",role:"img",focusable:"false",viewBox:"0 -666 2284.6 748","aria-hidden":"true"},I=t("",1),z=[I],N=s("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[s("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[s("mi",null,"r"),s("mo",null,"="),s("mn",null,"2")])],-1),O=s("li",null,"RL Agent 随机初始化策略。",-1),G=t("",1),J=s("h2",{id:"关键技术优化",tabindex:"-1"},[a("关键技术优化 "),s("a",{class:"header-anchor",href:"#关键技术优化","aria-label":'Permalink to "关键技术优化"'},"​")],-1),X=s("p",null,"动作空间离散化",-1),U={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},$={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.566ex"},xmlns:"http://www.w3.org/2000/svg",width:"9.444ex",height:"2.262ex",role:"img",focusable:"false",viewBox:"0 -750 4174.2 1000","aria-hidden":"true"},K=t("",1),W=[K],Y=s("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[s("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[s("mi",null,"r"),s("mo",null,"∈"),s("mo",{stretchy:"false"},"["),s("mn",null,"2"),s("mo",null,","),s("mn",null,"64"),s("mo",{stretchy:"false"},"]")])],-1),s3=t("",1),a3=t("",2);function t3(i3,n3,e3,l3,Q3,h3){return n(),i("div",null,[Q,h,T,s("ul",null,[p,s("li",null,[a("动作（Action）：调整 LoRA 的超参数（如秩"),s("mjx-container",r,[(n(),i("svg",k,o)),E]),a("、学习率"),s("mjx-container",c,[(n(),i("svg",g,y)),H]),a("、训练步数"),s("mjx-container",V,[(n(),i("svg",_,w)),f]),a("、数据增强策略）。")]),s("li",null,[a("奖励（Reward）：基于验证集性能提升（如"),s("mjx-container",x,[(n(),i("svg",L,A)),M]),a(")")]),C]),D,s("mjx-container",Z,[(n(),i("svg",v,B)),R]),S,s("ul",null,[s("li",null,[P,s("ul",null,[s("li",null,[a("预训练模型加载，LoRA 初始化为最小秩（如 "),s("mjx-container",j,[(n(),i("svg",q,z)),N]),a("）。")]),O])]),G]),J,s("ul",null,[s("li",null,[X,s("p",null,[a("将连续动作空间（如秩 "),s("mjx-container",U,[(n(),i("svg",$,W)),Y]),a("）离散化为层级选项，降低探索难度：")]),s3]),a3])])}const r3=e(l,[["render",t3]]);export{p3 as __pageData,r3 as default};
