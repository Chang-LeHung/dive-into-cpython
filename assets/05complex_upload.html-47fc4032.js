import{_ as p}from"./qrcode2-187b7271.js";import{_ as t,r as e,o,c,a as n,d as s,b as l,e as i}from"./app-6b5e6c63.js";const u={},r=i(`<h1 id="深入理解-python-虚拟机-复数-complex-的实现原理及源码剖析" tabindex="-1"><a class="header-anchor" href="#深入理解-python-虚拟机-复数-complex-的实现原理及源码剖析" aria-hidden="true">#</a> 深入理解 Python 虚拟机：复数（complex）的实现原理及源码剖析</h1><p>在本篇文章当中主要给大家介绍在 cpython 虚拟机当中是如何实现 复数 complex 这个数据类型的，这个数据类型在 cpython 当中一应该是一个算比较简单的数据类型了，非常容易理解。</p><h2 id="复数数据结构" tabindex="-1"><a class="header-anchor" href="#复数数据结构" aria-hidden="true">#</a> 复数数据结构</h2><p>在 cpython 当中对于复数的数据结构实现如下所示：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    <span class="token keyword">double</span> real<span class="token punctuation">;</span>
    <span class="token keyword">double</span> imag<span class="token punctuation">;</span>
<span class="token punctuation">}</span> Py_complex<span class="token punctuation">;</span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">PyObject_HEAD</span>                   <span class="token expression">PyObject ob_base<span class="token punctuation">;</span></span></span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    PyObject_HEAD
    Py_complex cval<span class="token punctuation">;</span>
<span class="token punctuation">}</span> PyComplexObject<span class="token punctuation">;</span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token class-name">_object</span> <span class="token punctuation">{</span>
    _PyObject_HEAD_EXTRA
    Py_ssize_t ob_refcnt<span class="token punctuation">;</span>
    <span class="token keyword">struct</span> <span class="token class-name">_typeobject</span> <span class="token operator">*</span>ob_type<span class="token punctuation">;</span>
<span class="token punctuation">}</span> PyObject<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的数据结构图示如下：</p><p><img src="https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230313205120433-2120472182.png" alt=""></p><p>复数的数据在整个 cpython 虚拟机当中来说应该算是比较简单的了，除了一个 PyObject 头部之外就是实部和虚部了。</p><ul><li><p>ob_refcnt，表示对象的引用记数的个数，这个对于垃圾回收很有用处，后面我们分析虚拟机中垃圾回收部分在深入分析。</p></li><li><p>ob_type，表示这个对象的数据类型是什么，在 python 当中有时候需要对数据的数据类型进行判断比如 isinstance, type 这两个关键字就会使用到这个字段。</p></li><li><p>real，表示复数的实部。</p></li><li><p>imag，表示复数的虚部。</p></li></ul><h2 id="复数的操作" tabindex="-1"><a class="header-anchor" href="#复数的操作" aria-hidden="true">#</a> 复数的操作</h2><h3 id="复数加法" tabindex="-1"><a class="header-anchor" href="#复数加法" aria-hidden="true">#</a> 复数加法</h3><p>下面是 cpython 当中对于复数加法的实现，为了简洁删除了部分无用代码。</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">complex_add</span><span class="token punctuation">(</span>PyObject <span class="token operator">*</span>v<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>w<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_complex result<span class="token punctuation">;</span>
    Py_complex a<span class="token punctuation">,</span> b<span class="token punctuation">;</span>
    <span class="token function">TO_COMPLEX</span><span class="token punctuation">(</span>v<span class="token punctuation">,</span> a<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// TO_COMPLEX 这个宏的作用就是将一个 PyComplexObject 中的 Py_complex 对象存储到 a 当中</span>
    <span class="token function">TO_COMPLEX</span><span class="token punctuation">(</span>w<span class="token punctuation">,</span> b<span class="token punctuation">)</span><span class="token punctuation">;</span>
    result <span class="token operator">=</span> <span class="token function">_Py_c_sum</span><span class="token punctuation">(</span>a<span class="token punctuation">,</span> b<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 这个函数的具体实现在下方</span>
    <span class="token keyword">return</span> <span class="token function">PyComplex_FromCComplex</span><span class="token punctuation">(</span>result<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 这个函数的具体实现在下方</span>
<span class="token punctuation">}</span>

<span class="token comment">// 真正实现复数加法的函数</span>
Py_complex
<span class="token function">_Py_c_sum</span><span class="token punctuation">(</span>Py_complex a<span class="token punctuation">,</span> Py_complex b<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_complex r<span class="token punctuation">;</span>
    r<span class="token punctuation">.</span>real <span class="token operator">=</span> a<span class="token punctuation">.</span>real <span class="token operator">+</span> b<span class="token punctuation">.</span>real<span class="token punctuation">;</span>
    r<span class="token punctuation">.</span>imag <span class="token operator">=</span> a<span class="token punctuation">.</span>imag <span class="token operator">+</span> b<span class="token punctuation">.</span>imag<span class="token punctuation">;</span>
    <span class="token keyword">return</span> r<span class="token punctuation">;</span>
<span class="token punctuation">}</span>

PyObject <span class="token operator">*</span>
<span class="token function">PyComplex_FromCComplex</span><span class="token punctuation">(</span>Py_complex cval<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    PyComplexObject <span class="token operator">*</span>op<span class="token punctuation">;</span>

    <span class="token comment">/* Inline PyObject_New */</span>
    <span class="token comment">// 申请内存空间</span>
    op <span class="token operator">=</span> <span class="token punctuation">(</span>PyComplexObject <span class="token operator">*</span><span class="token punctuation">)</span> <span class="token function">PyObject_MALLOC</span><span class="token punctuation">(</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span>PyComplexObject<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>op <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 将这个对象的引用计数设置成 1</span>
    <span class="token punctuation">(</span><span class="token keyword">void</span><span class="token punctuation">)</span><span class="token function">PyObject_INIT</span><span class="token punctuation">(</span>op<span class="token punctuation">,</span> <span class="token operator">&amp;</span>PyComplex_Type<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 将复数结构体保存下来</span>
    op<span class="token operator">-&gt;</span>cval <span class="token operator">=</span> cval<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span> op<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面代码的整体过程比较简单：</p><ul><li>首先先从 PyComplexObject 提取真正的复数部分。</li><li>将提取到的两个复数进行相加操作。</li><li>根据得到的结果在创建一个 PyComplexObject 对象，并且将这个对象返回。</li></ul><h3 id="复数取反" tabindex="-1"><a class="header-anchor" href="#复数取反" aria-hidden="true">#</a> 复数取反</h3><p>复数取反操作就是将实部和虚部取相反数就可以了，这个操作也比较简单。</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">complex_neg</span><span class="token punctuation">(</span>PyComplexObject <span class="token operator">*</span>v<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_complex neg<span class="token punctuation">;</span>
    neg<span class="token punctuation">.</span>real <span class="token operator">=</span> <span class="token operator">-</span>v<span class="token operator">-&gt;</span>cval<span class="token punctuation">.</span>real<span class="token punctuation">;</span>
    neg<span class="token punctuation">.</span>imag <span class="token operator">=</span> <span class="token operator">-</span>v<span class="token operator">-&gt;</span>cval<span class="token punctuation">.</span>imag<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token function">PyComplex_FromCComplex</span><span class="token punctuation">(</span>neg<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

PyObject <span class="token operator">*</span>
<span class="token function">PyComplex_FromCComplex</span><span class="token punctuation">(</span>Py_complex cval<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    PyComplexObject <span class="token operator">*</span>op<span class="token punctuation">;</span>

    <span class="token comment">/* Inline PyObject_New */</span>
    op <span class="token operator">=</span> <span class="token punctuation">(</span>PyComplexObject <span class="token operator">*</span><span class="token punctuation">)</span> <span class="token function">PyObject_MALLOC</span><span class="token punctuation">(</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span>PyComplexObject<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>op <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">(</span><span class="token keyword">void</span><span class="token punctuation">)</span><span class="token function">PyObject_INIT</span><span class="token punctuation">(</span>op<span class="token punctuation">,</span> <span class="token operator">&amp;</span>PyComplex_Type<span class="token punctuation">)</span><span class="token punctuation">;</span>
    op<span class="token operator">-&gt;</span>cval <span class="token operator">=</span> cval<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span> op<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="repr-函数" tabindex="-1"><a class="header-anchor" href="#repr-函数" aria-hidden="true">#</a> Repr 函数</h3><p>我们现在来介绍一下一个有趣的方法，就是复数类型的 repr 函数，这个和类的 __repr__ 函数是作用是一样的我们看一下复数的输出是什么：</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> data <span class="token operator">=</span> <span class="token builtin">complex</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">)</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> data
<span class="token number">1j</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> data <span class="token operator">=</span> <span class="token builtin">complex</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">)</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> data
<span class="token punctuation">(</span><span class="token number">1</span><span class="token operator">+</span><span class="token number">1j</span><span class="token punctuation">)</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> <span class="token keyword">print</span><span class="token punctuation">(</span>data<span class="token punctuation">)</span>
<span class="token punctuation">(</span><span class="token number">1</span><span class="token operator">+</span><span class="token number">1j</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>复数的 repr 对应的 C 函数如下所示：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">complex_repr</span><span class="token punctuation">(</span>PyComplexObject <span class="token operator">*</span>v<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">int</span> precision <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token keyword">char</span> format_code <span class="token operator">=</span> <span class="token char">&#39;r&#39;</span><span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span>result <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>

    <span class="token comment">/* If these are non-NULL, they&#39;ll need to be freed. */</span>
    <span class="token keyword">char</span> <span class="token operator">*</span>pre <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token keyword">char</span> <span class="token operator">*</span>im <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>

    <span class="token comment">/* These do not need to be freed. re is either an alias
       for pre or a pointer to a constant.  lead and tail
       are pointers to constants. */</span>
    <span class="token keyword">char</span> <span class="token operator">*</span>re <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token keyword">char</span> <span class="token operator">*</span>lead <span class="token operator">=</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">;</span>
    <span class="token keyword">char</span> <span class="token operator">*</span>tail <span class="token operator">=</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">;</span>
    <span class="token comment">// 对应实部等于 0 虚部大于 0 的情况</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>v<span class="token operator">-&gt;</span>cval<span class="token punctuation">.</span>real <span class="token operator">==</span> <span class="token number">0.</span> <span class="token operator">&amp;&amp;</span> <span class="token function">copysign</span><span class="token punctuation">(</span><span class="token number">1.0</span><span class="token punctuation">,</span> v<span class="token operator">-&gt;</span>cval<span class="token punctuation">.</span>real<span class="token punctuation">)</span><span class="token operator">==</span><span class="token number">1.0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">/* Real part is +0: just output the imaginary part and do not
           include parens. */</span>
        re <span class="token operator">=</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">;</span>
        im <span class="token operator">=</span> <span class="token function">PyOS_double_to_string</span><span class="token punctuation">(</span>v<span class="token operator">-&gt;</span>cval<span class="token punctuation">.</span>imag<span class="token punctuation">,</span> format_code<span class="token punctuation">,</span>
                                   precision<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">,</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>im<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">goto</span> done<span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token comment">/* Format imaginary part with sign, real part without. Include
           parens in the result. */</span>
        <span class="token comment">// 将实部浮点数变成字符串</span>
        pre <span class="token operator">=</span> <span class="token function">PyOS_double_to_string</span><span class="token punctuation">(</span>v<span class="token operator">-&gt;</span>cval<span class="token punctuation">.</span>real<span class="token punctuation">,</span> format_code<span class="token punctuation">,</span>
                                    precision<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">,</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>pre<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">goto</span> done<span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        re <span class="token operator">=</span> pre<span class="token punctuation">;</span>
        <span class="token comment">// 将虚部浮点数变成字符串</span>
        im <span class="token operator">=</span> <span class="token function">PyOS_double_to_string</span><span class="token punctuation">(</span>v<span class="token operator">-&gt;</span>cval<span class="token punctuation">.</span>imag<span class="token punctuation">,</span> format_code<span class="token punctuation">,</span>
                                   precision<span class="token punctuation">,</span> Py_DTSF_SIGN<span class="token punctuation">,</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>im<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">goto</span> done<span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token comment">// 用什么括号包围起来</span>
        lead <span class="token operator">=</span> <span class="token string">&quot;(&quot;</span><span class="token punctuation">;</span>
        tail <span class="token operator">=</span> <span class="token string">&quot;)&quot;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    result <span class="token operator">=</span> <span class="token function">PyUnicode_FromFormat</span><span class="token punctuation">(</span><span class="token string">&quot;%s%s%sj%s&quot;</span><span class="token punctuation">,</span> lead<span class="token punctuation">,</span> re<span class="token punctuation">,</span> im<span class="token punctuation">,</span> tail<span class="token punctuation">)</span><span class="token punctuation">;</span>
  done<span class="token operator">:</span>
    <span class="token function">PyMem_Free</span><span class="token punctuation">(</span>im<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">PyMem_Free</span><span class="token punctuation">(</span>pre<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> result<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们现在修改源程序将上面的 () 两个括号变成 []，编译之后执行的结果如下所示：</p><p><img src="https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230313205120788-1639595801.png" alt=""></p><p>可以看到括号变成了 [] 。</p><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>在本篇文章当中主要给大家介绍了在 cpython 虚拟机当中对于复数这一类型的数据结构以及他的具体实现。总体来说这个数据结构比较简单，操作也相对容易，比较容易理解，最后简单介绍了一下复数类型的 repr 实现，其实这个函数和 python 的类型系统有关，目前我们还没有仔细去讨论这一点，在后续的文章当中我们将深入的去学习这个知识点，现在我们就先了解其中部分函数即可。</p><hr><p>本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython</p>`,30),k={href:"https://github.com/Chang-LeHung/CSCore",target:"_blank",rel:"noopener noreferrer"},d=n("p",null,"关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。",-1),v=n("p",null,[n("img",{src:p,alt:""})],-1);function m(b,y){const a=e("ExternalLinkIcon");return o(),c("div",null,[r,n("p",null,[s("更多精彩内容合集可访问项目："),n("a",k,[s("https://github.com/Chang-LeHung/CSCore"),l(a)])]),d,v])}const g=t(u,[["render",m],["__file","05complex_upload.html.vue"]]);export{g as default};
