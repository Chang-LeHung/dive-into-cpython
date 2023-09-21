import{_ as t}from"./qrcode2-187b7271.js";import{_ as p,r as e,o,c,a as n,d as s,b as l,e as i}from"./app-6b5e6c63.js";const u="/dive-into-cpython/assets/25-set-5dadef63.png",r={},k=i(`<h1 id="深入理解-python-虚拟机-集合-set-的实现原理及源码剖析" tabindex="-1"><a class="header-anchor" href="#深入理解-python-虚拟机-集合-set-的实现原理及源码剖析" aria-hidden="true">#</a> 深入理解 Python 虚拟机：集合（set）的实现原理及源码剖析</h1><p>在本篇文章当中主要给大家介绍在 cpython 虚拟机当中的集合 set 的实现原理以及对应的源代码分析。</p><h2 id="数据结构介绍" tabindex="-1"><a class="header-anchor" href="#数据结构介绍" aria-hidden="true">#</a> 数据结构介绍</h2><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    PyObject_HEAD

    Py_ssize_t fill<span class="token punctuation">;</span>            <span class="token comment">/* Number active and dummy entries*/</span>
    Py_ssize_t used<span class="token punctuation">;</span>            <span class="token comment">/* Number active entries */</span>

    <span class="token comment">/* The table contains mask + 1 slots, and that&#39;s a power of 2.
     * We store the mask instead of the size because the mask is more
     * frequently needed.
     */</span>
    Py_ssize_t mask<span class="token punctuation">;</span>

    <span class="token comment">/* The table points to a fixed-size smalltable for small tables
     * or to additional malloc&#39;ed memory for bigger tables.
     * The table pointer is never NULL which saves us from repeated
     * runtime null-tests.
     */</span>
    setentry <span class="token operator">*</span>table<span class="token punctuation">;</span>
    Py_hash_t hash<span class="token punctuation">;</span>             <span class="token comment">/* Only used by frozenset objects */</span>
    Py_ssize_t finger<span class="token punctuation">;</span>          <span class="token comment">/* Search finger for pop() */</span>

    setentry smalltable<span class="token punctuation">[</span>PySet_MINSIZE<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// #define PySet_MINSIZE 8</span>
    PyObject <span class="token operator">*</span>weakreflist<span class="token punctuation">;</span>      <span class="token comment">/* List of weak references */</span>
<span class="token punctuation">}</span> PySetObject<span class="token punctuation">;</span>

<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    PyObject <span class="token operator">*</span>key<span class="token punctuation">;</span>
    Py_hash_t hash<span class="token punctuation">;</span>             <span class="token comment">/* Cached hash code of the key */</span>
<span class="token punctuation">}</span> setentry<span class="token punctuation">;</span>

<span class="token keyword">static</span> PyObject _dummy_struct<span class="token punctuation">;</span>

<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">dummy</span> <span class="token expression"><span class="token punctuation">(</span><span class="token operator">&amp;</span>_dummy_struct<span class="token punctuation">)</span></span></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的数据结果用图示如下图所示：</p><p><img src="`+u+`" alt="25-set"></p><p>上面各个字段的含义如下所示：</p><ul><li>dummy entries ：如果在哈希表当中的数组原来有一个数据，如果我们删除这个 entry 的时候，对应的位置就会被赋值成 dummy，与 dummy 有关的定义在上面的代码当中已经给出，dummy 对象的哈希值等于 -1。</li><li>明白 dummy 的含义之后，fill 和 used 这两个字段的含义就比较容易理解了，used 就是数组当中真实有效的对象的个数，fill 还需要加上 dummy 对象的个数。</li><li>mask，数组的长度等于 $2^n$，mask 的值等于 $2^n - 1$ 。</li><li>table，实际保存 entry 对象的数组。</li><li>hash，这个值对 frozenset 有用，保存计算出来的哈希值。如果你的数组很大的话，计算哈希值其实也是一个比较大的开销，因此可以将计算出来的哈希值保存下来，以便下一次求的时候可以将哈希值直接返回，这也印证了在 python 当中为什么只有 immutable 对象才能够放入到集合和字典当中，因为哈希值计算一次保存下来了，如果再加入对象对象的哈希值也会变化，这样做就会发生错误了。</li><li>finger，主要是用于记录下一个开始寻找被删除对象的下标。</li><li>smalltable，默认的小数组，cpython 设置的一半的集合对象不会超过这个大小（8），因此在申请一个集合对象的时候直接就申请了这个小数组的内存大小。</li><li>weakrelist，这个字段主要和垃圾回收有关，这里暂时不进行详细说明。</li></ul><h2 id="创建集合对象" tabindex="-1"><a class="header-anchor" href="#创建集合对象" aria-hidden="true">#</a> 创建集合对象</h2><p>首先先了解一下创建一个集合对象的过程，和前面其他的对象是一样的，首先先申请内存空间，然后进行相关的初始化操作。</p><p>这个函数有两个参数，使用第一个参数申请内存空间，然后后面一个参数如果不为 NULL 而且是一个可迭代对象的话，就将这里面的对象加入到集合当中。</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">make_new_set</span><span class="token punctuation">(</span>PyTypeObject <span class="token operator">*</span>type<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>iterable<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    PySetObject <span class="token operator">*</span>so <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>

    <span class="token comment">/* create PySetObject structure */</span>
    so <span class="token operator">=</span> <span class="token punctuation">(</span>PySetObject <span class="token operator">*</span><span class="token punctuation">)</span>type<span class="token operator">-&gt;</span><span class="token function">tp_alloc</span><span class="token punctuation">(</span>type<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>so <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token comment">// 集合当中目前没有任何对象，因此 fill 和 used 都是 0</span>
    so<span class="token operator">-&gt;</span>fill <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>used <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token comment">// 初始化哈希表当中的数组长度为 PySet_MINSIZE 因此 mask = PySet_MINSIZE - 1</span>
    so<span class="token operator">-&gt;</span>mask <span class="token operator">=</span> PySet_MINSIZE <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token comment">// 让 table 指向存储 entry 的数组</span>
    so<span class="token operator">-&gt;</span>table <span class="token operator">=</span> so<span class="token operator">-&gt;</span>smalltable<span class="token punctuation">;</span>
    <span class="token comment">// 将哈希值设置成 -1 表示还没有进行计算</span>
    so<span class="token operator">-&gt;</span>hash <span class="token operator">=</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>finger <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>weakreflist <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token comment">// 如果 iterable 不等于 NULL 则需要将它指向的对象当中所有的元素加入到集合当中</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>iterable <span class="token operator">!=</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// 调用函数 set_update_internal 将对象 iterable 当中的元素加入到集合当中</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">set_update_internal</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> iterable<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token function">Py_DECREF</span><span class="token punctuation">(</span>so<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>PyObject <span class="token operator">*</span><span class="token punctuation">)</span>so<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="往集合当中加入数据" tabindex="-1"><a class="header-anchor" href="#往集合当中加入数据" aria-hidden="true">#</a> 往集合当中加入数据</h2><p>首先我们先大致理清楚往集合当中插入数据的流程：</p><ul><li>首先根据对象的哈希值，计算需要将对象放在哪个位置，也就是对应数组的下标。</li><li>查看对应下标的位置是否存在对象，如果不存在对象则将数据保存在对应下标的位置。</li><li>如果对应的位置存在对象，则查看是否和当前要插入的对象相等，则返回。</li><li>如果不相等，则使用类似于线性探测的方式去寻找下一个要插入的位置（具体的实现可以查看相关代码，具体的操作为线性探测法 + 开放地址法）。</li></ul><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">set_add</span><span class="token punctuation">(</span>PySetObject <span class="token operator">*</span>so<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>key<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">set_add_key</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> key<span class="token punctuation">)</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    Py_RETURN_NONE<span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> <span class="token keyword">int</span>
<span class="token function">set_add_key</span><span class="token punctuation">(</span>PySetObject <span class="token operator">*</span>so<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>key<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    setentry entry<span class="token punctuation">;</span>
    Py_hash_t hash<span class="token punctuation">;</span>
    <span class="token comment">// 这里就查看一下是否是字符串，如果是字符串直接拿到哈希值</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token function">PyUnicode_CheckExact</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span> <span class="token operator">||</span>
        <span class="token punctuation">(</span>hash <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">(</span>PyASCIIObject <span class="token operator">*</span><span class="token punctuation">)</span> key<span class="token punctuation">)</span><span class="token operator">-&gt;</span>hash<span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      	<span class="token comment">// 如果不是字符串则需要调用对象自己的哈希函数求得对应的哈希值</span>
        hash <span class="token operator">=</span> <span class="token function">PyObject_Hash</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>hash <span class="token operator">==</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span>
            <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token comment">// 创建一个 entry 对象将这个对象加入到哈希表当中</span>
    entry<span class="token punctuation">.</span>key <span class="token operator">=</span> key<span class="token punctuation">;</span>
    entry<span class="token punctuation">.</span>hash <span class="token operator">=</span> hash<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token function">set_add_entry</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> <span class="token operator">&amp;</span>entry<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> <span class="token keyword">int</span>
<span class="token function">set_add_entry</span><span class="token punctuation">(</span>PySetObject <span class="token operator">*</span>so<span class="token punctuation">,</span> setentry <span class="token operator">*</span>entry<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_ssize_t n_used<span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span>key <span class="token operator">=</span> entry<span class="token operator">-&gt;</span>key<span class="token punctuation">;</span>
    Py_hash_t hash <span class="token operator">=</span> entry<span class="token operator">-&gt;</span>hash<span class="token punctuation">;</span>

    <span class="token function">assert</span><span class="token punctuation">(</span>so<span class="token operator">-&gt;</span>fill <span class="token operator">&lt;=</span> so<span class="token operator">-&gt;</span>mask<span class="token punctuation">)</span><span class="token punctuation">;</span>  <span class="token comment">/* at least one empty slot */</span>
    n_used <span class="token operator">=</span> so<span class="token operator">-&gt;</span>used<span class="token punctuation">;</span>
    <span class="token function">Py_INCREF</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 调用函数 set_insert_key 将对象插入到数组当中</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">set_insert_key</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> key<span class="token punctuation">,</span> hash<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">Py_DECREF</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token comment">// 这里就是哈希表的核心的扩容机制</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token punctuation">(</span>so<span class="token operator">-&gt;</span>used <span class="token operator">&gt;</span> n_used <span class="token operator">&amp;&amp;</span> so<span class="token operator">-&gt;</span>fill<span class="token operator">*</span><span class="token number">3</span> <span class="token operator">&gt;=</span> <span class="token punctuation">(</span>so<span class="token operator">-&gt;</span>mask<span class="token operator">+</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token operator">*</span><span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token comment">// 这是扩容大小的逻辑</span>
    <span class="token keyword">return</span> <span class="token function">set_table_resize</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> so<span class="token operator">-&gt;</span>used<span class="token operator">&gt;</span><span class="token number">50000</span> <span class="token operator">?</span> so<span class="token operator">-&gt;</span>used<span class="token operator">*</span><span class="token number">2</span> <span class="token operator">:</span> so<span class="token operator">-&gt;</span>used<span class="token operator">*</span><span class="token number">4</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> <span class="token keyword">int</span>
<span class="token function">set_insert_key</span><span class="token punctuation">(</span>PySetObject <span class="token operator">*</span>so<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>key<span class="token punctuation">,</span> Py_hash_t hash<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    setentry <span class="token operator">*</span>entry<span class="token punctuation">;</span>
    <span class="token comment">// set_lookkey 这个函数便是插入的核心的逻辑的实现对应的实现函数在下方</span>
    entry <span class="token operator">=</span> <span class="token function">set_lookkey</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> key<span class="token punctuation">,</span> hash<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>entry <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">/* UNUSED */</span>
        entry<span class="token operator">-&gt;</span>key <span class="token operator">=</span> key<span class="token punctuation">;</span>
        entry<span class="token operator">-&gt;</span>hash <span class="token operator">=</span> hash<span class="token punctuation">;</span>
        so<span class="token operator">-&gt;</span>fill<span class="token operator">++</span><span class="token punctuation">;</span>
        so<span class="token operator">-&gt;</span>used<span class="token operator">++</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">==</span> dummy<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">/* DUMMY */</span>
        entry<span class="token operator">-&gt;</span>key <span class="token operator">=</span> key<span class="token punctuation">;</span>
        entry<span class="token operator">-&gt;</span>hash <span class="token operator">=</span> hash<span class="token punctuation">;</span>
        so<span class="token operator">-&gt;</span>used<span class="token operator">++</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token comment">/* ACTIVE */</span>
        <span class="token function">Py_DECREF</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token comment">// 下面的代码就是在执行我们在前面所谈到的逻辑，直到找到相同的 key 或者空位置才退出 while 循环</span>
<span class="token keyword">static</span> setentry <span class="token operator">*</span>
<span class="token function">set_lookkey</span><span class="token punctuation">(</span>PySetObject <span class="token operator">*</span>so<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>key<span class="token punctuation">,</span> Py_hash_t hash<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    setentry <span class="token operator">*</span>table <span class="token operator">=</span> so<span class="token operator">-&gt;</span>table<span class="token punctuation">;</span>
    setentry <span class="token operator">*</span>freeslot <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    setentry <span class="token operator">*</span>entry<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> perturb <span class="token operator">=</span> hash<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> mask <span class="token operator">=</span> so<span class="token operator">-&gt;</span>mask<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> i <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">size_t</span><span class="token punctuation">)</span>hash <span class="token operator">&amp;</span> mask<span class="token punctuation">;</span> <span class="token comment">/* Unsigned for defined overflow behavior */</span>
    <span class="token class-name">size_t</span> j<span class="token punctuation">;</span>
    <span class="token keyword">int</span> cmp<span class="token punctuation">;</span>

    entry <span class="token operator">=</span> <span class="token operator">&amp;</span>table<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> entry<span class="token punctuation">;</span>

    <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>hash <span class="token operator">==</span> hash<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            PyObject <span class="token operator">*</span>startkey <span class="token operator">=</span> entry<span class="token operator">-&gt;</span>key<span class="token punctuation">;</span>
            <span class="token comment">/* startkey cannot be a dummy because the dummy hash field is -1 */</span>
            <span class="token function">assert</span><span class="token punctuation">(</span>startkey <span class="token operator">!=</span> dummy<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>startkey <span class="token operator">==</span> key<span class="token punctuation">)</span>
                <span class="token keyword">return</span> entry<span class="token punctuation">;</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">PyUnicode_CheckExact</span><span class="token punctuation">(</span>startkey<span class="token punctuation">)</span>
                <span class="token operator">&amp;&amp;</span> <span class="token function">PyUnicode_CheckExact</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span>
                <span class="token operator">&amp;&amp;</span> <span class="token function">unicode_eq</span><span class="token punctuation">(</span>startkey<span class="token punctuation">,</span> key<span class="token punctuation">)</span><span class="token punctuation">)</span>
                <span class="token keyword">return</span> entry<span class="token punctuation">;</span>
            <span class="token function">Py_INCREF</span><span class="token punctuation">(</span>startkey<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token comment">// returning -1 for error, 0 for false, 1 for true</span>
            cmp <span class="token operator">=</span> <span class="token function">PyObject_RichCompareBool</span><span class="token punctuation">(</span>startkey<span class="token punctuation">,</span> key<span class="token punctuation">,</span> Py_EQ<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token function">Py_DECREF</span><span class="token punctuation">(</span>startkey<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>cmp <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span>                                          <span class="token comment">/* unlikely */</span>
                <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>table <span class="token operator">!=</span> so<span class="token operator">-&gt;</span>table <span class="token operator">||</span> entry<span class="token operator">-&gt;</span>key <span class="token operator">!=</span> startkey<span class="token punctuation">)</span>     <span class="token comment">/* unlikely */</span>
                <span class="token keyword">return</span> <span class="token function">set_lookkey</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> key<span class="token punctuation">,</span> hash<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>cmp <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">)</span>                                          <span class="token comment">/* likely */</span>
                <span class="token keyword">return</span> entry<span class="token punctuation">;</span>
            mask <span class="token operator">=</span> so<span class="token operator">-&gt;</span>mask<span class="token punctuation">;</span>                 <span class="token comment">/* help avoid a register spill */</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>hash <span class="token operator">==</span> <span class="token operator">-</span><span class="token number">1</span> <span class="token operator">&amp;&amp;</span> freeslot <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
            freeslot <span class="token operator">=</span> entry<span class="token punctuation">;</span>

        <span class="token keyword">if</span> <span class="token punctuation">(</span>i <span class="token operator">+</span> LINEAR_PROBES <span class="token operator">&lt;=</span> mask<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">for</span> <span class="token punctuation">(</span>j <span class="token operator">=</span> <span class="token number">0</span> <span class="token punctuation">;</span> j <span class="token operator">&lt;</span> LINEAR_PROBES <span class="token punctuation">;</span> j<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                entry<span class="token operator">++</span><span class="token punctuation">;</span>
                <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
                    <span class="token keyword">goto</span> found_null<span class="token punctuation">;</span>
                <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>hash <span class="token operator">==</span> hash<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                    PyObject <span class="token operator">*</span>startkey <span class="token operator">=</span> entry<span class="token operator">-&gt;</span>key<span class="token punctuation">;</span>
                    <span class="token function">assert</span><span class="token punctuation">(</span>startkey <span class="token operator">!=</span> dummy<span class="token punctuation">)</span><span class="token punctuation">;</span>
                    <span class="token keyword">if</span> <span class="token punctuation">(</span>startkey <span class="token operator">==</span> key<span class="token punctuation">)</span>
                        <span class="token keyword">return</span> entry<span class="token punctuation">;</span>
                    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">PyUnicode_CheckExact</span><span class="token punctuation">(</span>startkey<span class="token punctuation">)</span>
                        <span class="token operator">&amp;&amp;</span> <span class="token function">PyUnicode_CheckExact</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span>
                        <span class="token operator">&amp;&amp;</span> <span class="token function">unicode_eq</span><span class="token punctuation">(</span>startkey<span class="token punctuation">,</span> key<span class="token punctuation">)</span><span class="token punctuation">)</span>
                        <span class="token keyword">return</span> entry<span class="token punctuation">;</span>
                    <span class="token function">Py_INCREF</span><span class="token punctuation">(</span>startkey<span class="token punctuation">)</span><span class="token punctuation">;</span>
                    <span class="token comment">// returning -1 for error, 0 for false, 1 for true</span>
                    cmp <span class="token operator">=</span> <span class="token function">PyObject_RichCompareBool</span><span class="token punctuation">(</span>startkey<span class="token punctuation">,</span> key<span class="token punctuation">,</span> Py_EQ<span class="token punctuation">)</span><span class="token punctuation">;</span>
                    <span class="token function">Py_DECREF</span><span class="token punctuation">(</span>startkey<span class="token punctuation">)</span><span class="token punctuation">;</span>
                    <span class="token keyword">if</span> <span class="token punctuation">(</span>cmp <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span>
                        <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
                    <span class="token keyword">if</span> <span class="token punctuation">(</span>table <span class="token operator">!=</span> so<span class="token operator">-&gt;</span>table <span class="token operator">||</span> entry<span class="token operator">-&gt;</span>key <span class="token operator">!=</span> startkey<span class="token punctuation">)</span>
                        <span class="token keyword">return</span> <span class="token function">set_lookkey</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> key<span class="token punctuation">,</span> hash<span class="token punctuation">)</span><span class="token punctuation">;</span>
                    <span class="token keyword">if</span> <span class="token punctuation">(</span>cmp <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">)</span>
                        <span class="token keyword">return</span> entry<span class="token punctuation">;</span>
                    mask <span class="token operator">=</span> so<span class="token operator">-&gt;</span>mask<span class="token punctuation">;</span>
                <span class="token punctuation">}</span>
                <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>hash <span class="token operator">==</span> <span class="token operator">-</span><span class="token number">1</span> <span class="token operator">&amp;&amp;</span> freeslot <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
                    freeslot <span class="token operator">=</span> entry<span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>

        perturb <span class="token operator">&gt;&gt;=</span> PERTURB_SHIFT<span class="token punctuation">;</span> <span class="token comment">// #define PERTURB_SHIFT 5</span>
        i <span class="token operator">=</span> <span class="token punctuation">(</span>i <span class="token operator">*</span> <span class="token number">5</span> <span class="token operator">+</span> <span class="token number">1</span> <span class="token operator">+</span> perturb<span class="token punctuation">)</span> <span class="token operator">&amp;</span> mask<span class="token punctuation">;</span>

        entry <span class="token operator">=</span> <span class="token operator">&amp;</span>table<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
            <span class="token keyword">goto</span> found_null<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  found_null<span class="token operator">:</span>
    <span class="token keyword">return</span> freeslot <span class="token operator">==</span> <span class="token constant">NULL</span> <span class="token operator">?</span> entry <span class="token operator">:</span> freeslot<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="哈希表数组扩容" tabindex="-1"><a class="header-anchor" href="#哈希表数组扩容" aria-hidden="true">#</a> 哈希表数组扩容</h2><p>在 cpython 当中对于给哈希表数组扩容的操作，很多情况下都是用下面这行代码，从下面的代码来看对应扩容后数组的大小并不简单，当你的哈希表当中的元素个数大于 50000 时，新数组的大小是原数组的两倍，而如果你哈希表当中的元素个数小于等于 50000，那么久扩大为原来长度的四倍，这个主要是怕后面如果继续扩大四倍的话，可能会浪费很多内存空间。</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token function">set_table_resize</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> so<span class="token operator">-&gt;</span>used<span class="token operator">&gt;</span><span class="token number">50000</span> <span class="token operator">?</span> so<span class="token operator">-&gt;</span>used<span class="token operator">*</span><span class="token number">2</span> <span class="token operator">:</span> so<span class="token operator">-&gt;</span>used<span class="token operator">*</span><span class="token number">4</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>首先需要了解一下扩容机制，当哈希表需要扩容的时候，主要有以下两个步骤：</p><ul><li>创建新的数组，用于存储哈希表的键。</li><li>遍历原来的哈希表，将原来哈希表当中的数据加入到新的申请的数组当中。</li></ul><p>这里需要注意的是因为数组的长度发生了变化，但是 key 的哈希值却没有发生变化，因此在新的数组当中数据对应的下标位置也会发生变化，因此需重新将所有的对象重新进行一次插入操作，下面的整个操作相对来说比较简单，这里不再进行说明了。</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> <span class="token keyword">int</span>
<span class="token function">set_table_resize</span><span class="token punctuation">(</span>PySetObject <span class="token operator">*</span>so<span class="token punctuation">,</span> Py_ssize_t minused<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_ssize_t newsize<span class="token punctuation">;</span>
    setentry <span class="token operator">*</span>oldtable<span class="token punctuation">,</span> <span class="token operator">*</span>newtable<span class="token punctuation">,</span> <span class="token operator">*</span>entry<span class="token punctuation">;</span>
    Py_ssize_t oldfill <span class="token operator">=</span> so<span class="token operator">-&gt;</span>fill<span class="token punctuation">;</span>
    Py_ssize_t oldused <span class="token operator">=</span> so<span class="token operator">-&gt;</span>used<span class="token punctuation">;</span>
    <span class="token keyword">int</span> is_oldtable_malloced<span class="token punctuation">;</span>
    setentry small_copy<span class="token punctuation">[</span>PySet_MINSIZE<span class="token punctuation">]</span><span class="token punctuation">;</span>

    <span class="token function">assert</span><span class="token punctuation">(</span>minused <span class="token operator">&gt;=</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">/* Find the smallest table size &gt; minused. */</span>
    <span class="token comment">/* XXX speed-up with intrinsics */</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span>newsize <span class="token operator">=</span> PySet_MINSIZE<span class="token punctuation">;</span>
         newsize <span class="token operator">&lt;=</span> minused <span class="token operator">&amp;&amp;</span> newsize <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">;</span>
         newsize <span class="token operator">&lt;&lt;=</span> <span class="token number">1</span><span class="token punctuation">)</span>
        <span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>newsize <span class="token operator">&lt;=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token comment">/* Get space for a new table. */</span>
    oldtable <span class="token operator">=</span> so<span class="token operator">-&gt;</span>table<span class="token punctuation">;</span>
    <span class="token function">assert</span><span class="token punctuation">(</span>oldtable <span class="token operator">!=</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    is_oldtable_malloced <span class="token operator">=</span> oldtable <span class="token operator">!=</span> so<span class="token operator">-&gt;</span>smalltable<span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>newsize <span class="token operator">==</span> PySet_MINSIZE<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">/* A large table is shrinking, or we can&#39;t get any smaller. */</span>
        newtable <span class="token operator">=</span> so<span class="token operator">-&gt;</span>smalltable<span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>newtable <span class="token operator">==</span> oldtable<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>so<span class="token operator">-&gt;</span>fill <span class="token operator">==</span> so<span class="token operator">-&gt;</span>used<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                <span class="token comment">/* No dummies, so no point doing anything. */</span>
                <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
            <span class="token comment">/* We&#39;re not going to resize it, but rebuild the
               table anyway to purge old dummy entries.
               Subtle:  This is *necessary* if fill==size,
               as set_lookkey needs at least one virgin slot to
               terminate failing searches.  If fill &lt; size, it&#39;s
               merely desirable, as dummies slow searches. */</span>
            <span class="token function">assert</span><span class="token punctuation">(</span>so<span class="token operator">-&gt;</span>fill <span class="token operator">&gt;</span> so<span class="token operator">-&gt;</span>used<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token function">memcpy</span><span class="token punctuation">(</span>small_copy<span class="token punctuation">,</span> oldtable<span class="token punctuation">,</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span>small_copy<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            oldtable <span class="token operator">=</span> small_copy<span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">else</span> <span class="token punctuation">{</span>
        newtable <span class="token operator">=</span> <span class="token function">PyMem_NEW</span><span class="token punctuation">(</span>setentry<span class="token punctuation">,</span> newsize<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>newtable <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token function">PyErr_NoMemory</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token comment">/* Make the set empty, using the new table. */</span>
    <span class="token function">assert</span><span class="token punctuation">(</span>newtable <span class="token operator">!=</span> oldtable<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">memset</span><span class="token punctuation">(</span>newtable<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">,</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span>setentry<span class="token punctuation">)</span> <span class="token operator">*</span> newsize<span class="token punctuation">)</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>fill <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>used <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>mask <span class="token operator">=</span> newsize <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>table <span class="token operator">=</span> newtable<span class="token punctuation">;</span>

    <span class="token comment">/* Copy the data over; this is refcount-neutral for active entries;
       dummy entries aren&#39;t copied over, of course */</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>oldfill <span class="token operator">==</span> oldused<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">for</span> <span class="token punctuation">(</span>entry <span class="token operator">=</span> oldtable<span class="token punctuation">;</span> oldused <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">;</span> entry<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">!=</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                oldused<span class="token operator">--</span><span class="token punctuation">;</span>
                <span class="token function">set_insert_clean</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> entry<span class="token operator">-&gt;</span>key<span class="token punctuation">,</span> entry<span class="token operator">-&gt;</span>hash<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token keyword">for</span> <span class="token punctuation">(</span>entry <span class="token operator">=</span> oldtable<span class="token punctuation">;</span> oldused <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">;</span> entry<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">!=</span> <span class="token constant">NULL</span> <span class="token operator">&amp;&amp;</span> entry<span class="token operator">-&gt;</span>key <span class="token operator">!=</span> dummy<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                oldused<span class="token operator">--</span><span class="token punctuation">;</span>
                <span class="token function">set_insert_clean</span><span class="token punctuation">(</span>so<span class="token punctuation">,</span> entry<span class="token operator">-&gt;</span>key<span class="token punctuation">,</span> entry<span class="token operator">-&gt;</span>hash<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>is_oldtable_malloced<span class="token punctuation">)</span>
        <span class="token function">PyMem_DEL</span><span class="token punctuation">(</span>oldtable<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">static</span> <span class="token keyword">void</span>
<span class="token function">set_insert_clean</span><span class="token punctuation">(</span>PySetObject <span class="token operator">*</span>so<span class="token punctuation">,</span> PyObject <span class="token operator">*</span>key<span class="token punctuation">,</span> Py_hash_t hash<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    setentry <span class="token operator">*</span>table <span class="token operator">=</span> so<span class="token operator">-&gt;</span>table<span class="token punctuation">;</span>
    setentry <span class="token operator">*</span>entry<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> perturb <span class="token operator">=</span> hash<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> mask <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">size_t</span><span class="token punctuation">)</span>so<span class="token operator">-&gt;</span>mask<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> i <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">size_t</span><span class="token punctuation">)</span>hash <span class="token operator">&amp;</span> mask<span class="token punctuation">;</span>
    <span class="token class-name">size_t</span> j<span class="token punctuation">;</span>
    <span class="token comment">// #define LINEAR_PROBES 9</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        entry <span class="token operator">=</span> <span class="token operator">&amp;</span>table<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
            <span class="token keyword">goto</span> found_null<span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>i <span class="token operator">+</span> LINEAR_PROBES <span class="token operator">&lt;=</span> mask<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">for</span> <span class="token punctuation">(</span>j <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> j <span class="token operator">&lt;</span> LINEAR_PROBES<span class="token punctuation">;</span> j<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                entry<span class="token operator">++</span><span class="token punctuation">;</span>
                <span class="token keyword">if</span> <span class="token punctuation">(</span>entry<span class="token operator">-&gt;</span>key <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span>
                    <span class="token keyword">goto</span> found_null<span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>
        perturb <span class="token operator">&gt;&gt;=</span> PERTURB_SHIFT<span class="token punctuation">;</span>
        i <span class="token operator">=</span> <span class="token punctuation">(</span>i <span class="token operator">*</span> <span class="token number">5</span> <span class="token operator">+</span> <span class="token number">1</span> <span class="token operator">+</span> perturb<span class="token punctuation">)</span> <span class="token operator">&amp;</span> mask<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  found_null<span class="token operator">:</span>
    entry<span class="token operator">-&gt;</span>key <span class="token operator">=</span> key<span class="token punctuation">;</span>
    entry<span class="token operator">-&gt;</span>hash <span class="token operator">=</span> hash<span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>fill<span class="token operator">++</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>used<span class="token operator">++</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="从集合当中删除元素-pop" tabindex="-1"><a class="header-anchor" href="#从集合当中删除元素-pop" aria-hidden="true">#</a> 从集合当中删除元素 pop</h2><p>从集合当中删除元素的代码如下所示：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token keyword">static</span> PyObject <span class="token operator">*</span>
<span class="token function">set_pop</span><span class="token punctuation">(</span>PySetObject <span class="token operator">*</span>so<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    <span class="token comment">/* Make sure the search finger is in bounds */</span>
    Py_ssize_t i <span class="token operator">=</span> so<span class="token operator">-&gt;</span>finger <span class="token operator">&amp;</span> so<span class="token operator">-&gt;</span>mask<span class="token punctuation">;</span>
    setentry <span class="token operator">*</span>entry<span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span>key<span class="token punctuation">;</span>

    <span class="token function">assert</span> <span class="token punctuation">(</span><span class="token function">PyAnySet_Check</span><span class="token punctuation">(</span>so<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>so<span class="token operator">-&gt;</span>used <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token function">PyErr_SetString</span><span class="token punctuation">(</span>PyExc_KeyError<span class="token punctuation">,</span> <span class="token string">&quot;pop from an empty set&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token punctuation">(</span>entry <span class="token operator">=</span> <span class="token operator">&amp;</span>so<span class="token operator">-&gt;</span>table<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token operator">-&gt;</span>key <span class="token operator">==</span> <span class="token constant">NULL</span> <span class="token operator">||</span> entry<span class="token operator">-&gt;</span>key<span class="token operator">==</span>dummy<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        i<span class="token operator">++</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>i <span class="token operator">&gt;</span> so<span class="token operator">-&gt;</span>mask<span class="token punctuation">)</span>
            i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    key <span class="token operator">=</span> entry<span class="token operator">-&gt;</span>key<span class="token punctuation">;</span>
    entry<span class="token operator">-&gt;</span>key <span class="token operator">=</span> dummy<span class="token punctuation">;</span>
    entry<span class="token operator">-&gt;</span>hash <span class="token operator">=</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>used<span class="token operator">--</span><span class="token punctuation">;</span>
    so<span class="token operator">-&gt;</span>finger <span class="token operator">=</span> i <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">;</span>         <span class="token comment">/* next place to start */</span>
    <span class="token keyword">return</span> key<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的代码相对来说也比较清晰，从 finger 开始寻找存在的元素，并且删除他。我们在前面提到过，当一个元素被删除之后他会被赋值成 dummy 而且哈希值为 -1 。</p><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>在本篇文章当中主要给大家简要介绍了一下在 cpython 当中的集合对象是如何实现的，主要是介绍了一些核心的数据结构和 cpython 当中具体的哈希表的实现原理，在 cpython 内部是使用线性探测法和开放地址法两种方法去解决哈希冲突的，同时 cpython 哈希表的扩容方式比价有意思，在哈希表当中的元素个数小于 50000 时，扩容的时候，扩容大小为原来的四倍，当大于 50000 时，扩容的大小为原来的两倍，这个主要是因为怕后面如果扩容太大没有使用非常浪费内存空间。</p><hr><p>本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython</p>`,31),d={href:"https://github.com/Chang-LeHung/CSCore",target:"_blank",rel:"noopener noreferrer"},v=n("p",null,"关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。",-1),m=n("p",null,[n("img",{src:t,alt:""})],-1);function b(y,h){const a=e("ExternalLinkIcon");return o(),c("div",null,[k,n("p",null,[s("更多精彩内容合集可访问项目："),n("a",d,[s("https://github.com/Chang-LeHung/CSCore"),l(a)])]),v,m])}const g=p(r,[["render",b],["__file","06set.html.vue"]]);export{g as default};
