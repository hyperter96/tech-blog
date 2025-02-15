import{_ as n,c as o,o as l,e as t,a7 as s,a as e}from"./chunks/framework.B28k8k1F.js";const O3=JSON.parse('{"title":"LoRA微调的参数对训练模型的作用和影响","description":"","frontmatter":{"sidebar":false,"cover":"https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/background2.jpg","date":"2025-2-3","tag":["AI","人工智能","强化学习","Fine Tuning"],"sticky":1,"prev":{"link":"/posts/ai/reinforcement-lora-ft","text":"通过强化学习实现反馈优化层的自动 LoRA 微调"},"head":[]},"headers":[],"relativePath":"posts/ai/lora-parameter.md","filePath":"posts/ai/lora-parameter.md","lastUpdated":1739612366000}'),a={name:"posts/ai/lora-parameter.md"},i=t("h1",{id:"lora微调的参数对训练模型的作用和影响",tabindex:"-1"},[e("LoRA微调的参数对训练模型的作用和影响 "),t("a",{class:"header-anchor",href:"#lora微调的参数对训练模型的作用和影响","aria-label":'Permalink to "LoRA微调的参数对训练模型的作用和影响"'},"​")],-1),r=t("h2",{id:"lora微调核心参数清单",tabindex:"-1"},[e("LoRA微调核心参数清单 "),t("a",{class:"header-anchor",href:"#lora微调核心参数清单","aria-label":'Permalink to "LoRA微调核心参数清单"'},"​")],-1),d={tabindex:"0"},Q=t("thead",null,[t("tr",null,[t("th",null,"参数名"),t("th",null,"典型值范围"),t("th",null,"作用"),t("th",null,"对模型的影响")])],-1),c={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},h={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.025ex"},xmlns:"http://www.w3.org/2000/svg",width:"1.02ex",height:"1.025ex",role:"img",focusable:"false",viewBox:"0 -442 451 453","aria-hidden":"true"},T=t("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[t("g",{"data-mml-node":"math"},[t("g",{"data-mml-node":"mi"},[t("path",{"data-c":"1D45F",d:"M21 287Q22 290 23 295T28 317T38 348T53 381T73 411T99 433T132 442Q161 442 183 430T214 408T225 388Q227 382 228 382T236 389Q284 441 347 441H350Q398 441 422 400Q430 381 430 363Q430 333 417 315T391 292T366 288Q346 288 334 299T322 328Q322 376 378 392Q356 405 342 405Q286 405 239 331Q229 315 224 298T190 165Q156 25 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 114 189T154 366Q154 405 128 405Q107 405 92 377T68 316T57 280Q55 278 41 278H27Q21 284 21 287Z",style:{"stroke-width":"3"}})])])],-1),m=[T],p=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"r")])],-1),u=t("td",null,[t("code",null,"2~64")],-1),_=t("td",null,"控制低秩矩阵的维度",-1),g=t("td",null,"决定模型微调的灵活性和参数规模",-1),x={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},w={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.025ex"},xmlns:"http://www.w3.org/2000/svg",width:"1.448ex",height:"1.025ex",role:"img",focusable:"false",viewBox:"0 -442 640 453","aria-hidden":"true"},b=t("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[t("g",{"data-mml-node":"math"},[t("g",{"data-mml-node":"mi"},[t("path",{"data-c":"1D6FC",d:"M34 156Q34 270 120 356T309 442Q379 442 421 402T478 304Q484 275 485 237V208Q534 282 560 374Q564 388 566 390T582 393Q603 393 603 385Q603 376 594 346T558 261T497 161L486 147L487 123Q489 67 495 47T514 26Q528 28 540 37T557 60Q559 67 562 68T577 70Q597 70 597 62Q597 56 591 43Q579 19 556 5T512 -10H505Q438 -10 414 62L411 69L400 61Q390 53 370 41T325 18T267 -2T203 -11Q124 -11 79 39T34 156ZM208 26Q257 26 306 47T379 90L403 112Q401 255 396 290Q382 405 304 405Q235 405 183 332Q156 292 139 224T121 120Q121 71 146 49T208 26Z",style:{"stroke-width":"3"}})])])],-1),f=[b],k=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"α")])],-1),v=t("td",null,[t("code",null,"1~256")],-1),L=t("td",null,"控制低秩矩阵对原权重的缩放比例",-1),y=t("td",null,"平衡新知识与原始知识的影响权重",-1),M=t("tr",null,[t("td",null,"学习率 (lr)"),t("td",null,[t("code",null,"1e-5 ~ 1e-3")]),t("td",null,"控制参数更新的步长"),t("td",null,"影响训练速度和稳定性")],-1),H=t("tr",null,[t("td",null,"目标模块 (target_modules)"),t("td",null,[e("如 "),t("code",null,'"q_proj"'),e(", "),t("code",null,'"v_proj"')]),t("td",null,"指定哪些神经网络层添加LoRA适配器"),t("td",null,"决定模型哪些部分参与微调")],-1),A=t("tr",null,[t("td",null,"训练层数 (layers)"),t("td",null,[e("如 "),t("code",null,'"all"'),e(" 或 "),t("code",null,"[0,1,2]")]),t("td",null,"选择Transformer的哪些层添加LoRA"),t("td",null,"控制微调的深度和范围")],-1),Z=t("tr",null,[t("td",null,"dropout"),t("td",null,[t("code",null,"0~0.5")]),t("td",null,"随机丢弃部分神经元防止过拟合"),t("td",null,"提高泛化能力，但可能降低训练效率")],-1),j=t("h2",{id:"lora微调核心参数作用和影响",tabindex:"-1"},[e("LoRA微调核心参数作用和影响 "),t("a",{class:"header-anchor",href:"#lora微调核心参数作用和影响","aria-label":'Permalink to "LoRA微调核心参数作用和影响"'},"​")],-1),C=t("p",null,"在LoRA（Low-Rank Adaptation）微调中，每个参数都对模型的训练效果和效率有重要影响。以下是关键参数的作用及其对模型训练的详细分析：",-1),S=t("hr",null,null,-1),D=t("h3",{id:"_1-秩-rank-r",tabindex:"-1"},[e("1. "),t("strong",null,[e("秩（Rank, "),t("code",null,"r"),e("）")]),e(),t("a",{class:"header-anchor",href:"#_1-秩-rank-r","aria-label":'Permalink to "1. **秩（Rank, `r`）**"'},"​")],-1),V=t("li",null,[t("strong",null,"作用"),e("：控制低秩矩阵的维度（分解后矩阵的行列数），决定新增可训练参数的数量。")],-1),P=t("strong",null,"影响",-1),q=t("strong",null,"模型容量",-1),R=t("code",null,"r",-1),B={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},I={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.566ex"},xmlns:"http://www.w3.org/2000/svg",width:"8.449ex",height:"2.262ex",role:"img",focusable:"false",viewBox:"0 -750 3734.4 1000","aria-hidden":"true"},z=s("",1),J=[z],G=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"O"),t("mo",{stretchy:"false"},"("),t("mi",null,"r"),t("mo",null,"×"),t("mi",null,"d"),t("mo",{stretchy:"false"},")")])],-1),N={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},E={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.023ex"},xmlns:"http://www.w3.org/2000/svg",width:"1.176ex",height:"1.593ex",role:"img",focusable:"false",viewBox:"0 -694 520 704","aria-hidden":"true"},F=t("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[t("g",{"data-mml-node":"math"},[t("g",{"data-mml-node":"mi"},[t("path",{"data-c":"1D451",d:"M366 683Q367 683 438 688T511 694Q523 694 523 686Q523 679 450 384T375 83T374 68Q374 26 402 26Q411 27 422 35Q443 55 463 131Q469 151 473 152Q475 153 483 153H487H491Q506 153 506 145Q506 140 503 129Q490 79 473 48T445 8T417 -8Q409 -10 393 -10Q359 -10 336 5T306 36L300 51Q299 52 296 50Q294 48 292 46Q233 -10 172 -10Q117 -10 75 30T33 157Q33 205 53 255T101 341Q148 398 195 420T280 442Q336 442 364 400Q369 394 369 396Q370 400 396 505T424 616Q424 629 417 632T378 637H357Q351 643 351 645T353 664Q358 683 366 683ZM352 326Q329 405 277 405Q242 405 210 374T160 293Q131 214 119 129Q119 126 119 118T118 106Q118 61 136 44T179 26Q233 26 290 98L298 109L352 326Z",style:{"stroke-width":"3"}})])])],-1),W=[F],$=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"d")])],-1),O=s("",2),U=t("hr",null,null,-1),X=t("h3",{id:"_2-缩放因子-alpha-α",tabindex:"-1"},[e("2. "),t("strong",null,[e("缩放因子（Alpha, "),t("code",null,"α"),e("）")]),e(),t("a",{class:"header-anchor",href:"#_2-缩放因子-alpha-α","aria-label":'Permalink to "2. **缩放因子（Alpha, `α`）**"'},"​")],-1),K=t("strong",null,"作用",-1),Y={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},t3={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.798ex"},xmlns:"http://www.w3.org/2000/svg",width:"12.706ex",height:"2.418ex",role:"img",focusable:"false",viewBox:"0 -716 5616.1 1068.8","aria-hidden":"true"},e3=s("",1),o3=[e3],l3=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",{mathvariant:"normal"},"Δ"),t("mi",null,"W"),t("mo",null,"="),t("mfrac",null,[t("mi",null,"α"),t("mi",null,"r")]),t("mi",null,"B"),t("mi",null,"A")])],-1),s3=s("",1),n3=s("",11),a3=t("strong",null,"作用",-1),i3={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},r3={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"0"},xmlns:"http://www.w3.org/2000/svg",width:"1.697ex",height:"1.62ex",role:"img",focusable:"false",viewBox:"0 -716 750 716","aria-hidden":"true"},d3=t("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[t("g",{"data-mml-node":"math"},[t("g",{"data-mml-node":"mi"},[t("path",{"data-c":"1D434",d:"M208 74Q208 50 254 46Q272 46 272 35Q272 34 270 22Q267 8 264 4T251 0Q249 0 239 0T205 1T141 2Q70 2 50 0H42Q35 7 35 11Q37 38 48 46H62Q132 49 164 96Q170 102 345 401T523 704Q530 716 547 716H555H572Q578 707 578 706L606 383Q634 60 636 57Q641 46 701 46Q726 46 726 36Q726 34 723 22Q720 7 718 4T704 0Q701 0 690 0T651 1T578 2Q484 2 455 0H443Q437 6 437 9T439 27Q443 40 445 43L449 46H469Q523 49 533 63L521 213H283L249 155Q208 86 208 74ZM516 260Q516 271 504 416T490 562L463 519Q447 492 400 412L310 260L413 259Q516 259 516 260Z",style:{"stroke-width":"3"}})])])],-1),Q3=[d3],c3=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"A")])],-1),h3={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},T3={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"0"},xmlns:"http://www.w3.org/2000/svg",width:"1.717ex",height:"1.545ex",role:"img",focusable:"false",viewBox:"0 -683 759 683","aria-hidden":"true"},m3=t("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[t("g",{"data-mml-node":"math"},[t("g",{"data-mml-node":"mi"},[t("path",{"data-c":"1D435",d:"M231 637Q204 637 199 638T194 649Q194 676 205 682Q206 683 335 683Q594 683 608 681Q671 671 713 636T756 544Q756 480 698 429T565 360L555 357Q619 348 660 311T702 219Q702 146 630 78T453 1Q446 0 242 0Q42 0 39 2Q35 5 35 10Q35 17 37 24Q42 43 47 45Q51 46 62 46H68Q95 46 128 49Q142 52 147 61Q150 65 219 339T288 628Q288 635 231 637ZM649 544Q649 574 634 600T585 634Q578 636 493 637Q473 637 451 637T416 636H403Q388 635 384 626Q382 622 352 506Q352 503 351 500L320 374H401Q482 374 494 376Q554 386 601 434T649 544ZM595 229Q595 273 572 302T512 336Q506 337 429 337Q311 337 310 336Q310 334 293 263T258 122L240 52Q240 48 252 48T333 46Q422 46 429 47Q491 54 543 105T595 229Z",style:{"stroke-width":"3"}})])])],-1),p3=[m3],u3=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"B")])],-1),_3={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},g3={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"0"},xmlns:"http://www.w3.org/2000/svg",width:"1.697ex",height:"1.62ex",role:"img",focusable:"false",viewBox:"0 -716 750 716","aria-hidden":"true"},x3=t("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[t("g",{"data-mml-node":"math"},[t("g",{"data-mml-node":"mi"},[t("path",{"data-c":"1D434",d:"M208 74Q208 50 254 46Q272 46 272 35Q272 34 270 22Q267 8 264 4T251 0Q249 0 239 0T205 1T141 2Q70 2 50 0H42Q35 7 35 11Q37 38 48 46H62Q132 49 164 96Q170 102 345 401T523 704Q530 716 547 716H555H572Q578 707 578 706L606 383Q634 60 636 57Q641 46 701 46Q726 46 726 36Q726 34 723 22Q720 7 718 4T704 0Q701 0 690 0T651 1T578 2Q484 2 455 0H443Q437 6 437 9T439 27Q443 40 445 43L449 46H469Q523 49 533 63L521 213H283L249 155Q208 86 208 74ZM516 260Q516 271 504 416T490 562L463 519Q447 492 400 412L310 260L413 259Q516 259 516 260Z",style:{"stroke-width":"3"}})])])],-1),w3=[x3],b3=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"A")])],-1),f3={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},k3={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"0"},xmlns:"http://www.w3.org/2000/svg",width:"1.717ex",height:"1.545ex",role:"img",focusable:"false",viewBox:"0 -683 759 683","aria-hidden":"true"},v3=t("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[t("g",{"data-mml-node":"math"},[t("g",{"data-mml-node":"mi"},[t("path",{"data-c":"1D435",d:"M231 637Q204 637 199 638T194 649Q194 676 205 682Q206 683 335 683Q594 683 608 681Q671 671 713 636T756 544Q756 480 698 429T565 360L555 357Q619 348 660 311T702 219Q702 146 630 78T453 1Q446 0 242 0Q42 0 39 2Q35 5 35 10Q35 17 37 24Q42 43 47 45Q51 46 62 46H68Q95 46 128 49Q142 52 147 61Q150 65 219 339T288 628Q288 635 231 637ZM649 544Q649 574 634 600T585 634Q578 636 493 637Q473 637 451 637T416 636H403Q388 635 384 626Q382 622 352 506Q352 503 351 500L320 374H401Q482 374 494 376Q554 386 601 434T649 544ZM595 229Q595 273 572 302T512 336Q506 337 429 337Q311 337 310 336Q310 334 293 263T258 122L240 52Q240 48 252 48T333 46Q422 46 429 47Q491 54 543 105T595 229Z",style:{"stroke-width":"3"}})])])],-1),L3=[v3],y3=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"B")])],-1),M3=t("strong",null,"影响",-1),H3=t("strong",null,"训练起点",-1),A3={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},Z3={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"0"},xmlns:"http://www.w3.org/2000/svg",width:"1.717ex",height:"1.545ex",role:"img",focusable:"false",viewBox:"0 -683 759 683","aria-hidden":"true"},j3=t("g",{stroke:"currentColor",fill:"currentColor","stroke-width":"0",transform:"scale(1,-1)"},[t("g",{"data-mml-node":"math"},[t("g",{"data-mml-node":"mi"},[t("path",{"data-c":"1D435",d:"M231 637Q204 637 199 638T194 649Q194 676 205 682Q206 683 335 683Q594 683 608 681Q671 671 713 636T756 544Q756 480 698 429T565 360L555 357Q619 348 660 311T702 219Q702 146 630 78T453 1Q446 0 242 0Q42 0 39 2Q35 5 35 10Q35 17 37 24Q42 43 47 45Q51 46 62 46H68Q95 46 128 49Q142 52 147 61Q150 65 219 339T288 628Q288 635 231 637ZM649 544Q649 574 634 600T585 634Q578 636 493 637Q473 637 451 637T416 636H403Q388 635 384 626Q382 622 352 506Q352 503 351 500L320 374H401Q482 374 494 376Q554 386 601 434T649 544ZM595 229Q595 273 572 302T512 336Q506 337 429 337Q311 337 310 336Q310 334 293 263T258 122L240 52Q240 48 252 48T333 46Q422 46 429 47Q491 54 543 105T595 229Z",style:{"stroke-width":"3"}})])])],-1),C3=[j3],S3=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",null,"B")])],-1),D3={class:"MathJax",jax:"SVG",style:{direction:"ltr",position:"relative"}},V3={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-0.186ex"},xmlns:"http://www.w3.org/2000/svg",width:"8.404ex",height:"1.805ex",role:"img",focusable:"false",viewBox:"0 -716 3714.6 798","aria-hidden":"true"},P3=s("",1),q3=[P3],R3=t("mjx-assistive-mml",{unselectable:"on",display:"inline",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",width:"auto",overflow:"hidden"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML"},[t("mi",{mathvariant:"normal"},"Δ"),t("mi",null,"W"),t("mo",null,"="),t("mn",null,"0")])],-1),B3=t("li",null,[t("strong",null,"收敛速度"),e("：合理的初始化可加速训练（如 He/Xavier 初始化）。")],-1),I3=s("",10);function z3(J3,G3,N3,E3,F3,W3){return l(),o("div",{"data-pagefind-body":!0},[i,r,t("table",d,[Q,t("tbody",null,[t("tr",null,[t("td",null,[e("秩 (rank, "),t("mjx-container",c,[(l(),o("svg",h,m)),p]),e(")")]),u,_,g]),t("tr",null,[t("td",null,[e("缩放因子 ("),t("mjx-container",x,[(l(),o("svg",w,f)),k]),e(")")]),v,L,y]),M,H,A,Z])]),j,C,S,D,t("ul",null,[V,t("li",null,[P,e("： "),t("ul",null,[t("li",null,[q,e("："),R,e(" 越大，低秩矩阵能捕捉的信息越复杂，但参数量和计算量增加（复杂度为 "),t("mjx-container",B,[(l(),o("svg",I,J)),G]),e("，其中 "),t("mjx-container",N,[(l(),o("svg",E,W)),$]),e(" 是原层维度）。")]),O])])]),U,X,t("ul",null,[t("li",null,[K,e("：控制低秩矩阵对原始权重的缩放比例，公式为 "),t("mjx-container",Y,[(l(),o("svg",t3,o3)),l3]),e("。")]),s3]),n3,t("ul",null,[t("li",null,[a3,e("：低秩矩阵 "),t("mjx-container",i3,[(l(),o("svg",r3,Q3)),c3]),e(" 和 "),t("mjx-container",h3,[(l(),o("svg",T3,p3)),u3]),e(" 的初始化方法（通常 "),t("mjx-container",_3,[(l(),o("svg",g3,w3)),b3]),e(" 用高斯初始化，"),t("mjx-container",f3,[(l(),o("svg",k3,L3)),y3]),e(" 用零初始化）。")]),t("li",null,[M3,e("： "),t("ul",null,[t("li",null,[H3,e("：零初始化 "),t("mjx-container",A3,[(l(),o("svg",Z3,C3)),S3]),e(" 确保初始状态 "),t("mjx-container",D3,[(l(),o("svg",V3,q3)),R3]),e("，避免破坏预训练权重。")]),B3])])]),I3])}const U3=n(a,[["render",z3]]);export{O3 as __pageData,U3 as default};
