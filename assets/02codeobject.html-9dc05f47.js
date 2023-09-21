import{_ as p}from"./qrcode2-187b7271.js";import{_ as c,r as o,o as i,c as l,a as n,d as s,b as e,e as t}from"./app-6b5e6c63.js";const r="/dive-into-cpython/assets/39-codeobject-72241706.png",d="/dive-into-cpython/assets/40-codeobject-970b31de.png",u="/dive-into-cpython/assets/41-codeobject-22b277c6.png",m="/dive-into-cpython/assets/42-codeobject-f29303e8.png",b="/dive-into-cpython/assets/43-codeobject-53ab597f.png",v="/dive-into-cpython/assets/44-codeobject-1d439b9e.png",k={},_=n("h1",{id:"深入理解-python-虚拟机-字节码灵魂——code-obejct",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#深入理解-python-虚拟机-字节码灵魂——code-obejct","aria-hidden":"true"},"#"),s(" 深入理解 python 虚拟机：字节码灵魂——Code obejct")],-1),h={href:"https://mp.weixin.qq.com/s?__biz=Mzg3ODgyNDgwNg==&mid=2247488040&idx=1&sn=665b5b6080d5ec7910f586b252281bcf&chksm=cf0c8e21f87b073748c82af61a5c7c9d73bca95e5b6558d50d1d5b1cc97e50c4a93d9daffcfa&token=1257007364&lang=zh_CN#rd",target:"_blank",rel:"noopener noreferrer"},g=t(`<h2 id="code-object-数据结构" tabindex="-1"><a class="header-anchor" href="#code-object-数据结构" aria-hidden="true">#</a> Code Object 数据结构</h2><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    PyObject_HEAD
    <span class="token keyword">int</span> co_argcount<span class="token punctuation">;</span>		<span class="token comment">/* #arguments, except *args */</span>
    <span class="token keyword">int</span> co_kwonlyargcount<span class="token punctuation">;</span>	<span class="token comment">/* #keyword only arguments */</span>
    <span class="token keyword">int</span> co_nlocals<span class="token punctuation">;</span>		<span class="token comment">/* #local variables */</span>
    <span class="token keyword">int</span> co_stacksize<span class="token punctuation">;</span>		<span class="token comment">/* #entries needed for evaluation stack */</span>
    <span class="token keyword">int</span> co_flags<span class="token punctuation">;</span>		<span class="token comment">/* CO_..., see below */</span>
    PyObject <span class="token operator">*</span>co_code<span class="token punctuation">;</span>		<span class="token comment">/* instruction opcodes */</span>
    PyObject <span class="token operator">*</span>co_consts<span class="token punctuation">;</span>	<span class="token comment">/* list (constants used) */</span>
    PyObject <span class="token operator">*</span>co_names<span class="token punctuation">;</span>		<span class="token comment">/* list of strings (names used) */</span>
    PyObject <span class="token operator">*</span>co_varnames<span class="token punctuation">;</span>	<span class="token comment">/* tuple of strings (local variable names) */</span>
    PyObject <span class="token operator">*</span>co_freevars<span class="token punctuation">;</span>	<span class="token comment">/* tuple of strings (free variable names) */</span>
    PyObject <span class="token operator">*</span>co_cellvars<span class="token punctuation">;</span>      <span class="token comment">/* tuple of strings (cell variable names) */</span>
    <span class="token comment">/* The rest aren&#39;t used in either hash or comparisons, except for
       co_name (used in both) and co_firstlineno (used only in
       comparisons).  This is done to preserve the name and line number
       for tracebacks and debuggers; otherwise, constant de-duplication
       would collapse identical functions/lambdas defined on different lines.
    */</span>
    <span class="token keyword">unsigned</span> <span class="token keyword">char</span> <span class="token operator">*</span>co_cell2arg<span class="token punctuation">;</span> <span class="token comment">/* Maps cell vars which are arguments. */</span>
    PyObject <span class="token operator">*</span>co_filename<span class="token punctuation">;</span>	<span class="token comment">/* unicode (where it was loaded from) */</span>
    PyObject <span class="token operator">*</span>co_name<span class="token punctuation">;</span>		<span class="token comment">/* unicode (name, for reference) */</span>
    <span class="token keyword">int</span> co_firstlineno<span class="token punctuation">;</span>		<span class="token comment">/* first source line number */</span>
    PyObject <span class="token operator">*</span>co_lnotab<span class="token punctuation">;</span>	<span class="token comment">/* string (encoding addr&lt;-&gt;lineno mapping) See
				   Objects/lnotab_notes.txt for details. */</span>
    <span class="token keyword">void</span> <span class="token operator">*</span>co_zombieframe<span class="token punctuation">;</span>     <span class="token comment">/* for optimization only (see frameobject.c) */</span>
    PyObject <span class="token operator">*</span>co_weakreflist<span class="token punctuation">;</span>   <span class="token comment">/* to support weakrefs to code objects */</span>
<span class="token punctuation">}</span> PyCodeObject<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>下面是 code object 当中各个字段的作用：</p><ul><li><p>首先需要了解一下代码块这个概念，所谓代码块就是一个小的 python 代码，被当做一个小的单元整体执行。在 python 当中常见的代码块块有：函数体、类的定义、一个模块。</p></li><li><p>argcount，这个表示一个代码块的参数个数，这个参数只对函数体代码块有用，因为函数可能会有参数，比如上面的 pycdemo.py 是一个模块而不是一个函数，因此这个参数对应的值为 0 。</p></li><li><p>co_code，这个对象的具体内容就是一个字节序列，存储真实的 python 字节码，主要是用于 python 虚拟机执行的，在本篇文章当中暂时不详细分析。</p></li><li><p>co_consts，这个字段是一个列表类型的字段，主要是包含一些字符串常量和数值常量，比如上面的 &quot;__main__&quot; 和 100 。</p></li><li><p>co_filename，这个字段的含义就是对应的源文件的文件名。</p></li><li><p>co_firstlineno，这个字段的含义为在 python 源文件当中第一行代码出现的行数，这个字段在进行调试的时候非常重要。</p></li><li><p>co_flags，这个字段的主要含义就是标识这个 code object 的类型。0x0080 表示这个 block 是一个协程，0x0010 表示这个 code object 是嵌套的等等。</p></li><li><p>co_lnotab，这个字段的含义主要是用于计算每个字节码指令对应的源代码行数。</p></li><li><p>co_varnames，这个字段的主要含义是表示在一个 code object 本地定义的一个名字。</p></li><li><p>co_names，和 co_varnames 相反，表示非本地定义但是在 code object 当中使用的名字。</p></li><li><p>co_nlocals，这个字段表示在一个 code object 当中本地使用的变量个数。</p></li><li><p>co_stackszie，因为 python 虚拟机是一个栈式计算机，这个参数的值表示这个栈需要的最大的值。</p></li><li><p>co_cellvars，co_freevars，这两个字段主要和嵌套函数和函数闭包有关，我们在后续的文章当中将详细解释这个字段。</p></li></ul><h2 id="codeobject-详细分析" tabindex="-1"><a class="header-anchor" href="#codeobject-详细分析" aria-hidden="true">#</a> CodeObject 详细分析</h2><p>现在我们使用一些实际的例子来分析具体的 code object 。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">import</span> dis
<span class="token keyword">import</span> binascii
<span class="token keyword">import</span> types

d <span class="token operator">=</span> <span class="token number">10</span>


<span class="token keyword">def</span> <span class="token function">test_co01</span><span class="token punctuation">(</span>c<span class="token punctuation">)</span><span class="token punctuation">:</span>
    a <span class="token operator">=</span> <span class="token number">1</span>
    b <span class="token operator">=</span> <span class="token number">2</span>
    <span class="token keyword">return</span> a <span class="token operator">+</span> b <span class="token operator">+</span> c <span class="token operator">+</span> d
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,7),f={href:"https://github.com/Chang-LeHung/dive-into-cpython/blob/master/code/codeobject/co01.py",target:"_blank",rel:"noopener noreferrer"},O=t(`<div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>code
   argcount <span class="token number">1</span>
   nlocals <span class="token number">3</span>
   stacksize <span class="token number">2</span>
   flags 0043 0x43
   code b<span class="token string">&#39;6401007d01006402007d02007c01007c0200177c0000177400001753&#39;</span>
  <span class="token number">9</span>           <span class="token number">0</span> LOAD_CONST               <span class="token number">1</span> <span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
              <span class="token number">3</span> STORE_FAST               <span class="token number">1</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>

 <span class="token number">10</span>           <span class="token number">6</span> LOAD_CONST               <span class="token number">2</span> <span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
              <span class="token number">9</span> STORE_FAST               <span class="token number">2</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>

 <span class="token number">11</span>          <span class="token number">12</span> LOAD_FAST                <span class="token number">1</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>
             <span class="token number">15</span> LOAD_FAST                <span class="token number">2</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>
             <span class="token number">18</span> BINARY_ADD
             <span class="token number">19</span> LOAD_FAST                <span class="token number">0</span> <span class="token punctuation">(</span>c<span class="token punctuation">)</span>
             <span class="token number">22</span> BINARY_ADD
             <span class="token number">23</span> LOAD_GLOBAL              <span class="token number">0</span> <span class="token punctuation">(</span>d<span class="token punctuation">)</span>
             <span class="token number">26</span> BINARY_ADD
             <span class="token number">27</span> RETURN_VALUE
   consts
      None
      <span class="token number">1</span>
      <span class="token number">2</span>
   names <span class="token punctuation">(</span><span class="token string">&#39;d&#39;</span>,<span class="token punctuation">)</span>
   varnames <span class="token punctuation">(</span><span class="token string">&#39;c&#39;</span>, <span class="token string">&#39;a&#39;</span>, <span class="token string">&#39;b&#39;</span><span class="token punctuation">)</span>
   freevars <span class="token punctuation">(</span><span class="token punctuation">)</span>
   cellvars <span class="token punctuation">(</span><span class="token punctuation">)</span>
   filename <span class="token string">&#39;/tmp/pycharm_project_396/co01.py&#39;</span>
   name <span class="token string">&#39;test_co01&#39;</span>
   firstlineno <span class="token number">8</span>
   lnotab b<span class="token string">&#39;000106010601&#39;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>字段 argcount 的值等于 1，说明函数有一个参数，这个函数 test_co01 有一个参数 c 是相互对应的。</li><li>字段 nlocals 的值等于 3，说明在函数 test_co01 当中一个一共实现了三个函数本地变量 a, b, c 。</li><li>字段 names，对应代码代码当中的 co_names，根据前面的定义就是 d 这个全局变量在函数 test_co01 当中使用，但是却没有在函数当中定义了。</li><li>字段 varnames，这个就表示在本地定义使用的变量了，在函数 test_co01 当中主要有三个变量 a, b, c 。</li><li>字段 filename，就是 python 文件的地址了。</li><li>字段 firstlineno 说明函数的第一行出现在对应 python 代码的 第 8 行。</li></ul><h3 id="flags-字段详细分析" tabindex="-1"><a class="header-anchor" href="#flags-字段详细分析" aria-hidden="true">#</a> Flags 字段详细分析</h3><p>我们具体使用 python3.5 的源代码进行分析，在 cpython 虚拟机的具体实现如下所示（Include/code.h）：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token comment">/* Masks for co_flags above */</span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_OPTIMIZED</span>	<span class="token expression"><span class="token number">0x0001</span></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_NEWLOCALS</span>	<span class="token expression"><span class="token number">0x0002</span></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_VARARGS</span>	<span class="token expression"><span class="token number">0x0004</span></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_VARKEYWORDS</span>	<span class="token expression"><span class="token number">0x0008</span></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_NESTED</span>       <span class="token expression"><span class="token number">0x0010</span></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_GENERATOR</span>    <span class="token expression"><span class="token number">0x0020</span></span></span>
<span class="token comment">/* The CO_NOFREE flag is set if there are no free or cell variables.
   This information is redundant, but it allows a single flag test
   to determine whether there is any extra work to be done when the
   call frame it setup.
*/</span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_NOFREE</span>       <span class="token expression"><span class="token number">0x0040</span></span></span>

<span class="token comment">/* The CO_COROUTINE flag is set for coroutine functions (defined with
   \`\`async def\`\` keywords) */</span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_COROUTINE</span>            <span class="token expression"><span class="token number">0x0080</span></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">CO_ITERABLE_COROUTINE</span>   <span class="token expression"><span class="token number">0x0100</span></span></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如果 flags 字段和上面的各个宏定义进行 &amp; 运算，如果得到的结果大于 0，则说明符合对应的条件。</p><p>上面的宏定义的含义如下所示：</p><ul><li><p><strong>CO_OPTIMIZED</strong>，这个字段表示 code object 是被优化过的，使用函数本地定义的变量。</p></li><li><p><strong>CO_NEWLOCALS</strong>，这个字段的含义为当这个 code object 的代码被执行的时候会给栈帧当中的 f_locals 对象创建一个 dict 对象。</p></li><li><p><strong>CO_VARARGS</strong>，表示这个 code object 对象是否含有位置参数。</p></li><li><p><strong>CO_VARKEYWORDS</strong>，表示这个 code object 是否含有关键字参数。</p></li><li><p><strong>CO_NESTED</strong>，表示这个 code object 是一个嵌套函数。</p></li><li><p><strong>CO_GENERATOR</strong>，表示这个 code object 是一个生成器。</p></li><li><p><strong>CO_COROUTINE</strong>，表示这个 code object 是一个协程函数。</p></li><li><p><strong>CO_ITERABLE_COROUTINE</strong>，表示 code object 是一个可迭代的协程函数。</p></li><li><p><strong>CO_NOFREE</strong>，这个表示没有 freevars 和 cellvars，即没有函数闭包。</p></li></ul><p>现在再分析一下前面的函数 test_co01 的 flags，他对应的值等于 0x43，则说明这个函数满足三个特性分别是 CO_NEWLOCALS，CO_OPTIMIZED 和 CO_NOFREE。</p><h3 id="freevars-cellvars" tabindex="-1"><a class="header-anchor" href="#freevars-cellvars" aria-hidden="true">#</a> freevars &amp; cellvars</h3><p>我们使用下面的函数来对这两个字段进行分析：</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">def</span> <span class="token function">test_co02</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    a <span class="token operator">=</span> <span class="token number">1</span>
    b <span class="token operator">=</span> <span class="token number">2</span>

    <span class="token keyword">def</span> <span class="token function">g</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
        <span class="token keyword">return</span> a <span class="token operator">+</span> b
    <span class="token keyword">return</span> a <span class="token operator">+</span> b <span class="token operator">+</span> g<span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,12),y={href:"https://github.com/Chang-LeHung/dive-into-cpython/blob/master/code/codeobject/co01.py",target:"_blank",rel:"noopener noreferrer"},A=t(`<div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>code
   argcount <span class="token number">0</span>
   nlocals <span class="token number">1</span>
   stacksize <span class="token number">3</span>
   flags 0003 0x3
   code
      b<span class="token string">&#39;640100890000640200890100870000870100660200640300640400860000&#39;</span>
      b<span class="token string">&#39;7d0000880000880100177c00008300001753&#39;</span>
 <span class="token number">15</span>           <span class="token number">0</span> LOAD_CONST               <span class="token number">1</span> <span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
              <span class="token number">3</span> STORE_DEREF              <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>

 <span class="token number">16</span>           <span class="token number">6</span> LOAD_CONST               <span class="token number">2</span> <span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
              <span class="token number">9</span> STORE_DEREF              <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>

 <span class="token number">18</span>          <span class="token number">12</span> LOAD_CLOSURE             <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>
             <span class="token number">15</span> LOAD_CLOSURE             <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>
             <span class="token number">18</span> BUILD_TUPLE              <span class="token number">2</span>
             <span class="token number">21</span> LOAD_CONST               <span class="token number">3</span> <span class="token punctuation">(</span><span class="token operator">&lt;</span>code object g at 0x7f133ff496f0, <span class="token function">file</span> <span class="token string">&quot;/tmp/pycharm_project_396/co01.py&quot;</span>, line <span class="token number">1</span><span class="token operator"><span class="token file-descriptor important">8</span>&gt;</span><span class="token punctuation">)</span>
             <span class="token number">24</span> LOAD_CONST               <span class="token number">4</span> <span class="token punctuation">(</span><span class="token string">&#39;test_co02.&lt;locals&gt;.g&#39;</span><span class="token punctuation">)</span>
             <span class="token number">27</span> MAKE_CLOSURE             <span class="token number">0</span>
             <span class="token number">30</span> STORE_FAST               <span class="token number">0</span> <span class="token punctuation">(</span>g<span class="token punctuation">)</span>

 <span class="token number">20</span>          <span class="token number">33</span> LOAD_DEREF               <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>
             <span class="token number">36</span> LOAD_DEREF               <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>
             <span class="token number">39</span> BINARY_ADD
             <span class="token number">40</span> LOAD_FAST                <span class="token number">0</span> <span class="token punctuation">(</span>g<span class="token punctuation">)</span>
             <span class="token number">43</span> CALL_FUNCTION            <span class="token number">0</span> <span class="token punctuation">(</span><span class="token number">0</span> positional, <span class="token number">0</span> keyword pair<span class="token punctuation">)</span>
             <span class="token number">46</span> BINARY_ADD
             <span class="token number">47</span> RETURN_VALUE
   consts
      None
      <span class="token number">1</span>
      <span class="token number">2</span>
      code
         argcount <span class="token number">0</span>
         nlocals <span class="token number">0</span>
         stacksize <span class="token number">2</span>
         flags 0013 0x13
         code b<span class="token string">&#39;8800008801001753&#39;</span>
 <span class="token number">19</span>           <span class="token number">0</span> LOAD_DEREF               <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>
              <span class="token number">3</span> LOAD_DEREF               <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>
              <span class="token number">6</span> BINARY_ADD
              <span class="token number">7</span> RETURN_VALUE
         consts
            None
         names <span class="token punctuation">(</span><span class="token punctuation">)</span>
         varnames <span class="token punctuation">(</span><span class="token punctuation">)</span>
         freevars <span class="token punctuation">(</span><span class="token string">&#39;a&#39;</span>, <span class="token string">&#39;b&#39;</span><span class="token punctuation">)</span>
         cellvars <span class="token punctuation">(</span><span class="token punctuation">)</span>
         filename <span class="token string">&#39;/tmp/pycharm_project_396/co01.py&#39;</span>
         name <span class="token string">&#39;g&#39;</span>
         firstlineno <span class="token number">18</span>
         lnotab b<span class="token string">&#39;0001&#39;</span>
      <span class="token string">&#39;test_co02.&lt;locals&gt;.g&#39;</span>
   names <span class="token punctuation">(</span><span class="token punctuation">)</span>
   varnames <span class="token punctuation">(</span><span class="token string">&#39;g&#39;</span>,<span class="token punctuation">)</span>
   freevars <span class="token punctuation">(</span><span class="token punctuation">)</span>
   cellvars <span class="token punctuation">(</span><span class="token string">&#39;a&#39;</span>, <span class="token string">&#39;b&#39;</span><span class="token punctuation">)</span>
   filename <span class="token string">&#39;/tmp/pycharm_project_396/co01.py&#39;</span>
   name <span class="token string">&#39;test_co02&#39;</span>
   firstlineno <span class="token number">14</span>
   lnotab b<span class="token string">&#39;0001060106021502&#39;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>从上面的输出我们可以看到的是，函数 test_co02 的 cellvars 为 (&#39;a&#39;, &#39;b&#39;)，函数 g 的 freevars 为 (&#39;a&#39;, &#39;b&#39;)，cellvars 表示在其他函数当中会使用本地定义的变量，freevars 表示本地会使用其他函数定义的变量。</p><p>再来分析一下函数 test_co02 的 flags，他的 flags 等于 0x3 因为有闭包的存在因此 flags 不会存在 CO_NOFREE，也就是少了值 0x0040 。</p><h3 id="stacksize" tabindex="-1"><a class="header-anchor" href="#stacksize" aria-hidden="true">#</a> stacksize</h3><p>这个字段存储的是在函数在被虚拟机执行的时候所需要的最大的栈空间的大小，这也是一种优化手段，因为在知道所需要的最大的栈空间，所以可以在函数执行的时候直接分配指定大小的空间不需要在函数执行的时候再去重新扩容。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">def</span> <span class="token function">test_stack</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    a <span class="token operator">=</span> <span class="token number">1</span>
    b <span class="token operator">=</span> <span class="token number">2</span>
    <span class="token keyword">return</span> a <span class="token operator">+</span> b
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的代码相关字节码等信息如下所示：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>code
   argcount <span class="token number">0</span>
   nlocals <span class="token number">2</span>
   stacksize <span class="token number">2</span>
   flags 0043 0x43
   code b<span class="token string">&#39;6401007d00006402007d01007c00007c01001753&#39;</span>
   <span class="token comment">#					  字节码指令		 # 字节码指令参数 # 参数对应的值</span>
 <span class="token number">24</span>           <span class="token number">0</span> LOAD_CONST               <span class="token number">1</span> <span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
              <span class="token number">3</span> STORE_FAST               <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>

 <span class="token number">25</span>           <span class="token number">6</span> LOAD_CONST               <span class="token number">2</span> <span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
              <span class="token number">9</span> STORE_FAST               <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>

 <span class="token number">26</span>          <span class="token number">12</span> LOAD_FAST                <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>
             <span class="token number">15</span> LOAD_FAST                <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>
             <span class="token number">18</span> BINARY_ADD
             <span class="token number">19</span> RETURN_VALUE
   consts
      None <span class="token comment"># 下标等于 0 的常量</span>
      <span class="token number">1</span> 	 <span class="token comment"># 下标等于 1 的常量</span>
      <span class="token number">2</span>		 <span class="token comment"># 下标等于 2 的常量</span>
   names <span class="token punctuation">(</span><span class="token punctuation">)</span>
   varnames <span class="token punctuation">(</span><span class="token string">&#39;a&#39;</span>, <span class="token string">&#39;b&#39;</span><span class="token punctuation">)</span>
   freevars <span class="token punctuation">(</span><span class="token punctuation">)</span>
   cellvars <span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们现在来模拟一下执行过程，在模拟之前我们首先来了解一下上面几条字节码的作用：</p><ul><li>LOAD_CONST，将常量表当中的下标等于 i 个对象加载到栈当中，对应上面的代码 LOAD_CONST 的参数 i = 1。因此加载测常量等于 1 。因此现在栈空间如下所示：</li></ul><p><img src="`+r+'" alt="39-codeobject"></p><ul><li>STORE_FAST，将栈顶元素弹出并且保存到 co_varnames 对应的下标当中，根据上面的字节码参数等于 0 ，因此将 1 保存到 co_varnames[0] 对应的对象当中。</li></ul><p><img src="'+d+'" alt="39-codeobject"></p><ul><li>LOAD_CONST，将下标等于 2 的常量加载进入栈中。</li></ul><p><img src="'+u+'" alt="39-codeobject"></p><ul><li>STORE_FAST，将栈顶元素弹出，并且保存到 varnames 下标为 1 的对象。</li></ul><p><img src="'+m+'" alt="39-codeobject"></p><ul><li>LOAD_FAST，是取出 co_varnames 对应下标的数据，并且将其压入栈中。我们直接连续执行两个 LOAD_FAST 之后栈空间的布局如下：</li></ul><p><img src="'+b+'" alt="39-codeobject"></p><ul><li>BINARY_ADD，这个字节码指令是将栈空间的两个栈顶元素弹出，然后将两个数据进行相加操作，然后将相加得到的结果重新压入栈中。</li></ul><p><img src="'+v+'" alt="39-codeobject"></p><ul><li>RETURN_VALUE，将栈顶元素弹出并且作为返回值返回。</li></ul><p>从上面的整个执行过程来看整个栈空间使用的最大的空间长度为 2 ，因此 stacksize = 2 。</p><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>在本篇文章当中主要分析了一些 code obejct 当中比较重要的字段，code object 是 cpython 虚拟机当中一个比较重要的数据结构，深入的去理解这里面的字段对于我们理解 python 虚拟机非常有帮助。</p><hr><p>本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython</p>',27),E={href:"https://github.com/Chang-LeHung/CSCore",target:"_blank",rel:"noopener noreferrer"},j=n("p",null,"关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。",-1),C=n("p",null,[n("img",{src:p,alt:""})],-1);function T(R,D){const a=o("ExternalLinkIcon");return i(),l("div",null,[_,n("p",null,[s("在本篇文章当中主要给大家深入介绍在 cpython 当中非常重要的一个数据结构 code object! 在上一篇文章 "),n("a",h,[s("深入理解 python 虚拟机：pyc 文件结构"),e(a)]),s(" ，我们简单介绍了一下在 code object 当中有哪些字段以及这些字段的简单含义，在本篇文章当中将会举一些例子以便更加深入理解这些字段。")]),g,n("p",null,[s("在前面的文章当中我们提到过一个函数是包括一个 code object 对象，test_co01 的 code object 对象的输出结果（完整代码见"),n("a",f,[s("co01"),e(a)]),s("）如下所示：")]),O,n("p",null,[s("上面的函数的信息如下所示（完整代码见"),n("a",y,[s("co02"),e(a)]),s("）：")]),A,n("p",null,[s("更多精彩内容合集可访问项目："),n("a",E,[s("https://github.com/Chang-LeHung/CSCore"),e(a)])]),j,C])}const N=c(k,[["render",T],["__file","02codeobject.html.vue"]]);export{N as default};
