import{_ as i}from"./chunks/qrcode2.CrPWRJyg.js";import{_ as a,c as n,a0 as l,o as p}from"./chunks/framework.DCo7vYu0.js";const h="/dive-into-cpython/assets/66-bytecode.misIHzct.png",k="/dive-into-cpython/assets/67-bytecode.8pgwBUcd.png",t="/dive-into-cpython/assets/68-bytecode.C_GliQpu.png",e="/dive-into-cpython/assets/69-bytecode.D93drf9C.png",r="/dive-into-cpython/assets/70-bytecode.LxP1CjbV.png",o=JSON.parse('{"title":"深入理解 python 虚拟机：字节码教程(3)——深入剖析循环实现原理","description":"","frontmatter":{},"headers":[],"relativePath":"pvm/06bytecode_tutorial.md","filePath":"pvm/06bytecode_tutorial.md"}'),F={name:"pvm/06bytecode_tutorial.md"};function d(E,s,g,C,y,c){return p(),n("div",null,s[0]||(s[0]=[l(`<h1 id="深入理解-python-虚拟机-字节码教程-3-——深入剖析循环实现原理" tabindex="-1">深入理解 python 虚拟机：字节码教程(3)——深入剖析循环实现原理 <a class="header-anchor" href="#深入理解-python-虚拟机-字节码教程-3-——深入剖析循环实现原理" aria-label="Permalink to &quot;深入理解 python 虚拟机：字节码教程(3)——深入剖析循环实现原理&quot;">​</a></h1><p>在本篇文章当中主要给大家介绍 cpython 当中跟循环相关的字节码，这部分字节码相比起其他字节码来说相对复杂一点，通过分析这部分字节码我们对程序的执行过程将会有更加深刻的理解。</p><h2 id="循环" tabindex="-1">循环 <a class="header-anchor" href="#循环" aria-label="Permalink to &quot;循环&quot;">​</a></h2><h3 id="普通-for-循环实现原理" tabindex="-1">普通 for 循环实现原理 <a class="header-anchor" href="#普通-for-循环实现原理" aria-label="Permalink to &quot;普通 for 循环实现原理&quot;">​</a></h3><p>我们使用各种例子来理解和循环相关的字节码：</p><div class="language-python vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">python</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">def</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> test_loop</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">():</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    for</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> i </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">in</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> range</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">):</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">        print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(i)</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br></div></div><p>上面的代码对应的字节码如下所示：</p><div class="language-bash vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">  8</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">           0</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_GLOBAL</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (range)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              2</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (10)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              4</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> CALL_FUNCTION</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            1</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              6</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> GET_ITER</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        &gt;&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    8</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> FOR_ITER</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">                12</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (to </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">22</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             10</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> STORE_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (i)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">  9</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">          12</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_GLOBAL</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (print)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             14</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">                0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (i)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             16</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> CALL_FUNCTION</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            1</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             18</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> POP_TOP</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             20</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> JUMP_ABSOLUTE</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            8</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        &gt;&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   22</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (None)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             24</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> RETURN_VALUE</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br></div></div><p>首先是 range 他对应一个 builtin 的类型，在执行上面的字节码的过程当中，首先先将 range 将在进入栈空间当中，然后将常量 10 加载进入栈空间当中，最后会调用指令 CALL_FUNCTION，这个时候会将栈顶的两个元素弹出，调用 range 类型的创建函数，这个函数会返回一个 range 的实例对象。</p><p>这个时候栈的结果如下所示：</p><p><img src="`+h+'" alt="66-bytecode"></p><p>接下来的一条字节码为 GET_ITER，这条字节码的含义为，弹出栈顶的对象，并且将弹出的对象变成一个迭代器，并且将得到的迭代器对象再压入栈空间当中。</p><p><img src="'+k+'" alt="66-bytecode"></p><p>接下来的一条指令是 FOR_ITER，这条指令的含义为：已知栈顶对象是一个迭代器，调用这个迭代器的 __next__ 函数 ：</p><ul><li>如果迭代器已经迭代完成了，则将栈顶的迭代器弹出，并且将 bytecode 的 counter 加上对应的参数值，在上面的函数字节码当中这个参数值等于 12 ，也就是说下一条指令为字节码序列的 22 这个位置。</li><li>如果没有迭代完成则将函数的返回值压入栈顶，并且不需要弹出迭代器，比如当我们第一次调用 __next__ 函数的时候，range 的返回值为0，那么此时栈空间的内容如下所示：</li></ul><p><img src="'+t+'" alt="66-bytecode"></p><p>接下来执行的字节码为 STORE_FAST，这条字节码的含义就是弹出栈顶的元素，并且将这个元素保存到 co_varnames[var_num] 当中，var_num 就是这条字节码的参数，在上面的函数当中就是 0，对应的变量为 i ，因此这条字节码的含义就是弹出栈顶的元素并且保存到变量 i 当中。</p><p>LOAD_GLOBAL，将内嵌函数 print 加载进入栈中，LOAD_FAST 将变量 i 加载进入栈空间当中，此时栈空间的内容如下所示：</p><p><img src="'+e+'" alt="66-bytecode"></p><p>CALL_FUNCTION 会调用 print 函数打印数字 0，并且将函数的返回值压入栈空间当中，print 函数的返回值为 None，此时栈空间的内容如下所示：</p><p><img src="'+r+`" alt="66-bytecode"></p><p>POP_TOP 将栈顶的元素弹出，JUMP_ABSOLUTE 字节码有一个参数，在上面的函数当中这个参数为 8 ，当执行这条字节码的时候直接将 bytecode 的 counter 直接设置成这个参数值，因此执行完这条字节码之后下一条被执行的字节码又是 FOR_ITER，这便实现了循环的效果。</p><p>综合分析上面的分析过程，实现循环的效果主要是有两个字节码实现的，一个是 FOR_ITER，当迭代器迭代完成之后，会直接跳出循环，实现这个的原理是在字节码的 counter 上加上一个值，另外一个就是 JUMP_ABSOLUTE，他可以直接跳到某一处的字节码位置进行执行。</p><h3 id="continue-关键字实现原理" tabindex="-1">continue 关键字实现原理 <a class="header-anchor" href="#continue-关键字实现原理" aria-label="Permalink to &quot;continue 关键字实现原理&quot;">​</a></h3><div class="language-python vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">python</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">def</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> test_continue</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">():</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    for</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> i </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">in</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> range</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">):</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        data </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> random.randint(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        if</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> data </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 5</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">            continue</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">        print</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">f</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">{</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">data = </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">}</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br></div></div><p>其实通过对上面的字节码的分析之后，我们可以大致分析出 continue 的实现原理，首先我们知道 continue 的语意直接进行下一次循环，这个语意其实和循环体执行完之后的语意是一样的，在上一份代码的分析当中实现这个语意的字节码是 JUMP_ABSOLUTE，直接跳到 FOR_ITER 指令的位置继续开始执行。我们现在来看看上面的函数对应的字节码是什么：</p><div class="language-bash vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 13</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">           0</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_GLOBAL</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (range)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              2</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (10)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              4</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> CALL_FUNCTION</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            1</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              6</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> GET_ITER</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        &gt;&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    8</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> FOR_ITER</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">                40</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (to </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">50</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             10</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> STORE_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (i)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 14</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">          12</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_GLOBAL</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (random)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             14</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_METHOD</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              2</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (randint)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             16</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               2</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (0)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             18</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (10)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             20</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> CALL_METHOD</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              2</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             22</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> STORE_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (data)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 15</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">          24</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">                1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (data)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             26</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               3</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (5)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             28</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> COMPARE_OP</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (&lt;)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             30</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> POP_JUMP_IF_FALSE</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">       34</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 16</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">          32</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> JUMP_ABSOLUTE</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            8</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 17</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">     &gt;&gt;</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">   34</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_GLOBAL</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              3</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (print)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             36</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               4</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;data = &#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             38</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">                1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (data)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             40</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> FORMAT_VALUE</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">             2</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (repr)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             42</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> BUILD_STRING</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">             2</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             44</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> CALL_FUNCTION</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            1</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             46</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> POP_TOP</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             48</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> JUMP_ABSOLUTE</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            8</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        &gt;&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   50</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (None)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             52</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> RETURN_VALUE</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br></div></div><ul><li>LOAD_GLOBAL 0 (range): 加载全局变量 range，将其压入栈顶。</li><li>LOAD_CONST 1 (10): 加载常量值 10，将其压入栈顶。</li><li>CALL_FUNCTION 1: 调用栈顶的函数，此处为 range 函数，并传入一个参数，参数个数为 1。</li><li>GET_ITER: 获取迭代器对象。</li><li>FOR_ITER 40 (to 50): 迭代循环的开始，当迭代完成之后将字节码的 counter 加上 40 ，也就是跳转到 50 的位置执行。</li><li>STORE_FAST 0 (i): 将迭代器的值存储到局部变量 i 中。</li><li>LOAD_GLOBAL 1 (random): 加载全局变量 random，将其压入栈顶。</li><li>LOAD_METHOD 2 (randint): 加载对象 random 的属性 randint，将其压入栈顶。</li><li>LOAD_CONST 2 (0): 加载常量值 0，将其压入栈顶。</li><li>LOAD_CONST 1 (10): 加载常量值 10，将其压入栈顶。</li><li>CALL_METHOD 2: 调用栈顶的方法，此处为 random.randint 方法，并传入两个参数，参数个数为 2。</li><li>STORE_FAST 1 (data): 将方法返回值存储到局部变量 data 中。</li><li>LOAD_FAST 1 (data): 加载局部变量 data，将其压入栈顶。</li><li>LOAD_CONST 3 (5): 加载常量值 5，将其压入栈顶。</li><li>COMPARE_OP 0 (&lt;): 执行比较操作 &lt;，将结果压入栈顶。</li><li>POP_JUMP_IF_FALSE 34: 如果栈顶的比较结果为假，则跳转到字节码偏移为 34 的位置。</li><li>JUMP_ABSOLUTE 8: 无条件跳转到字节码偏移为 8 的位置，即循环的下一次迭代。</li><li>LOAD_GLOBAL 3 (print): 加载全局变量 print，将其压入栈顶。</li><li>LOAD_CONST 4 (&#39;data = &#39;): 加载常量字符串 &#39;data = &#39;，将其压入栈顶。</li><li>LOAD_FAST 1 (data): 加载局部变量 data，将其压入栈顶。</li><li>FORMAT_VALUE 2 (repr): 格式化栈顶的值，并指定格式化方式为 repr。</li><li>BUILD_STRING 2: 构建字符串对象，包含两个格式化后的值。</li><li>CALL_FUNCTION 1: 调用栈顶的函数，此处为 print 函数，并传入一个参数，参数个数为 1。</li><li>POP_TOP: 弹出栈顶的值，也就是函数 print 的返回值，print 函数返回值为 None 。</li><li>JUMP_ABSOLUTE 8: 无条件跳转到字节码偏移为 8 的位置，即循环的下一次迭代。</li><li>LOAD_CONST 0 (None): 加载常量值 None，将其压入栈顶。</li><li>RETURN_VALUE: 返回栈顶的值，即 None。</li></ul><p>这段字节码实现了一个简单的循环，使用 range 函数生成一个迭代器，然后对迭代器进行遍历，每次遍历都会调用 random.randint 方法生成一个随机数并存储到局部变量 data 中，然后根据 data 的值进行条件判断，如果小于 5 则打印 &quot;data = &quot; 和 data 的值，否则继续下一次循环，直到迭代器结束。最后返回 None。</p><h3 id="break-关键字实现原理" tabindex="-1">break 关键字实现原理 <a class="header-anchor" href="#break-关键字实现原理" aria-label="Permalink to &quot;break 关键字实现原理&quot;">​</a></h3><div class="language-python vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">python</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">def</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> test_break</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">():</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    for</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> i </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">in</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> range</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">):</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        data </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> random.randint(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        if</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> data </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 5</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">            break</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    return</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &quot;BREAK&quot;</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br></div></div><p>上面的函数对应的字节码如下所示：</p><div class="language-bash vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 21</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">           0</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_GLOBAL</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (range)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              2</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (10)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              4</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> CALL_FUNCTION</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            1</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">              6</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> GET_ITER</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">        &gt;&gt;</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    8</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> FOR_ITER</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">                28</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (to </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">38</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             10</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> STORE_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (i)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 22</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">          12</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_GLOBAL</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (random)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             14</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_METHOD</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              2</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (randint)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             16</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               2</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (0)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             18</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (10)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             20</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> CALL_METHOD</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">              2</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             22</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> STORE_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (data)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 23</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">          24</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_FAST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">                1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (data)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             26</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               3</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (5)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             28</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> COMPARE_OP</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (&lt;)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             30</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> POP_JUMP_IF_FALSE</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">        8</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 24</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">          32</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> POP_TOP</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             34</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> JUMP_ABSOLUTE</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">           38</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             36</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> JUMP_ABSOLUTE</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">            8</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> 26</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">     &gt;&gt;</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">   38</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> LOAD_CONST</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">               4</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;BREAK&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             40</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> RETURN_VALUE</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br></div></div><p>这段字节码与之前的字节码相似，但有一些细微的不同。</p><ul><li>LOAD_GLOBAL 0 (range): 加载全局变量 range，将其压入栈顶。</li><li>LOAD_CONST 1 (10): 加载常量值 10，将其压入栈顶。</li><li>CALL_FUNCTION 1: 调用函数，函数参数个数为 1。</li><li>GET_ITER: 从栈顶获取可迭代对象，并返回迭代器对象。</li><li>FOR_ITER 28 (to 38): 遍历迭代器，如果迭代器为空，则跳转到字节码偏移为 38 的位置，即跳出循环，否则继续执行下一条字节码。</li><li>STORE_FAST 0 (i): 将迭代器的当前值存储到局部变量 i 中。</li></ul><p>接下来的字节码与之前的字节码相似，都是调用 random.randint 方法生成随机数，并将随机数存储到局部变量 data 中。然后，对局部变量 data 进行条件判断，如果小于 5 则跳出循环，否则继续下一次循环。不同的是，这里使用了 POP_TOP 操作来弹出栈顶的值，即格式化后的字符串，无需使用。</p><ul><li>POP_JUMP_IF_FALSE 8: 如果栈顶的值（即 data）不满足条件（小于 5），则跳转到字节码偏移为 8 的位置，即循环的下一次迭代。</li><li>POP_TOP: 弹出栈顶的值，也就是将迭代器弹出。</li><li>JUMP_ABSOLUTE 38: 无条件跳转到字节码偏移为 38 的位置，即跳出循环。</li><li>JUMP_ABSOLUTE 8: 无条件跳转到字节码偏移为 8 的位置，即循环的下一次迭代。</li></ul><p>最后，字节码加载了一个常量字符串 &#39;BREAK&#39;，并通过 RETURN_VALUE 操作将其作为返回值返回。这段字节码实现了类似于之前的循环，但在满足条件时使用了 POP_TOP 和跳转指令来优化循环的执行。</p><p>从上面的分析过程可以看出来 break 的实现也是通过 JUMP_ABSOLUTE 来做到的，直接跳转到循环外部的下一行代码。</p><h2 id="总结" tabindex="-1">总结 <a class="header-anchor" href="#总结" aria-label="Permalink to &quot;总结&quot;">​</a></h2><p>在本本篇文章当中主要给大家分析了在python当中也循环有关的字节码，实现循环操作的主要是几个核心的字节码 FOR_ITER ，JUMP_ABSOLUTE，GET_ITER 等等。只要深入了解了这几个字节码的功能理解循环的过程就很简单了。</p><hr><p>本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：<a href="https://github.com/Chang-LeHung/dive-into-cpython" target="_blank" rel="noreferrer">https://github.com/Chang-LeHung/dive-into-cpython</a></p><p>更多精彩内容合集可访问项目：<a href="https://github.com/Chang-LeHung/CSCore" target="_blank" rel="noreferrer">https://github.com/Chang-LeHung/CSCore</a></p><p>关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。 <img src="`+i+'" alt=""></p>',45)]))}const u=a(F,[["render",d]]);export{o as __pageData,u as default};
