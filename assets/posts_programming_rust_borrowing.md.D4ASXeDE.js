import{j as s,b as i,c as a,aa as n}from"./chunks/framework.ByBKl5Aq.js";const y=JSON.parse('{"title":"Rust基础知识系列八：引用与借用","description":"","frontmatter":{"sidebar":false,"cover":"https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/rust-cover8.jpg","date":"2023-11-09T00:00:00.000Z","tag":["Rust","编程基础"],"sticky":1,"prev":{"text":"Rust基础知识系列七：所有权","link":"/posts/programming/rust/ownership"},"head":[]},"headers":[],"relativePath":"posts/programming/rust/borrowing.md","filePath":"posts/programming/rust/borrowing.md","lastUpdated":1734610870000}'),h={name:"posts/programming/rust/borrowing.md"},t=n(`<h1 id="rust基础知识系列八-引用与借用" tabindex="-1">Rust基础知识系列八：引用与借用 <a class="header-anchor" href="#rust基础知识系列八-引用与借用" aria-label="Permalink to &quot;Rust基础知识系列八：引用与借用&quot;">​</a></h1><p>上节中提到，如果仅仅支持通过转移所有权的方式获取一个值，那会让程序变得复杂。 Rust 能否像其它编程语言一样，使用某个变量的指针或者引用呢？答案是可以。</p><p>Rust 通过 借用(Borrowing) 这个概念来达成上述的目的，获取变量的引用，称之为借用(borrowing)。正如现实生活中，如果一个人拥有某样东西，你可以从他那里借来，当使用完毕后，也必须要物归原主。</p><h2 id="引用与解引用" tabindex="-1">引用与解引用 <a class="header-anchor" href="#引用与解引用" aria-label="Permalink to &quot;引用与解引用&quot;">​</a></h2><p>常规引用是一个指针类型，指向了对象存储的内存地址。在下面代码中，我们创建一个 <code>i32</code> 值的引用 <code>y</code>，然后使用解引用运算符来解出 <code>y</code> 所使用的值:</p><div class="language-rust vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rust</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">fn</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> main</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    let</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> x </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 5</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    let</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> y </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> &amp;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">x;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    assert_eq!</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">5</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, x);</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    assert_eq!</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">5</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">y);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>变量 <code>x</code> 存放了一个 <code>i32</code> 值 5。<code>y</code> 是 <code>x</code> 的一个引用。可以断言 <code>x</code> 等于 5。然而，如果希望对 <code>y</code> 的值做出断言，必须使用 <code>*y</code> 来解出引用所指向的值（也就是解引用）。一旦解引用了 <code>y</code>，就可以访问 <code>y</code> 所指向的整型值并可以与 5 做比较。</p><h2 id="不可变引用" tabindex="-1">不可变引用 <a class="header-anchor" href="#不可变引用" aria-label="Permalink to &quot;不可变引用&quot;">​</a></h2><p>下面的代码，我们用 <code>s1</code> 的引用作为参数传递给 <code>calculate_length</code> 函数，而不是把 <code>s1</code> 的所有权转移给该函数：</p><div class="language-rust vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rust</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">fn</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> main</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    let</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> s1 </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> String</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">::</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">from</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;hello&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    let</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> len </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> calculate_length</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&amp;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">s1);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    println!</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;The length of &#39;{}&#39; is {}.&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, s1, len);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">fn</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> calculate_length</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(s</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> &amp;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">String</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">-&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> usize</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    s</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">len</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">()</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>能注意到两点：</p><ol><li>无需像上章一样：先通过函数参数传入所有权，然后再通过函数返回来传出所有权，代码更加简洁</li><li><code>calculate_length</code> 的参数 <code>s</code> 类型从 <code>String</code> 变为 <code>&amp;String</code></li></ol><p>这里，<code>&amp;</code> 符号即是引用，它们允许你使用值，但是不获取所有权，如图所示：</p><p><img src="https://cdn.jsdelivr.net/gh/hyperter96/tech-blog/docs/assets/images/borrowing-1.jpg" alt="" loading="lazy"></p><p>通过 <code>&amp;s1</code> 语法，我们创建了一个指向 <code>s1</code> 的引用，但是并不拥有它。因为并不拥有这个值，当引用离开作用域后，其指向的值也不会被丢弃。</p><p>同理，函数 <code>calculate_length</code> 使用 <code>&amp;</code> 来表明参数 <code>s</code> 的类型是一个引用：</p><div class="language-rust vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rust</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">fn</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> calculate_length</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(s</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> &amp;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">String</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">-&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> usize</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// s 是对 String 的引用</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    s</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">len</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">()</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">} </span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// 这里，s 离开了作用域。但因为它并不拥有引用值的所有权，</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">  // 所以什么也不会发生</span></span></code></pre></div><p>人总是贪心的，可以拉女孩小手了，就想着抱抱柔软的身子（读者中的某老司机表示，这个流程完全不对），因此光借用已经满足不了我们了，如果尝试修改借用的变量呢？</p><div class="language-rust vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rust</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">fn</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> main</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    let</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> s </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> String</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">::</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">from</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;hello&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    change</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&amp;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">s);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">fn</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> change</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(some_string</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">:</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> &amp;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">String</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    some_string</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">push_str</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;, world&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>很不幸，妹子你没抱到，哦口误，你修改错了：</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">error[E0596]:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> cannot</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> borrow</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> \`</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">some_string\`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> as</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> mutable,</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> as</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> it</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> is</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> behind</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> a</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> \`&amp;\`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> reference</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> --</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">&gt; </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">src/main.rs:8:5</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  |</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">7</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> |</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> fn</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> change</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">some_string:</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> &amp;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">String</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">{</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  |</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">                        -------</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> help:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> consider</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> changing</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> this</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> to</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> be</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> a</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> mutable</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> reference:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> \`&amp;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mut</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> String\`</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">                           -------</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> 帮助：考虑将该参数类型修改为可变的引用:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> \`&amp;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mut</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> String\`</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">8</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> |</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">     some_string.push_str(</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">&quot;, world&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  |</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">     ^^^^^^^^^^^</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> \`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">some_string</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">\`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> is</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> a</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> \`&amp;\`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> reference,</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> so</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> the</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> data</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> it</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> refers</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> to</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> cannot</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> be</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> borrowed</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> as</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> mutable</span></span>
<span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">                     \`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">some_string</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">\`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">是一个</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">\`&amp;\`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">类型的引用，因此它指向的数据无法进行修改</span></span></code></pre></div><p>正如变量默认不可变一样，引用指向的值默认也是不可变的，没事，来一起看看如何解决这个问题。</p>`,22),k=[t];function p(l,e,r,d,F,g){return i(),a("div",null,k)}const o=s(h,[["render",p]]);export{y as __pageData,o as default};