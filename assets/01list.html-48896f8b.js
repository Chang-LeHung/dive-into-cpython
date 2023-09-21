import{_ as n}from"./qrcode2-187b7271.js";import{_ as s,o as a,c as t,e as p}from"./app-6b5e6c63.js";const e="/dive-into-cpython/assets/01-list-db52b38c.png",o="/dive-into-cpython/assets/02-list-1cc99a54.png",c="/dive-into-cpython/assets/03-list-06a854e6.png",i="/dive-into-cpython/assets/04-list-f3107b1c.png",l="/dive-into-cpython/assets/05-list-6d8aecb4.png",u="/dive-into-cpython/assets/06-list-ab4520dd.png",r="/dive-into-cpython/assets/07-list-74456e7f.png",k="/dive-into-cpython/assets/08-list-ac6a27fc.png",d={},v=p(`<h1 id="深入理解-python-虚拟机-列表-list-的实现原理及源码剖析" tabindex="-1"><a class="header-anchor" href="#深入理解-python-虚拟机-列表-list-的实现原理及源码剖析" aria-hidden="true">#</a> 深入理解 Python 虚拟机：列表（list）的实现原理及源码剖析</h1><p>在本篇文章当中主要给大家介绍 cpython 虚拟机当中针对列表的实现，在 Python 中，List 是一种非常常用的数据类型，可以存储任何类型的数据，并且支持各种操作，如添加、删除、查找、切片等，在本篇文章当中将深入去分析这一点是如何实现的。</p><h2 id="列表的结构" tabindex="-1"><a class="header-anchor" href="#列表的结构" aria-hidden="true">#</a> 列表的结构</h2><p>在 cpython 实现的 python 虚拟机当中，下面就是 cpython 内部列表实现的源代码：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    PyObject_VAR_HEAD
    <span class="token comment">/* Vector of pointers to list elements.  list[0] is ob_item[0], etc. */</span>
    PyObject <span class="token operator">*</span><span class="token operator">*</span>ob_item<span class="token punctuation">;</span>

    <span class="token comment">/* ob_item contains space for &#39;allocated&#39; elements.  The number
     * currently in use is ob_size.
     * Invariants:
     *     0 &lt;= ob_size &lt;= allocated
     *     len(list) == ob_size
     *     ob_item == NULL implies ob_size == allocated == 0
     * list.sort() temporarily sets allocated to -1 to detect mutations.
     *
     * Items must normally not be NULL, except during construction when
     * the list is not yet visible outside the function that builds it.
     */</span>
    Py_ssize_t allocated<span class="token punctuation">;</span>
<span class="token punctuation">}</span> PyListObject<span class="token punctuation">;</span>

<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">PyObject_VAR_HEAD</span>      <span class="token expression">PyVarObject ob_base<span class="token punctuation">;</span></span></span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    PyObject ob_base<span class="token punctuation">;</span>
    Py_ssize_t ob_size<span class="token punctuation">;</span> <span class="token comment">/* Number of items in variable part */</span>
<span class="token punctuation">}</span> PyVarObject<span class="token punctuation">;</span>

<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token class-name">_object</span> <span class="token punctuation">{</span>
    _PyObject_HEAD_EXTRA <span class="token comment">// 这个宏定义为空</span>
    Py_ssize_t ob_refcnt<span class="token punctuation">;</span>
    <span class="token keyword">struct</span> <span class="token class-name">_typeobject</span> <span class="token operator">*</span>ob_type<span class="token punctuation">;</span>
<span class="token punctuation">}</span> PyObject<span class="token punctuation">;</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>将上面的结构体展开之后，PyListObject 的结构大致如下所示：</p><p><img src="`+e+'" alt=""></p><p>现在来解释一下上面的各个字段的含义：</p><ul><li><p>Py_ssize_t，一个整型数据类型。</p></li><li><p>ob_refcnt，表示对象的引用记数的个数，这个对于垃圾回收很有用处，后面我们分析虚拟机中垃圾回收部分在深入分析。</p></li><li><p>ob_type，表示这个对象的数据类型是什么，在 python 当中有时候需要对数据的数据类型进行判断比如 isinstance, type 这两个关键字就会使用到这个字段。</p></li><li><p>ob_size，这个字段表示这个列表当中有多少个元素。</p></li><li><p>ob_item，这是一个指针，指向真正保存 python 对象数据的地址，大致的内存他们之间大致的内存布局如下所示：</p></li></ul><p><img src="'+o+`" alt=""></p><ul><li>allocated，这个表示在进行内存分配的时候，一共分配了多少个 (PyObject *) ，真实分配的内存空间为 <code>allocated * sizeof(PyObject *)</code>。</li></ul><h2 id="列表操作函数源代码分析" tabindex="-1"><a class="header-anchor" href="#列表操作函数源代码分析" aria-hidden="true">#</a> 列表操作函数源代码分析</h2><h3 id="创建列表" tabindex="-1"><a class="header-anchor" href="#创建列表" aria-hidden="true">#</a> 创建列表</h3><p>首先需要了解的是在 python 虚拟机内部为列表创建了一个数组，所有的创建的被释放的内存空间，并不会直接进行释放而是会将这些内存空间的首地址保存到这个数组当中，好让下一次申请创建新的列表的时候不需要再申请内存空间，而是直接将之前需要释放的内存直接进行复用即可。</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token comment">/* Empty list reuse scheme to save calls to malloc and free */</span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">ifndef</span> <span class="token expression">PyList_MAXFREELIST</span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">PyList_MAXFREELIST</span> <span class="token expression"><span class="token number">80</span></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">endif</span></span>
<span class="token keyword">static</span> PyListObject <span class="token operator">*</span>free_list<span class="token punctuation">[</span>PyList_MAXFREELIST<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token keyword">static</span> <span class="token keyword">int</span> numfree <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>free_list，保存被释放的内存空间的首地址。</li><li>numfree，目前 free_list 当中有多少个地址是可以被使用的，事实上是 free_list 前 numfree 个首地址是可以被使用的。</li></ul><p>创建链表的代码如下所示（为了精简删除了一些代码只保留核心部分）：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code>PyObject <span class="token operator">*</span>
<span class="token function">PyList_New</span><span class="token punctuation">(</span>Py_ssize_t size<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    PyListObject <span class="token operator">*</span>op<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> nbytes<span class="token punctuation">;</span>

    <span class="token comment">/* Check for overflow without an actual overflow,
     *  which can cause compiler to optimise out */</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token class-name">size_t</span><span class="token punctuation">)</span>size <span class="token operator">&gt;</span> PY_SIZE_MAX <span class="token operator">/</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    nbytes <span class="token operator">=</span> size <span class="token operator">*</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// 如果 numfree 不等于 0 那么说明现在 free_list 有之前使用被释放的内存空间直接使用这部分即可</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>numfree<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        numfree<span class="token operator">--</span><span class="token punctuation">;</span>
        op <span class="token operator">=</span> free_list<span class="token punctuation">[</span>numfree<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// 将对应的首地址返回</span>
        <span class="token function">_Py_NewReference</span><span class="token punctuation">(</span><span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span>op<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 这条语句的含义是将 op 这个对象的 reference count 设置成 1</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
      <span class="token comment">// 如果没有空闲的内存空间 那么就需要申请内存空间 这个函数也会对对象的 reference count 进行初始化 设置成 1</span>
        op <span class="token operator">=</span> <span class="token function">PyObject_GC_New</span><span class="token punctuation">(</span>PyListObject<span class="token punctuation">,</span> <span class="token operator">&amp;</span>PyList_Type<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>op <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
            <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token comment">/* 下面是申请列表对象当中的 ob_item 申请内存空间，上面只是给列表本身申请内存空间，但是列表当中有许多元素
  	保存这些元素也是需要内存空间的 下面便是给这些对象申请内存空间
  */</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>size <span class="token operator">&lt;=</span> <span class="token number">0</span><span class="token punctuation">)</span>
        op<span class="token operator">-&gt;</span>ob_item <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token keyword">else</span> <span class="token punctuation">{</span>
        op<span class="token operator">-&gt;</span>ob_item <span class="token operator">=</span> <span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token operator">*</span><span class="token punctuation">)</span> <span class="token function">PyMem_MALLOC</span><span class="token punctuation">(</span>nbytes<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token comment">// 如果申请内存空间失败 则报错</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>op<span class="token operator">-&gt;</span>ob_item <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token function">Py_DECREF</span><span class="token punctuation">(</span>op<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">return</span> <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
      <span class="token comment">// 对元素进行初始化操作 全部赋值成 0</span>
        <span class="token function">memset</span><span class="token punctuation">(</span>op<span class="token operator">-&gt;</span>ob_item<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">,</span> nbytes<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token comment">// Py_SIZE 是一个宏</span>
    <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>op<span class="token punctuation">)</span> <span class="token operator">=</span> size<span class="token punctuation">;</span> <span class="token comment">// 这条语句会被展开成 (PyVarObject*)(ob))-&gt;ob_size = size</span>
  <span class="token comment">// 分配数组的元素个数是 size</span>
    op<span class="token operator">-&gt;</span>allocated <span class="token operator">=</span> size<span class="token punctuation">;</span>
  <span class="token comment">// 下面这条语句对于垃圾回收比较重要 主要作用就是将这个列表对象加入到垃圾回收的链表当中</span>
  <span class="token comment">// 后面如果这个对象的 reference count 变成 0 或者其他情况 就可以进行垃圾回收了</span>
    <span class="token function">_PyObject_GC_TRACK</span><span class="token punctuation">(</span>op<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span> op<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在 cpython 当中，创建链表的字节码为 BUILD_LIST，我们可以在文件 ceval.c 当中找到对应的字节码对应的执行步骤：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token function">TARGET</span><span class="token punctuation">(</span>BUILD_LIST<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    PyObject <span class="token operator">*</span>list <span class="token operator">=</span>  <span class="token function">PyList_New</span><span class="token punctuation">(</span>oparg<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>list <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
        <span class="token keyword">goto</span> error<span class="token punctuation">;</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token operator">--</span>oparg <span class="token operator">&gt;=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        PyObject <span class="token operator">*</span>item <span class="token operator">=</span> <span class="token function">POP</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">PyList_SET_ITEM</span><span class="token punctuation">(</span>list<span class="token punctuation">,</span> oparg<span class="token punctuation">,</span> item<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token function">PUSH</span><span class="token punctuation">(</span>list<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">DISPATCH</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>从上面 BUILD_LIST 字节码对应的解释步骤可以知道，在解释执行字节码 BUILD_LIST 的时候确实调用了函数 PyList_New 创建一个新的列表。</p><h3 id="列表-append-函数" tabindex="-1"><a class="header-anchor" href="#列表-append-函数" aria-hidden="true">#</a> 列表 append 函数</h3><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token comment">// 这个函数的传入参数是列表本身 self 需要 append 的元素为 v</span>
  <span class="token comment">// 也就是将对象 v 加入到列表 self 当中</span>
<span class="token function">listappend</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>v<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">app1</span><span class="token punctuation">(</span>self<span class="token punctuation">,</span> v<span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span>
        Py_RETURN_NONE<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> <span class="token keyword">int</span>
<span class="token function">app1</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>v<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
  <span class="token comment">// PyList_GET_SIZE(self) 展开之后为 ((PyVarObject*)(self))-&gt;ob_size</span>
    Py_ssize_t n <span class="token operator">=</span> <span class="token function">PyList_GET_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token function">assert</span> <span class="token punctuation">(</span>v <span class="token operator">!=</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// 如果元素的个数已经等于允许的最大的元素个数 就报错</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>n <span class="token operator">==</span> PY_SSIZE_T_MAX<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">PyErr_SetString</span><span class="token punctuation">(</span>PyExc_OverflowError<span class="token punctuation">,</span>
            <span class="token string">&quot;cannot add more objects to list&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
	<span class="token comment">// 下面的函数 list_resize 会保存 ob_item 指向的位置能够容纳最少 n+1 个元素（PyObject *）</span>
  <span class="token comment">// 如果容量不够就会进行扩容操作</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">list_resize</span><span class="token punctuation">(</span>self<span class="token punctuation">,</span> n<span class="token operator">+</span><span class="token number">1</span><span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
		
  <span class="token comment">// 将对象 v 的 reference count 加一 因为列表当中使用了一次这个对象 所以对象的引用计数需要进行加一操作</span>
    <span class="token function">Py_INCREF</span><span class="token punctuation">(</span>v<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">PyList_SET_ITEM</span><span class="token punctuation">(</span>self<span class="token punctuation">,</span> n<span class="token punctuation">,</span> v<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 宏展开之后 ((PyListObject *)(op))-&gt;ob_item[i] = v</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="列表的扩容机制" tabindex="-1"><a class="header-anchor" href="#列表的扩容机制" aria-hidden="true">#</a> 列表的扩容机制</h3><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> <span class="token keyword">int</span>
<span class="token function">list_resize</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">,</span> Py_ssize_t newsize<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    PyObject <span class="token operator">*</span><span class="token operator">*</span>items<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> new_allocated<span class="token punctuation">;</span>
    Py_ssize_t allocated <span class="token operator">=</span> self<span class="token operator">-&gt;</span>allocated<span class="token punctuation">;</span>

    <span class="token comment">/* Bypass realloc() when a previous overallocation is large enough
       to accommodate the newsize.  If the newsize falls lower than half
       the allocated size, then proceed with the realloc() to shrink the list.
    */</span>
  <span class="token comment">// 如果列表已经分配的元素个数大于需求个数 newsize 的就直接返回不需要进行扩容</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>allocated <span class="token operator">&gt;=</span> newsize <span class="token operator">&amp;&amp;</span> newsize <span class="token operator">&gt;=</span> <span class="token punctuation">(</span>allocated <span class="token operator">&gt;&gt;</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">assert</span><span class="token punctuation">(</span>self<span class="token operator">-&gt;</span>ob_item <span class="token operator">!=</span> <span class="token constant">NULL</span> <span class="token operator">||</span> newsize <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span> <span class="token operator">=</span> newsize<span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token comment">/* This over-allocates proportional to the list size, making room
     * for additional growth.  The over-allocation is mild, but is
     * enough to give linear-time amortized behavior over a long
     * sequence of appends() in the presence of a poorly-performing
     * system realloc().
     * The growth pattern is:  0, 4, 8, 16, 25, 35, 46, 58, 72, 88, ...
     */</span>
  <span class="token comment">// 这是核心的数组大小扩容机制 new_allocated 表示新增的数组大小</span>
    new_allocated <span class="token operator">=</span> <span class="token punctuation">(</span>newsize <span class="token operator">&gt;&gt;</span> <span class="token number">3</span><span class="token punctuation">)</span> <span class="token operator">+</span> <span class="token punctuation">(</span>newsize <span class="token operator">&lt;</span> <span class="token number">9</span> <span class="token operator">?</span> <span class="token number">3</span> <span class="token operator">:</span> <span class="token number">6</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">/* check for integer overflow */</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>new_allocated <span class="token operator">&gt;</span> PY_SIZE_MAX <span class="token operator">-</span> newsize<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        new_allocated <span class="token operator">+=</span> newsize<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>newsize <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span>
        new_allocated <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    items <span class="token operator">=</span> self<span class="token operator">-&gt;</span>ob_item<span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>new_allocated <span class="token operator">&lt;=</span> <span class="token punctuation">(</span>PY_SIZE_MAX <span class="token operator">/</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
      	<span class="token comment">// PyMem_RESIZE 这是一个宏定义 会申请 new_allocated 个数元素并且将原来数组的元素拷贝到新的数组当中</span>
        <span class="token function">PyMem_RESIZE</span><span class="token punctuation">(</span>items<span class="token punctuation">,</span> PyObject <span class="token operator">*</span><span class="token punctuation">,</span> new_allocated<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">else</span>
        items <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
  <span class="token comment">// 如果没有申请到内存 那么报错</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>items <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token comment">// 更新列表当中的元素数据</span>
    self<span class="token operator">-&gt;</span>ob_item <span class="token operator">=</span> items<span class="token punctuation">;</span>
    <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span> <span class="token operator">=</span> newsize<span class="token punctuation">;</span>
    self<span class="token operator">-&gt;</span>allocated <span class="token operator">=</span> new_allocated<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在上面的扩容机制下，数组的大小变化大致如下所示： $$ newsize \\approx size \\cdot (size + 1)^{\\frac{1}{8}} $$ <img src="`+c+'" alt=""></p><h3 id="列表的插入函数-insert" tabindex="-1"><a class="header-anchor" href="#列表的插入函数-insert" aria-hidden="true">#</a> 列表的插入函数 insert</h3><p>在列表当中插入一个数据比较简单，只需要将插入位置和其后面的元素往后移动一个位置即可，整个过程如下所示：</p><p><img src="'+i+`" alt=""></p><p>在 cpython 当中列表的插入函数的实现如下所示：</p><ul><li>参数 op 表示往哪个链表当中插入元素。</li><li>参数 where 表示在链表的哪个位置插入元素。</li><li>参数 newitem 表示新插入的元素。</li></ul><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">int</span>
<span class="token function">PyList_Insert</span><span class="token punctuation">(</span>PyObject <span class="token operator">*</span>op<span class="token punctuation">,</span> Py_ssize_t where<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>newitem<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
  <span class="token comment">// 检查是否是列表类型</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token function">PyList_Check</span><span class="token punctuation">(</span>op<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">PyErr_BadInternalCall</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token comment">// 如果是列表类型则进行插入操作</span>
    <span class="token keyword">return</span> <span class="token function">ins1</span><span class="token punctuation">(</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span><span class="token punctuation">)</span>op<span class="token punctuation">,</span> where<span class="token punctuation">,</span> newitem<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> <span class="token keyword">int</span>
<span class="token function">ins1</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">,</span> Py_ssize_t where<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>v<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_ssize_t i<span class="token punctuation">,</span> n <span class="token operator">=</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span><span class="token operator">*</span>items<span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>v <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">PyErr_BadInternalCall</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token comment">// 如果列表的元素个数超过限制 则进行报错</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>n <span class="token operator">==</span> PY_SSIZE_T_MAX<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">PyErr_SetString</span><span class="token punctuation">(</span>PyExc_OverflowError<span class="token punctuation">,</span>
            <span class="token string">&quot;cannot add more objects to list&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token comment">// 确保列表能够容纳 n + 1 个元素</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">list_resize</span><span class="token punctuation">(</span>self<span class="token punctuation">,</span> n<span class="token operator">+</span><span class="token number">1</span><span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
  <span class="token comment">// 这里是 python 的一个小 trick 就是下标能够有负数的原理</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>where <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        where <span class="token operator">+=</span> n<span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>where <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span>
            where <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>where <span class="token operator">&gt;</span> n<span class="token punctuation">)</span>
        where <span class="token operator">=</span> n<span class="token punctuation">;</span>
    items <span class="token operator">=</span> self<span class="token operator">-&gt;</span>ob_item<span class="token punctuation">;</span>
  <span class="token comment">// 从后往前进行元素的拷贝操作，也就是将插入位置及其之后的元素往后移动一个位置</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span>i <span class="token operator">=</span> n<span class="token punctuation">;</span> <span class="token operator">--</span>i <span class="token operator">&gt;=</span> where<span class="token punctuation">;</span> <span class="token punctuation">)</span>
        items<span class="token punctuation">[</span>i<span class="token operator">+</span><span class="token number">1</span><span class="token punctuation">]</span> <span class="token operator">=</span> items<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token comment">// 因为链表应用的对象，因此对象的 reference count 需要进行加一操作</span>
    <span class="token function">Py_INCREF</span><span class="token punctuation">(</span>v<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// 在列表当中保存对象 v </span>
    items<span class="token punctuation">[</span>where<span class="token punctuation">]</span> <span class="token operator">=</span> v<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="列表的删除函数-remove" tabindex="-1"><a class="header-anchor" href="#列表的删除函数-remove" aria-hidden="true">#</a> 列表的删除函数 remove</h3><p>对于数组 ob_item 来说，删除一个元素就需要将这个元素后面的元素往前移动，因此整个过程如下所示：</p><p><img src="`+l+`" alt=""></p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">listremove</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>v<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_ssize_t i<span class="token punctuation">;</span>
  	<span class="token comment">// 编译数组 ob_item 查找和对象 v 相等的元素并且将其删除</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span>i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">int</span> cmp <span class="token operator">=</span> <span class="token function">PyObject_RichCompareBool</span><span class="token punctuation">(</span>self<span class="token operator">-&gt;</span>ob_item<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">,</span> v<span class="token punctuation">,</span> Py_EQ<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>cmp <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">list_ass_slice</span><span class="token punctuation">(</span>self<span class="token punctuation">,</span> i<span class="token punctuation">,</span> i<span class="token operator">+</span><span class="token number">1</span><span class="token punctuation">,</span>
                               <span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span><span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span>
                Py_RETURN_NONE<span class="token punctuation">;</span>
            <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>cmp <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span>
            <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  	<span class="token comment">// 如果没有找到这个元素就进行报错处理 在下面有一个例子重新编译 python 解释器 将这个错误内容修改的例子</span>
    <span class="token function">PyErr_SetString</span><span class="token punctuation">(</span>PyExc_ValueError<span class="token punctuation">,</span> <span class="token string">&quot;list.remove(x): x not in list&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行的 python 程序内容为：</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code>data <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
data<span class="token punctuation">.</span>remove<span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>下面是整个修改内容和报错结果：</p><p><img src="`+u+`" alt=""></p><p>从上面的结果我们可以看到的是，我们修改的错误信息正确打印了出来。</p><h3 id="列表的统计函数-count" tabindex="-1"><a class="header-anchor" href="#列表的统计函数-count" aria-hidden="true">#</a> 列表的统计函数 count</h3><p>这个函数的主要作用就是统计列表 self 当中有多少个元素和 v 相等。</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">listcount</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>v<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_ssize_t count <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    Py_ssize_t i<span class="token punctuation">;</span>

    <span class="token keyword">for</span> <span class="token punctuation">(</span>i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">int</span> cmp <span class="token operator">=</span> <span class="token function">PyObject_RichCompareBool</span><span class="token punctuation">(</span>self<span class="token operator">-&gt;</span>ob_item<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">,</span> v<span class="token punctuation">,</span> Py_EQ<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token comment">// 如果相等则将 count 进行加一操作</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>cmp <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">)</span>
            count<span class="token operator">++</span><span class="token punctuation">;</span>
      <span class="token comment">// 如果出现错误就返回 NULL</span>
        <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>cmp <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span>
            <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token comment">// 将一个 Py_ssize_t 的变量变成 python 当中的对象</span>
    <span class="token keyword">return</span> <span class="token function">PyLong_FromSsize_t</span><span class="token punctuation">(</span>count<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="列表的拷贝函数-copy" tabindex="-1"><a class="header-anchor" href="#列表的拷贝函数-copy" aria-hidden="true">#</a> 列表的拷贝函数 copy</h3><p>这是列表的浅拷贝函数，它只拷贝了真实 python 对象的指针，并没有拷贝真实的 python 对象 ，从下面的代码可以知道列表的拷贝是浅拷贝，当 b 对列表当中的元素进行修改时，列表 a 当中的元素也改变了。如果需要进行深拷贝可以使用 copy 模块当中的 deepcopy 函数。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> a <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token number">3</span><span class="token punctuation">,</span> <span class="token number">4</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> b <span class="token operator">=</span> a<span class="token punctuation">.</span>copy<span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> b<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token number">5</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> b
<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token number">3</span><span class="token punctuation">,</span> <span class="token number">5</span><span class="token punctuation">]</span><span class="token punctuation">]</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>copy 函数对应的源代码（listcopy）如下所示：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">listcopy</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token function">list_slice</span><span class="token punctuation">(</span>self<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">,</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">list_slice</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>a<span class="token punctuation">,</span> Py_ssize_t ilow<span class="token punctuation">,</span> Py_ssize_t ihigh<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
  <span class="token comment">// Py_SIZE(a) 返回列表 a 当中元素的个数（注意不是数组的长度 allocated）</span>
    PyListObject <span class="token operator">*</span>np<span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span><span class="token operator">*</span>src<span class="token punctuation">,</span> <span class="token operator">*</span><span class="token operator">*</span>dest<span class="token punctuation">;</span>
    Py_ssize_t i<span class="token punctuation">,</span> len<span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>ilow <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span>
        ilow <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>ilow <span class="token operator">&gt;</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>a<span class="token punctuation">)</span><span class="token punctuation">)</span>
        ilow <span class="token operator">=</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>a<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>ihigh <span class="token operator">&lt;</span> ilow<span class="token punctuation">)</span>
        ihigh <span class="token operator">=</span> ilow<span class="token punctuation">;</span>
    <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>ihigh <span class="token operator">&gt;</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>a<span class="token punctuation">)</span><span class="token punctuation">)</span>
        ihigh <span class="token operator">=</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>a<span class="token punctuation">)</span><span class="token punctuation">;</span>
    len <span class="token operator">=</span> ihigh <span class="token operator">-</span> ilow<span class="token punctuation">;</span>
    np <span class="token operator">=</span> <span class="token punctuation">(</span>PyListObject <span class="token operator">*</span><span class="token punctuation">)</span> <span class="token function">PyList_New</span><span class="token punctuation">(</span>len<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>np <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>

    src <span class="token operator">=</span> a<span class="token operator">-&gt;</span>ob_item <span class="token operator">+</span> ilow<span class="token punctuation">;</span>
    dest <span class="token operator">=</span> np<span class="token operator">-&gt;</span>ob_item<span class="token punctuation">;</span>
  <span class="token comment">// 可以看到这里循环拷贝的是指向真实 python 对象的指针 并不是真实的对象</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span>i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> len<span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        PyObject <span class="token operator">*</span>v <span class="token operator">=</span> src<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
      <span class="token comment">// 同样的因为并没有创建新的对象，但是这个对象被新的列表使用到啦 因此他的 reference count 需要进行加一操作 Py_INCREF(v) 的作用：将对象 v 的 reference count 加一</span>
        <span class="token function">Py_INCREF</span><span class="token punctuation">(</span>v<span class="token punctuation">)</span><span class="token punctuation">;</span>
        dest<span class="token punctuation">[</span>i<span class="token punctuation">]</span> <span class="token operator">=</span> v<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span>np<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>下图就是使用 a.copy() 浅拷贝的时候，内存的布局的示意图，可以看到列表指向的对象数组发生了变化，但是数组中元素指向的 python 对象并没有发生变化。</p><p><img src="`+r+'" alt=""></p><p>下面是对列表对象进行深拷贝的时候内存的大致示意图，可以看到数组指向的 python 对象也是不一样的。</p><p><img src="'+k+`" alt=""></p><h3 id="列表的清空函数-clear" tabindex="-1"><a class="header-anchor" href="#列表的清空函数-clear" aria-hidden="true">#</a> 列表的清空函数 clear</h3><p>当我们在使用 list.clear() 的时候会调用下面这个函数。清空列表需要注意的就是将表示列表当中元素个数的 ob_size 字段设置成 0 ，同时将列表当中所有的对象的 reference count 设置进行 -1 操作，这个操作是通过宏 Py_XDECREF 实现的，这个宏还会做另外一件事就是如果这个对象的引用计数变成 0 了，那么就会直接释放他的内存。</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">listclear</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token function">list_clear</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">;</span>
    Py_RETURN_NONE<span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> <span class="token keyword">int</span>
<span class="token function">list_clear</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>a<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_ssize_t i<span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span><span class="token operator">*</span>item <span class="token operator">=</span> a<span class="token operator">-&gt;</span>ob_item<span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>item <span class="token operator">!=</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">/* Because XDECREF can recursively invoke operations on
           this list, we make it empty first. */</span>
        i <span class="token operator">=</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>a<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>a<span class="token punctuation">)</span> <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
        a<span class="token operator">-&gt;</span>ob_item <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
        a<span class="token operator">-&gt;</span>allocated <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
        <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token operator">--</span>i <span class="token operator">&gt;=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token function">Py_XDECREF</span><span class="token punctuation">(</span>item<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token function">PyMem_FREE</span><span class="token punctuation">(</span>item<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token comment">/* Never fails; the return value can be ignored.
       Note that there is no guarantee that the list is actually empty
       at this point, because XDECREF may have populated it again! */</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="列表反转函数-reverse" tabindex="-1"><a class="header-anchor" href="#列表反转函数-reverse" aria-hidden="true">#</a> 列表反转函数 reverse</h3><p>在 python 当中如果我们想要反转类表当中的内容的话，就会使用这个函数 reverse 。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> a <span class="token operator">=</span> <span class="token punctuation">[</span>i <span class="token keyword">for</span> i <span class="token keyword">in</span> <span class="token builtin">range</span><span class="token punctuation">(</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">]</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> a<span class="token punctuation">.</span>reverse<span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> a
<span class="token punctuation">[</span><span class="token number">9</span><span class="token punctuation">,</span> <span class="token number">8</span><span class="token punctuation">,</span> <span class="token number">7</span><span class="token punctuation">,</span> <span class="token number">6</span><span class="token punctuation">,</span> <span class="token number">5</span><span class="token punctuation">,</span> <span class="token number">4</span><span class="token punctuation">,</span> <span class="token number">3</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">]</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>其对应的源程序如下所示：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">listreverse</span><span class="token punctuation">(</span>PyListObject <span class="token operator">*</span>self<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">Py_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span> <span class="token operator">&gt;</span> <span class="token number">1</span><span class="token punctuation">)</span>
        <span class="token function">reverse_slice</span><span class="token punctuation">(</span>self<span class="token operator">-&gt;</span>ob_item<span class="token punctuation">,</span> self<span class="token operator">-&gt;</span>ob_item <span class="token operator">+</span> <span class="token function">Py_SIZE</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    Py_RETURN_NONE<span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> <span class="token keyword">void</span>
<span class="token function">reverse_slice</span><span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token operator">*</span>lo<span class="token punctuation">,</span> PyObject <span class="token operator">*</span><span class="token operator">*</span>hi<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token function">assert</span><span class="token punctuation">(</span>lo <span class="token operator">&amp;&amp;</span> hi<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token operator">--</span>hi<span class="token punctuation">;</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>lo <span class="token operator">&lt;</span> hi<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        PyObject <span class="token operator">*</span>t <span class="token operator">=</span> <span class="token operator">*</span>lo<span class="token punctuation">;</span>
        <span class="token operator">*</span>lo <span class="token operator">=</span> <span class="token operator">*</span>hi<span class="token punctuation">;</span>
        <span class="token operator">*</span>hi <span class="token operator">=</span> t<span class="token punctuation">;</span>
        <span class="token operator">++</span>lo<span class="token punctuation">;</span>
        <span class="token operator">--</span>hi<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的源程序还是比较容易理解的，给 reverse_slice 传递的参数就是保存数据的数组的首尾地址，然后不断的将首尾数据进行交换（其实是交换指针指向的地址）。</p><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>本文介绍了 Python 中列表对象的实现细节，介绍了一些常用函数的实现，包括列表的扩容机制，插入、删除、统计、拷贝、清空和反转等操作的实现方式。</p><ul><li>列表的扩容机制采用了一种线性时间摊销的方式，使得列表的插入操作具有较好的时间复杂度。</li><li>列表的插入、删除和统计操作都是通过操作ob_item 数组实现的，其中插入和删除操作需要移动数组中的元素。</li><li>列表的拷贝操作是浅拷贝，需要注意的是进行深拷贝需要使用 copy 模块当中的 deepcopy 函数。</li><li>列表清空会将 ob_size 字段设置成 0，同时需要将列表当中的所有对象的 reference count 进行 -1 操作，从而避免内存泄漏。</li><li>列表的反转操作可以通过交换 ob_item 数组中前后元素的位置实现。</li></ul><p>总之，了解 Python 列表对象的实现细节有助于我们更好地理解 Python 的内部机制，从而编写更高效、更可靠的 Python 代码。</p><p><img src="`+n+'" alt=""></p>',67),m=[v];function b(y,_){return a(),t("div",null,m)}const w=s(d,[["render",b],["__file","01list.html.vue"]]);export{w as default};
