import{_ as l,c as e,o as T,e as t,a7 as Q,a}from"./chunks/framework.B28k8k1F.js";const D=JSON.parse('{"title":"基于 Weight of Evidence (WOE) 和 Information Value (IV) 的网络流量特征分析","description":"","frontmatter":{"sidebar":false,"cover":"https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/algorithm-1.jpeg","date":"2024-12-22T00:00:00.000Z","sticky":1,"tags":["网络安全","AML"],"prev":{"text":"基于KEDA事件驱动的AML规则引擎架构设计","link":"/posts/cyberSecurity/keda-rule-infra"},"head":[]},"headers":[],"relativePath":"posts/cyberSecurity/aml/analysis-network-traffic-characteristics.md","filePath":"posts/cyberSecurity/aml/analysis-network-traffic-characteristics.md","lastUpdated":1739612366000}'),s={name:"posts/cyberSecurity/aml/analysis-network-traffic-characteristics.md"},o=t("h1",{id:"基于-weight-of-evidence-woe-和-information-value-iv-的网络流量特征分析",tabindex:"-1"},[a("基于 Weight of Evidence (WOE) 和 Information Value (IV) 的网络流量特征分析 "),t("a",{class:"header-anchor",href:"#基于-weight-of-evidence-woe-和-information-value-iv-的网络流量特征分析","aria-label":'Permalink to "基于 Weight of Evidence (WOE) 和 Information Value (IV) 的网络流量特征分析"'},"​")],-1),r=t("p",null,"基于 Weight of Evidence (WOE) 和 Information Value (IV) 的网络流量特征分析是一种用于分类模型特征选择和评估的有效方法。WOE和IV最常用于信用评分和风险评估中，但它们同样适用于网络流量特征的分析，特别是当你想要理解某些特征对目标变量（如是否发生攻击、恶意流量、异常流量等）的影响时。",-1),n=t("h2",{id:"weight-of-evidence-woe-简介",tabindex:"-1"},[a("Weight of Evidence (WOE) 简介 "),t("a",{class:"header-anchor",href:"#weight-of-evidence-woe-简介","aria-label":'Permalink to "Weight of Evidence (WOE) 简介"'},"​")],-1),i=t("p",null,"Weight of Evidence 是一个衡量变量与目标变量（例如网络流量是否正常）的关联度的指标。它基于不同类别之间的对比，计算出每个类别相对于目标变量的“权重”。",-1),d=t("p",null,"WOE 的计算公式是：",-1),m={tabindex:"0",class:"MathJax",jax:"SVG",display:"true",style:{direction:"ltr",display:"block","text-align":"center",margin:"1em 0",position:"relative"}},c={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-2.148ex"},xmlns:"http://www.w3.org/2000/svg",width:"39.146ex",height:"5.428ex",role:"img",focusable:"false",viewBox:"0 -1449.5 17302.5 2399","aria-hidden":"true"},h=Q('<g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="msub"><g data-mml-node="mtext"><path data-c="57" d="M792 683Q810 680 914 680Q991 680 1003 683H1009V637H996Q931 633 915 598Q912 591 863 438T766 135T716 -17Q711 -22 694 -22Q676 -22 673 -15Q671 -13 593 231L514 477L435 234Q416 174 391 92T358 -6T341 -22H331Q314 -21 310 -15Q309 -14 208 302T104 622Q98 632 87 633Q73 637 35 637H18V683H27Q69 681 154 681Q164 681 181 681T216 681T249 682T276 683H287H298V637H285Q213 637 213 620Q213 616 289 381L364 144L427 339Q490 535 492 546Q487 560 482 578T475 602T468 618T461 628T449 633T433 636T408 637H380V683H388Q397 680 508 680Q629 680 650 683H660V637H647Q576 637 576 619L727 146Q869 580 869 600Q869 605 863 612T839 627T794 637H783V683H792Z" style="stroke-width:3;"></path><path data-c="4F" d="M56 340Q56 423 86 494T164 610T270 680T388 705Q521 705 621 601T722 341Q722 260 693 191T617 75T510 4T388 -22T267 3T160 74T85 189T56 340ZM467 647Q426 665 388 665Q360 665 331 654T269 620T213 549T179 439Q174 411 174 354Q174 144 277 61Q327 20 385 20H389H391Q474 20 537 99Q603 188 603 354Q603 411 598 439Q577 592 467 647Z" transform="translate(1028,0)" style="stroke-width:3;"></path><path data-c="45" d="M128 619Q121 626 117 628T101 631T58 634H25V680H597V676Q599 670 611 560T625 444V440H585V444Q584 447 582 465Q578 500 570 526T553 571T528 601T498 619T457 629T411 633T353 634Q266 634 251 633T233 622Q233 622 233 621Q232 619 232 497V376H286Q359 378 377 385Q413 401 416 469Q416 471 416 473V493H456V213H416V233Q415 268 408 288T383 317T349 328T297 330Q290 330 286 330H232V196V114Q232 57 237 52Q243 47 289 47H340H391Q428 47 452 50T505 62T552 92T584 146Q594 172 599 200T607 247T612 270V273H652V270Q651 267 632 137T610 3V0H25V46H58Q100 47 109 49T128 61V619Z" transform="translate(1806,0)" style="stroke-width:3;"></path></g><g data-mml-node="mi" transform="translate(2520,-150) scale(0.707)"><path data-c="1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z" style="stroke-width:3;"></path></g></g><g data-mml-node="mo" transform="translate(3091.7,0)"><path data-c="3D" d="M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z" style="stroke-width:3;"></path></g><g data-mml-node="mi" transform="translate(4147.5,0)"><path data-c="1D459" d="M117 59Q117 26 142 26Q179 26 205 131Q211 151 215 152Q217 153 225 153H229Q238 153 241 153T246 151T248 144Q247 138 245 128T234 90T214 43T183 6T137 -11Q101 -11 70 11T38 85Q38 97 39 102L104 360Q167 615 167 623Q167 626 166 628T162 632T157 634T149 635T141 636T132 637T122 637Q112 637 109 637T101 638T95 641T94 647Q94 649 96 661Q101 680 107 682T179 688Q194 689 213 690T243 693T254 694Q266 694 266 686Q266 675 193 386T118 83Q118 81 118 75T117 65V59Z" style="stroke-width:3;"></path></g><g data-mml-node="mi" transform="translate(4445.5,0)"><path data-c="1D45B" d="M21 287Q22 293 24 303T36 341T56 388T89 425T135 442Q171 442 195 424T225 390T231 369Q231 367 232 367L243 378Q304 442 382 442Q436 442 469 415T503 336T465 179T427 52Q427 26 444 26Q450 26 453 27Q482 32 505 65T540 145Q542 153 560 153Q580 153 580 145Q580 144 576 130Q568 101 554 73T508 17T439 -10Q392 -10 371 17T350 73Q350 92 386 193T423 345Q423 404 379 404H374Q288 404 229 303L222 291L189 157Q156 26 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 112 180T152 343Q153 348 153 366Q153 405 129 405Q91 405 66 305Q60 285 60 284Q58 278 41 278H27Q21 284 21 287Z" style="stroke-width:3;"></path></g><g data-mml-node="TeXAtom" data-mjx-texclass="ORD" transform="translate(5045.5,0)"><g data-mml-node="mo" transform="translate(0 -0.5)"><path data-c="28" d="M701 -940Q701 -943 695 -949H664Q662 -947 636 -922T591 -879T537 -818T475 -737T412 -636T350 -511T295 -362T250 -186T221 17T209 251Q209 962 573 1361Q596 1386 616 1405T649 1437T664 1450H695Q701 1444 701 1441Q701 1436 681 1415T629 1356T557 1261T476 1118T400 927T340 675T308 359Q306 321 306 250Q306 -139 400 -430T690 -924Q701 -936 701 -940Z" style="stroke-width:3;"></path></g></g><g data-mml-node="mfrac" transform="translate(5781.5,0)"><g data-mml-node="mrow" transform="translate(220,676)"><g data-mml-node="mtext"><text data-variant="normal" transform="scale(1,-1)" font-size="884px" font-family="serif">事</text><text data-variant="normal" transform="translate(1000,0) scale(1,-1)" font-size="884px" font-family="serif">件</text><text data-variant="normal" transform="translate(2000,0) scale(1,-1)" font-size="884px" font-family="serif">类</text><text data-variant="normal" transform="translate(3000,0) scale(1,-1)" font-size="884px" font-family="serif">别</text></g><g data-mml-node="TeXAtom" data-mjx-texclass="ORD" transform="translate(4000,0)"><g data-mml-node="mi"><path data-c="1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z" style="stroke-width:3;"></path></g></g><g data-mml-node="mtext" transform="translate(4345,0)"><text data-variant="normal" transform="scale(1,-1)" font-size="884px" font-family="serif">的</text><text data-variant="normal" transform="translate(1000,0) scale(1,-1)" font-size="884px" font-family="serif">好</text><text data-variant="normal" transform="translate(2000,0) scale(1,-1)" font-size="884px" font-family="serif">样</text><text data-variant="normal" transform="translate(3000,0) scale(1,-1)" font-size="884px" font-family="serif">本</text><text data-variant="normal" transform="translate(4000,0) scale(1,-1)" font-size="884px" font-family="serif">比</text><text data-variant="normal" transform="translate(5000,0) scale(1,-1)" font-size="884px" font-family="serif">例</text></g></g><g data-mml-node="mrow" transform="translate(220,-710)"><g data-mml-node="mtext"><text data-variant="normal" transform="scale(1,-1)" font-size="884px" font-family="serif">事</text><text data-variant="normal" transform="translate(1000,0) scale(1,-1)" font-size="884px" font-family="serif">件</text><text data-variant="normal" transform="translate(2000,0) scale(1,-1)" font-size="884px" font-family="serif">类</text><text data-variant="normal" transform="translate(3000,0) scale(1,-1)" font-size="884px" font-family="serif">别</text></g><g data-mml-node="TeXAtom" data-mjx-texclass="ORD" transform="translate(4000,0)"><g data-mml-node="mi"><path data-c="1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z" style="stroke-width:3;"></path></g></g><g data-mml-node="mtext" transform="translate(4345,0)"><text data-variant="normal" transform="scale(1,-1)" font-size="884px" font-family="serif">的</text><text data-variant="normal" transform="translate(1000,0) scale(1,-1)" font-size="884px" font-family="serif">坏</text><text data-variant="normal" transform="translate(2000,0) scale(1,-1)" font-size="884px" font-family="serif">样</text><text data-variant="normal" transform="translate(3000,0) scale(1,-1)" font-size="884px" font-family="serif">本</text><text data-variant="normal" transform="translate(4000,0) scale(1,-1)" font-size="884px" font-family="serif">比</text><text data-variant="normal" transform="translate(5000,0) scale(1,-1)" font-size="884px" font-family="serif">例</text></g></g><rect width="10545" height="60" x="120" y="220"></rect></g><g data-mml-node="TeXAtom" data-mjx-texclass="ORD" transform="translate(16566.5,0)"><g data-mml-node="mo" transform="translate(0 -0.5)"><path data-c="29" d="M34 1438Q34 1446 37 1448T50 1450H56H71Q73 1448 99 1423T144 1380T198 1319T260 1238T323 1137T385 1013T440 864T485 688T514 485T526 251Q526 134 519 53Q472 -519 162 -860Q139 -885 119 -904T86 -936T71 -949H56Q43 -949 39 -947T34 -937Q88 -883 140 -813Q428 -430 428 251Q428 453 402 628T338 922T245 1146T145 1309T46 1425Q44 1427 42 1429T39 1433T36 1436L34 1438Z" style="stroke-width:3;"></path></g></g></g></g>',1),p=[h],f=t("mjx-assistive-mml",{unselectable:"on",display:"block",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",overflow:"hidden",width:"100%"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML",display:"block"},[t("msub",null,[t("mtext",null,"WOE"),t("mi",null,"i")]),t("mo",null,"="),t("mi",null,"l"),t("mi",null,"n"),t("mrow",{"data-mjx-texclass":"ORD"},[t("mo",{minsize:"2.047em",maxsize:"2.047em"},"(")]),t("mfrac",null,[t("mrow",null,[t("mtext",null,"事件类别"),t("mrow",{"data-mjx-texclass":"ORD"},[t("mi",null,"i")]),t("mtext",null,"的好样本比例")]),t("mrow",null,[t("mtext",null,"事件类别"),t("mrow",{"data-mjx-texclass":"ORD"},[t("mi",null,"i")]),t("mtext",null,"的坏样本比例")])]),t("mrow",{"data-mjx-texclass":"ORD"},[t("mo",{minsize:"2.047em",maxsize:"2.047em"},")")])])],-1),x=t("p",null,[a("在网络流量分析中，你可以通过将特征值离散化（如网络流量的"),t("strong",null,"大小范围"),a("、"),t("strong",null,"流量类型"),a("、"),t("strong",null,"端口号"),a("等）来计算WOE。对于每个离散化的特征类别，你会计算它们对于正常流量（好样本）和异常流量（坏样本）的比例。")],-1),H=t("h2",{id:"information-value-iv-简介",tabindex:"-1"},[a("Information Value (IV) 简介 "),t("a",{class:"header-anchor",href:"#information-value-iv-简介","aria-label":'Permalink to "Information Value (IV) 简介"'},"​")],-1),g=t("p",null,"Information Value 是一种衡量特征预测能力的指标，基于WOE计算。IV值越高，说明该特征对目标变量的预测能力越强。IV值通常通过以下公式计算：",-1),V={tabindex:"0",class:"MathJax",jax:"SVG",display:"true",style:{direction:"ltr",display:"block","text-align":"center",margin:"1em 0",position:"relative"}},u={style:{overflow:"visible","min-height":"1px","min-width":"1px","vertical-align":"-2.819ex"},xmlns:"http://www.w3.org/2000/svg",width:"39.118ex",height:"4.968ex",role:"img",focusable:"false",viewBox:"0 -950 17290.3 2195.9","aria-hidden":"true"},w=Q('<g stroke="currentColor" fill="currentColor" stroke-width="0" transform="scale(1,-1)"><g data-mml-node="math"><g data-mml-node="mi"><path data-c="1D43C" d="M43 1Q26 1 26 10Q26 12 29 24Q34 43 39 45Q42 46 54 46H60Q120 46 136 53Q137 53 138 54Q143 56 149 77T198 273Q210 318 216 344Q286 624 286 626Q284 630 284 631Q274 637 213 637H193Q184 643 189 662Q193 677 195 680T209 683H213Q285 681 359 681Q481 681 487 683H497Q504 676 504 672T501 655T494 639Q491 637 471 637Q440 637 407 634Q393 631 388 623Q381 609 337 432Q326 385 315 341Q245 65 245 59Q245 52 255 50T307 46H339Q345 38 345 37T342 19Q338 6 332 0H316Q279 2 179 2Q143 2 113 2T65 2T43 1Z" style="stroke-width:3;"></path></g><g data-mml-node="mi" transform="translate(504,0)"><path data-c="1D449" d="M52 648Q52 670 65 683H76Q118 680 181 680Q299 680 320 683H330Q336 677 336 674T334 656Q329 641 325 637H304Q282 635 274 635Q245 630 242 620Q242 618 271 369T301 118L374 235Q447 352 520 471T595 594Q599 601 599 609Q599 633 555 637Q537 637 537 648Q537 649 539 661Q542 675 545 679T558 683Q560 683 570 683T604 682T668 681Q737 681 755 683H762Q769 676 769 672Q769 655 760 640Q757 637 743 637Q730 636 719 635T698 630T682 623T670 615T660 608T652 599T645 592L452 282Q272 -9 266 -16Q263 -18 259 -21L241 -22H234Q216 -22 216 -15Q213 -9 177 305Q139 623 138 626Q133 637 76 637H59Q52 642 52 648Z" style="stroke-width:3;"></path></g><g data-mml-node="mo" transform="translate(1550.8,0)"><path data-c="3D" d="M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z" style="stroke-width:3;"></path></g><g data-mml-node="munder" transform="translate(2606.6,0)"><g data-mml-node="mo"><path data-c="2211" d="M60 948Q63 950 665 950H1267L1325 815Q1384 677 1388 669H1348L1341 683Q1320 724 1285 761Q1235 809 1174 838T1033 881T882 898T699 902H574H543H251L259 891Q722 258 724 252Q725 250 724 246Q721 243 460 -56L196 -356Q196 -357 407 -357Q459 -357 548 -357T676 -358Q812 -358 896 -353T1063 -332T1204 -283T1307 -196Q1328 -170 1348 -124H1388Q1388 -125 1381 -145T1356 -210T1325 -294L1267 -449L666 -450Q64 -450 61 -448Q55 -446 55 -439Q55 -437 57 -433L590 177Q590 178 557 222T452 366T322 544L56 909L55 924Q55 945 60 948Z" style="stroke-width:3;"></path></g><g data-mml-node="TeXAtom" transform="translate(148.2,-1087.9) scale(0.707)" data-mjx-texclass="ORD"><g data-mml-node="mi"><path data-c="1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z" style="stroke-width:3;"></path></g><g data-mml-node="mo" transform="translate(345,0)"><path data-c="3D" d="M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z" style="stroke-width:3;"></path></g><g data-mml-node="mn" transform="translate(1123,0)"><path data-c="31" d="M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z" style="stroke-width:3;"></path></g></g></g><g data-mml-node="mo" transform="translate(4050.6,0)"><path data-c="28" d="M94 250Q94 319 104 381T127 488T164 576T202 643T244 695T277 729T302 750H315H319Q333 750 333 741Q333 738 316 720T275 667T226 581T184 443T167 250T184 58T225 -81T274 -167T316 -220T333 -241Q333 -250 318 -250H315H302L274 -226Q180 -141 137 -14T94 250Z" style="stroke-width:3;"></path></g><g data-mml-node="msub" transform="translate(4439.6,0)"><g data-mml-node="mtext"><path data-c="57" d="M792 683Q810 680 914 680Q991 680 1003 683H1009V637H996Q931 633 915 598Q912 591 863 438T766 135T716 -17Q711 -22 694 -22Q676 -22 673 -15Q671 -13 593 231L514 477L435 234Q416 174 391 92T358 -6T341 -22H331Q314 -21 310 -15Q309 -14 208 302T104 622Q98 632 87 633Q73 637 35 637H18V683H27Q69 681 154 681Q164 681 181 681T216 681T249 682T276 683H287H298V637H285Q213 637 213 620Q213 616 289 381L364 144L427 339Q490 535 492 546Q487 560 482 578T475 602T468 618T461 628T449 633T433 636T408 637H380V683H388Q397 680 508 680Q629 680 650 683H660V637H647Q576 637 576 619L727 146Q869 580 869 600Q869 605 863 612T839 627T794 637H783V683H792Z" style="stroke-width:3;"></path><path data-c="4F" d="M56 340Q56 423 86 494T164 610T270 680T388 705Q521 705 621 601T722 341Q722 260 693 191T617 75T510 4T388 -22T267 3T160 74T85 189T56 340ZM467 647Q426 665 388 665Q360 665 331 654T269 620T213 549T179 439Q174 411 174 354Q174 144 277 61Q327 20 385 20H389H391Q474 20 537 99Q603 188 603 354Q603 411 598 439Q577 592 467 647Z" transform="translate(1028,0)" style="stroke-width:3;"></path><path data-c="45" d="M128 619Q121 626 117 628T101 631T58 634H25V680H597V676Q599 670 611 560T625 444V440H585V444Q584 447 582 465Q578 500 570 526T553 571T528 601T498 619T457 629T411 633T353 634Q266 634 251 633T233 622Q233 622 233 621Q232 619 232 497V376H286Q359 378 377 385Q413 401 416 469Q416 471 416 473V493H456V213H416V233Q415 268 408 288T383 317T349 328T297 330Q290 330 286 330H232V196V114Q232 57 237 52Q243 47 289 47H340H391Q428 47 452 50T505 62T552 92T584 146Q594 172 599 200T607 247T612 270V273H652V270Q651 267 632 137T610 3V0H25V46H58Q100 47 109 49T128 61V619Z" transform="translate(1806,0)" style="stroke-width:3;"></path></g><g data-mml-node="mi" transform="translate(2520,-150) scale(0.707)"><path data-c="1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z" style="stroke-width:3;"></path></g></g><g data-mml-node="mo" transform="translate(7475.7,0)"><path data-c="D7" d="M630 29Q630 9 609 9Q604 9 587 25T493 118L389 222L284 117Q178 13 175 11Q171 9 168 9Q160 9 154 15T147 29Q147 36 161 51T255 146L359 250L255 354Q174 435 161 449T147 471Q147 480 153 485T168 490Q173 490 175 489Q178 487 284 383L389 278L493 382Q570 459 587 475T609 491Q630 491 630 471Q630 464 620 453T522 355L418 250L522 145Q606 61 618 48T630 29Z" style="stroke-width:3;"></path></g><g data-mml-node="mo" transform="translate(8476,0)"><path data-c="28" d="M94 250Q94 319 104 381T127 488T164 576T202 643T244 695T277 729T302 750H315H319Q333 750 333 741Q333 738 316 720T275 667T226 581T184 443T167 250T184 58T225 -81T274 -167T316 -220T333 -241Q333 -250 318 -250H315H302L274 -226Q180 -141 137 -14T94 250Z" style="stroke-width:3;"></path></g><g data-mml-node="msub" transform="translate(8865,0)"><g data-mml-node="mtext"><path data-c="47" d="M56 342Q56 428 89 500T174 615T283 681T391 705Q394 705 400 705T408 704Q499 704 569 636L582 624L612 663Q639 700 643 704Q644 704 647 704T653 705H657Q660 705 666 699V419L660 413H626Q620 419 619 430Q610 512 571 572T476 651Q457 658 426 658Q401 658 376 654T316 633T254 592T205 519T177 411Q173 369 173 335Q173 259 192 201T238 111T302 58T370 31T431 24Q478 24 513 45T559 100Q562 110 562 160V212Q561 213 557 216T551 220T542 223T526 225T502 226T463 227H437V273H449L609 270Q715 270 727 273H735V227H721Q674 227 668 215Q666 211 666 108V6Q660 0 657 0Q653 0 639 10Q617 25 600 42L587 54Q571 27 524 3T406 -22Q317 -22 238 22T108 151T56 342Z" style="stroke-width:3;"></path><path data-c="6F" d="M28 214Q28 309 93 378T250 448Q340 448 405 380T471 215Q471 120 407 55T250 -10Q153 -10 91 57T28 214ZM250 30Q372 30 372 193V225V250Q372 272 371 288T364 326T348 362T317 390T268 410Q263 411 252 411Q222 411 195 399Q152 377 139 338T126 246V226Q126 130 145 91Q177 30 250 30Z" transform="translate(785,0)" style="stroke-width:3;"></path><path data-c="6F" d="M28 214Q28 309 93 378T250 448Q340 448 405 380T471 215Q471 120 407 55T250 -10Q153 -10 91 57T28 214ZM250 30Q372 30 372 193V225V250Q372 272 371 288T364 326T348 362T317 390T268 410Q263 411 252 411Q222 411 195 399Q152 377 139 338T126 246V226Q126 130 145 91Q177 30 250 30Z" transform="translate(1285,0)" style="stroke-width:3;"></path><path data-c="64" d="M376 495Q376 511 376 535T377 568Q377 613 367 624T316 637H298V660Q298 683 300 683L310 684Q320 685 339 686T376 688Q393 689 413 690T443 693T454 694H457V390Q457 84 458 81Q461 61 472 55T517 46H535V0Q533 0 459 -5T380 -11H373V44L365 37Q307 -11 235 -11Q158 -11 96 50T34 215Q34 315 97 378T244 442Q319 442 376 393V495ZM373 342Q328 405 260 405Q211 405 173 369Q146 341 139 305T131 211Q131 155 138 120T173 59Q203 26 251 26Q322 26 373 103V342Z" transform="translate(1785,0)" style="stroke-width:3;"></path><path data-c="25" d="M465 605Q428 605 394 614T340 632T319 641Q332 608 332 548Q332 458 293 403T202 347Q145 347 101 402T56 548Q56 637 101 693T202 750Q241 750 272 719Q359 642 464 642Q580 642 650 732Q662 748 668 749Q670 750 673 750Q682 750 688 743T693 726Q178 -47 170 -52Q166 -56 160 -56Q147 -56 142 -45Q137 -36 142 -27Q143 -24 363 304Q469 462 525 546T581 630Q528 605 465 605ZM207 385Q235 385 263 427T292 548Q292 617 267 664T200 712Q193 712 186 709T167 698T147 668T134 615Q132 595 132 548V527Q132 436 165 403Q183 385 203 385H207ZM500 146Q500 234 544 290T647 347Q699 347 737 292T776 146T737 0T646 -56Q590 -56 545 0T500 146ZM651 -18Q679 -18 707 24T736 146Q736 215 711 262T644 309Q637 309 630 306T611 295T591 265T578 212Q577 200 577 146V124Q577 -18 647 -18H651Z" transform="translate(2341,0)" style="stroke-width:3;"></path></g><g data-mml-node="mi" transform="translate(3207,-150) scale(0.707)"><path data-c="1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z" style="stroke-width:3;"></path></g></g><g data-mml-node="mo" transform="translate(12588.1,0)"><path data-c="2212" d="M84 237T84 250T98 270H679Q694 262 694 250T679 230H98Q84 237 84 250Z" style="stroke-width:3;"></path></g><g data-mml-node="msub" transform="translate(13588.3,0)"><g data-mml-node="mtext"><path data-c="42" d="M131 622Q124 629 120 631T104 634T61 637H28V683H229H267H346Q423 683 459 678T531 651Q574 627 599 590T624 512Q624 461 583 419T476 360L466 357Q539 348 595 302T651 187Q651 119 600 67T469 3Q456 1 242 0H28V46H61Q103 47 112 49T131 61V622ZM511 513Q511 560 485 594T416 636Q415 636 403 636T371 636T333 637Q266 637 251 636T232 628Q229 624 229 499V374H312L396 375L406 377Q410 378 417 380T442 393T474 417T499 456T511 513ZM537 188Q537 239 509 282T430 336L329 337H229V200V116Q229 57 234 52Q240 47 334 47H383Q425 47 443 53Q486 67 511 104T537 188Z" style="stroke-width:3;"></path><path data-c="61" d="M137 305T115 305T78 320T63 359Q63 394 97 421T218 448Q291 448 336 416T396 340Q401 326 401 309T402 194V124Q402 76 407 58T428 40Q443 40 448 56T453 109V145H493V106Q492 66 490 59Q481 29 455 12T400 -6T353 12T329 54V58L327 55Q325 52 322 49T314 40T302 29T287 17T269 6T247 -2T221 -8T190 -11Q130 -11 82 20T34 107Q34 128 41 147T68 188T116 225T194 253T304 268H318V290Q318 324 312 340Q290 411 215 411Q197 411 181 410T156 406T148 403Q170 388 170 359Q170 334 154 320ZM126 106Q126 75 150 51T209 26Q247 26 276 49T315 109Q317 116 318 175Q318 233 317 233Q309 233 296 232T251 223T193 203T147 166T126 106Z" transform="translate(708,0)" style="stroke-width:3;"></path><path data-c="64" d="M376 495Q376 511 376 535T377 568Q377 613 367 624T316 637H298V660Q298 683 300 683L310 684Q320 685 339 686T376 688Q393 689 413 690T443 693T454 694H457V390Q457 84 458 81Q461 61 472 55T517 46H535V0Q533 0 459 -5T380 -11H373V44L365 37Q307 -11 235 -11Q158 -11 96 50T34 215Q34 315 97 378T244 442Q319 442 376 393V495ZM373 342Q328 405 260 405Q211 405 173 369Q146 341 139 305T131 211Q131 155 138 120T173 59Q203 26 251 26Q322 26 373 103V342Z" transform="translate(1208,0)" style="stroke-width:3;"></path><path data-c="25" d="M465 605Q428 605 394 614T340 632T319 641Q332 608 332 548Q332 458 293 403T202 347Q145 347 101 402T56 548Q56 637 101 693T202 750Q241 750 272 719Q359 642 464 642Q580 642 650 732Q662 748 668 749Q670 750 673 750Q682 750 688 743T693 726Q178 -47 170 -52Q166 -56 160 -56Q147 -56 142 -45Q137 -36 142 -27Q143 -24 363 304Q469 462 525 546T581 630Q528 605 465 605ZM207 385Q235 385 263 427T292 548Q292 617 267 664T200 712Q193 712 186 709T167 698T147 668T134 615Q132 595 132 548V527Q132 436 165 403Q183 385 203 385H207ZM500 146Q500 234 544 290T647 347Q699 347 737 292T776 146T737 0T646 -56Q590 -56 545 0T500 146ZM651 -18Q679 -18 707 24T736 146Q736 215 711 262T644 309Q637 309 630 306T611 295T591 265T578 212Q577 200 577 146V124Q577 -18 647 -18H651Z" transform="translate(1764,0)" style="stroke-width:3;"></path></g><g data-mml-node="mi" transform="translate(2630,-150) scale(0.707)"><path data-c="1D456" d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z" style="stroke-width:3;"></path></g></g><g data-mml-node="mo" transform="translate(16512.3,0)"><path data-c="29" d="M60 749L64 750Q69 750 74 750H86L114 726Q208 641 251 514T294 250Q294 182 284 119T261 12T224 -76T186 -143T145 -194T113 -227T90 -246Q87 -249 86 -250H74Q66 -250 63 -250T58 -247T55 -238Q56 -237 66 -225Q221 -64 221 250T66 725Q56 737 55 738Q55 746 60 749Z" style="stroke-width:3;"></path></g><g data-mml-node="mo" transform="translate(16901.3,0)"><path data-c="29" d="M60 749L64 750Q69 750 74 750H86L114 726Q208 641 251 514T294 250Q294 182 284 119T261 12T224 -76T186 -143T145 -194T113 -227T90 -246Q87 -249 86 -250H74Q66 -250 63 -250T58 -247T55 -238Q56 -237 66 -225Q221 -64 221 250T66 725Q56 737 55 738Q55 746 60 749Z" style="stroke-width:3;"></path></g></g></g>',1),y=[w],_=t("mjx-assistive-mml",{unselectable:"on",display:"block",style:{top:"0px",left:"0px",clip:"rect(1px, 1px, 1px, 1px)","-webkit-touch-callout":"none","-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-ms-user-select":"none","user-select":"none",position:"absolute",padding:"1px 0px 0px 0px",border:"0px",display:"block",overflow:"hidden",width:"100%"}},[t("math",{xmlns:"http://www.w3.org/1998/Math/MathML",display:"block"},[t("mi",null,"I"),t("mi",null,"V"),t("mo",null,"="),t("munder",null,[t("mo",{"data-mjx-texclass":"OP"},"∑"),t("mrow",{"data-mjx-texclass":"ORD"},[t("mi",null,"i"),t("mo",null,"="),t("mn",null,"1")])]),t("mo",{stretchy:"false"},"("),t("msub",null,[t("mtext",null,"WOE"),t("mi",null,"i")]),t("mo",null,"×"),t("mo",{stretchy:"false"},"("),t("msub",null,[t("mtext",null,"Good%"),t("mi",null,"i")]),t("mo",null,"−"),t("msub",null,[t("mtext",null,"Bad%"),t("mi",null,"i")]),t("mo",{stretchy:"false"},")"),t("mo",{stretchy:"false"},")")])],-1),M=Q('<p>其中，Good%是该类别中属于“好”类别（例如正常流量）样本的百分比，Bad%是属于“坏”类别（例如异常流量）样本的百分比。IV值的范围通常是：</p><ul><li><code>0.02</code>以下：无预测能力</li><li><code>0.02</code>到<code>0.1</code>：弱预测能力</li><li><code>0.1</code>到<code>0.3</code>：中等预测能力</li><li><code>0.3</code>到<code>0.5</code>：强预测能力</li><li><code>0.5</code>以上：非常强的预测能力</li></ul><h2 id="如何将-woe-和-iv-应用到网络流量特征分析" tabindex="-1">如何将 WOE 和 IV 应用到网络流量特征分析 <a class="header-anchor" href="#如何将-woe-和-iv-应用到网络流量特征分析" aria-label="Permalink to &quot;如何将 WOE 和 IV 应用到网络流量特征分析&quot;">​</a></h2><ol><li><p>选择特征：</p><p>从网络流量数据中选择合适的特征，如流量大小、通信协议、源/目标 IP 地址、端口号、时延、带宽等。</p></li><li><p>离散化特征：</p><p>对连续特征进行离散化处理，例如将流量大小分为“低”、“中”、“高”等区间。对于类别特征（如协议类型），直接使用它们。</p></li><li><p>计算 WOE：</p><p>对每个特征的类别，计算它们相对于正常和异常流量的好坏样本比例，然后根据上述公式计算WOE。</p></li><li><p>计算 IV：</p><p>根据WOE值计算每个特征的IV值，来评估每个特征对分类目标的预测能力。</p></li><li><p>选择有用特征：</p><p>根据IV值来筛选特征。IV值较高的特征通常对模型有较强的预测能力，可以作为模型的输入特征。</p></li><li><p>应用机器学习模型：</p><p>使用筛选后的特征训练机器学习模型（如逻辑回归、决策树等），进行流量分类或异常检测。</p></li></ol><h2 id="案例" tabindex="-1">案例 <a class="header-anchor" href="#案例" aria-label="Permalink to &quot;案例&quot;">​</a></h2><p>假设你正在分析一组网络流量数据，目标是识别是否为恶意流量。以下是你可能会执行的一些步骤：</p><ul><li><p>选择特征：例如源IP、目标IP、流量大小、协议类型（如TCP、UDP）、端口号等。</p></li><li><p>离散化：将“流量大小”离散为几个区间（例如：小于 1MB、1MB - 10MB、10MB以上）。</p></li><li><p>计算WOE和IV：</p><ul><li>对于每个离散化的流量大小区间，你会计算该区间内正常流量与恶意流量的比例，并计算WOE值。</li><li>使用WOE值计算IV值，评估每个特征对识别恶意流量的贡献。</li></ul></li><li><p>特征选择：根据IV值选择那些对恶意流量检测有较高预测能力的特征，例如“流量大小”和“协议类型”可能有较高的IV值。</p></li></ul><h2 id="优势和挑战" tabindex="-1">优势和挑战 <a class="header-anchor" href="#优势和挑战" aria-label="Permalink to &quot;优势和挑战&quot;">​</a></h2><p>优势：</p><ul><li>易于解释：WOE和IV可以帮助你理解每个特征对分类模型的贡献。</li><li>特征筛选：通过IV值，你可以轻松筛选出最相关的特征，减少无关特征的干扰。</li><li>与传统方法兼容：WOE和IV可以很好地与传统的机器学习算法（如逻辑回归、决策树）结合使用。</li></ul><p>挑战：</p><ul><li>离散化处理：对于某些连续特征，如何合理地选择离散化区间可能影响WOE和IV的结果。</li><li>数据平衡：如果正常流量和恶意流量之间的不平衡较大，可能需要做数据平衡处理（如过采样或欠采样）。</li><li>总结来说，WOE和IV可以作为一种有效的特征选择和分析工具，帮助你识别在网络流量分析中最重要的特征，从而提高分类模型的性能。</li></ul>',12);function k(Z,v,L,b,I,E){return T(),e("div",{"data-pagefind-body":!0},[o,r,n,i,d,t("mjx-container",m,[(T(),e("svg",c,p)),f]),x,H,g,t("mjx-container",V,[(T(),e("svg",u,y)),_]),M])}const W=l(s,[["render",k]]);export{D as __pageData,W as default};
