import{_ as t}from"./qrcode2-187b7271.js";import{_ as e,r as p,o,c,a as n,d as s,b as i,e as l}from"./app-6b5e6c63.js";const d={},u=l(`<h1 id="深入理解-python-虚拟机-字典-dict-的优化" tabindex="-1"><a class="header-anchor" href="#深入理解-python-虚拟机-字典-dict-的优化" aria-hidden="true">#</a> 深入理解 Python 虚拟机：字典（dict）的优化</h1><p>在前面的文章当中我们讨论的是 python3 当中早期的内嵌数据结构字典的实现，在本篇文章当中主要介绍在后续对于字典的内存优化。</p><h2 id="字典优化" tabindex="-1"><a class="header-anchor" href="#字典优化" aria-hidden="true">#</a> 字典优化</h2><p>在前面的文章当中我们介绍的字典的数据结构主要如下所示：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    PyObject_HEAD
    Py_ssize_t ma_used<span class="token punctuation">;</span>
    PyDictKeysObject <span class="token operator">*</span>ma_keys<span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span><span class="token operator">*</span>ma_values<span class="token punctuation">;</span>
<span class="token punctuation">}</span> PyDictObject<span class="token punctuation">;</span>

<span class="token keyword">struct</span> <span class="token class-name">_dictkeysobject</span> <span class="token punctuation">{</span>
    Py_ssize_t dk_refcnt<span class="token punctuation">;</span>
    Py_ssize_t dk_size<span class="token punctuation">;</span>
    dict_lookup_func dk_lookup<span class="token punctuation">;</span>
    Py_ssize_t dk_usable<span class="token punctuation">;</span>
    PyDictKeyEntry dk_entries<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>

<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">{</span>
    <span class="token comment">/* Cached hash code of me_key. */</span>
    Py_hash_t me_hash<span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span>me_key<span class="token punctuation">;</span>
    PyObject <span class="token operator">*</span>me_value<span class="token punctuation">;</span> <span class="token comment">/* This field is only meaningful for combined tables */</span>
<span class="token punctuation">}</span> PyDictKeyEntry<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>用图示的方式表示如下图所示：</p><p><img src="https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230326013421209-1864861534.png" alt=""></p><p>所有的键值对都存储在 dk_entries 数组当中，比如对于 &quot;Hello&quot; &quot;World&quot; 这个键值对存储过程如下所示，如果 &quot;Hello&quot; 的哈希值等于 8 ，那么计算出来对象在 dk_entries 数组当中的下标位 0 。</p><p><img src="https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230326013421655-1359261450.png" alt=""></p><p>在前面的文章当中我们谈到了，在 cpython 当中 dk_entries 数组当中的一个对象占用 24 字节的内存空间，在 cpython 当中的负载因子是 $\\frac{2}{3}$ 。而一个 entry 的大小是 24 个字节，如果 dk_entries 的长度是 1024 的话，那么大概有 1024 / 3 * 24 = 8K 的内存空间是浪费的。为了解决这个问题，在新版的 cpython 当中采取了一个策略用于减少内存的使用。具体的设计如下图所示：</p><p><img src="https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230326013422181-77314044.png" alt=""></p><p>在新的字典当中 cpython 对于 dk_entries 来说如果正常的哈希表的长度为 8 的话，因为负载因子是 $\\frac{2}{3}$ 真正给 dk_entries 分配的长度是 5 = 8 / 3，那么现在有一个问题就是如何根据不同的哈希值进行对象的存储。dk_indices 就是这个作用的，他的长度和真正的哈希表的长度是一样的，dk_indices 是一个整型数组这个数组保存的是要保存对象在 dk_entries 当中的下标，比如在上面的例子当中 dk_indices[7] = 0，就表示哈希值求余数之后的值等于 7，0 表示对象在 dk_entries 当中的下标。</p><p>现在我们再插入一个数据 &quot;World&quot; &quot;Hello&quot; 键值对，假设 &quot;World&quot; 的哈希值等于 8，那么对哈希值求余数之后等于 0 ，那么 dk_indices[0] 就是保存对象在 dk_entries 数组当中的下标的，图中对应的下标为 1 （因为 dk_entries 数组当中的每个数据都要使用，因此直接递增即可，下一个对象来的话就保存在 dk_entries 数组的第 3 个（下标为 2）位置）。</p><p><img src="https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230326013422602-533170509.png" alt=""></p><h2 id="内存分析" tabindex="-1"><a class="header-anchor" href="#内存分析" aria-hidden="true">#</a> 内存分析</h2><p>首先我们先来分析一下数组 dk_indices 的数据类型，在 cpython 的内部实现当中并没有一刀切的直接将这个数组当中的数据类型设置成 int 类型。</p><p>dk_indices 数组主要有以下几个类型：</p><ul><li>当哈希表长度小于 0xff 时，dk_indices 的数据类型为 int8_t ，即一个元素值占一个字节。</li><li>当哈希表长度小于 0xffff 时，dk_indices 的数据类型为 int16_t ，即一个元素值占 2 一个字节。</li><li>当哈希表长度小于 0xffffffff 时，dk_indices 的数据类型为 int32_t ，即一个元素值占 4 个字节。</li><li>当哈希表长度大于 0xffffffff 时，dk_indices 的数据类型为 int64_t ，即一个元素值占 8 个字节。</li></ul><p>与这个相关的代码如下所示：</p><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token comment">/* lookup indices.  returns DKIX_EMPTY, DKIX_DUMMY, or ix &gt;=0 */</span>
<span class="token keyword">static</span> <span class="token keyword">inline</span> Py_ssize_t
<span class="token function">dictkeys_get_index</span><span class="token punctuation">(</span><span class="token keyword">const</span> PyDictKeysObject <span class="token operator">*</span>keys<span class="token punctuation">,</span> Py_ssize_t i<span class="token punctuation">)</span>
<span class="token punctuation">{</span>
    Py_ssize_t s <span class="token operator">=</span> <span class="token function">DK_SIZE</span><span class="token punctuation">(</span>keys<span class="token punctuation">)</span><span class="token punctuation">;</span>
    Py_ssize_t ix<span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>s <span class="token operator">&lt;=</span> <span class="token number">0xff</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">const</span> <span class="token class-name">int8_t</span> <span class="token operator">*</span>indices <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword">const</span> <span class="token class-name">int8_t</span><span class="token operator">*</span><span class="token punctuation">)</span><span class="token punctuation">(</span>keys<span class="token operator">-&gt;</span>dk_indices<span class="token punctuation">)</span><span class="token punctuation">;</span>
        ix <span class="token operator">=</span> indices<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>s <span class="token operator">&lt;=</span> <span class="token number">0xffff</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">const</span> <span class="token class-name">int16_t</span> <span class="token operator">*</span>indices <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword">const</span> <span class="token class-name">int16_t</span><span class="token operator">*</span><span class="token punctuation">)</span><span class="token punctuation">(</span>keys<span class="token operator">-&gt;</span>dk_indices<span class="token punctuation">)</span><span class="token punctuation">;</span>
        ix <span class="token operator">=</span> indices<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">if</span> <span class="token expression">SIZEOF_VOID_P <span class="token operator">&gt;</span> <span class="token number">4</span></span></span>
    <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>s <span class="token operator">&gt;</span> <span class="token number">0xffffffff</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">const</span> <span class="token class-name">int64_t</span> <span class="token operator">*</span>indices <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword">const</span> <span class="token class-name">int64_t</span><span class="token operator">*</span><span class="token punctuation">)</span><span class="token punctuation">(</span>keys<span class="token operator">-&gt;</span>dk_indices<span class="token punctuation">)</span><span class="token punctuation">;</span>
        ix <span class="token operator">=</span> indices<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">endif</span></span>
    <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token keyword">const</span> <span class="token class-name">int32_t</span> <span class="token operator">*</span>indices <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword">const</span> <span class="token class-name">int32_t</span><span class="token operator">*</span><span class="token punctuation">)</span><span class="token punctuation">(</span>keys<span class="token operator">-&gt;</span>dk_indices<span class="token punctuation">)</span><span class="token punctuation">;</span>
        ix <span class="token operator">=</span> indices<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token function">assert</span><span class="token punctuation">(</span>ix <span class="token operator">&gt;=</span> DKIX_DUMMY<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> ix<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>现在来分析一下相关的内存使用情况：</p><table><thead><tr><th style="text-align:left;"><strong>哈希表长度</strong></th><th style="text-align:left;">能够保存的键值对数目</th><th style="text-align:left;"><strong>老版本</strong></th><th style="text-align:left;"><strong>新版本</strong></th><th style="text-align:left;"><strong>节约内存量（字节）</strong></th></tr></thead><tbody><tr><td style="text-align:left;">256</td><td style="text-align:left;">256 * 2 / 3 = 170</td><td style="text-align:left;">24 * 256 = 6144</td><td style="text-align:left;">1 * 256 + 24 * 170 = 4336</td><td style="text-align:left;">1808</td></tr><tr><td style="text-align:left;">65536</td><td style="text-align:left;">65536 * 2 / 3 = 43690</td><td style="text-align:left;">24 * 65536 = 1572864</td><td style="text-align:left;">2 * 65536 + 24 * 43690 = 1179632</td><td style="text-align:left;">393232</td></tr></tbody></table><p>从上面的表格我们可以看到哈希表的长度越大我们节约的内存就越大，优化的效果就越明显。</p><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>在本篇文章当中主要介绍了在 python3 当中对于字典的优化操作，主要是通过一个内存占用量比较小的数组去保存键值对在真实保存键值对当中的下标实现的，这个方法对于节约内存的效果是非常明显的。</p><hr><p>本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython</p>`,27),r={href:"https://github.com/Chang-LeHung/CSCore",target:"_blank",rel:"noopener noreferrer"},k=n("p",null,"关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。",-1),v=n("p",null,[n("img",{src:t,alt:""})],-1);function m(_,y){const a=p("ExternalLinkIcon");return o(),c("div",null,[u,n("p",null,[s("更多精彩内容合集可访问项目："),n("a",r,[s("https://github.com/Chang-LeHung/CSCore"),i(a)])]),k,v])}const f=e(d,[["render",m],["__file","09dict_upload.html.vue"]]);export{f as default};
