import{_ as t}from"./qrcode2-187b7271.js";import{_ as e,r as p,o,c as d,a as n,d as s,b as c,e as l}from"./app-6b5e6c63.js";const i={},r=l(`<h1 id="深入理解-python-虚拟机-令人拍案叫绝的字节码设计" tabindex="-1"><a class="header-anchor" href="#深入理解-python-虚拟机-令人拍案叫绝的字节码设计" aria-hidden="true">#</a> 深入理解 python 虚拟机：令人拍案叫绝的字节码设计</h1><p>在本篇文章当中主要给大家介绍 cpython 虚拟机对于字节码的设计以及在调试过程当中一个比较重要的字段 co_lnotab 的设计原理！</p><h2 id="python-字节码设计" tabindex="-1"><a class="header-anchor" href="#python-字节码设计" aria-hidden="true">#</a> python 字节码设计</h2><p>一条 python 字节码主要有两部分组成，一部分是操作码，一部分是这个操作码的参数，在 cpython 当中只有部分字节码有参数，如果对应的字节码没有参数，那么 oparg 的值就等于 0 ，在 cpython 当中 opcode &lt; 90 的指令是没有参数的。</p><p><img src="https://img2023.cnblogs.com/blog/2519003/202304/2519003-20230403011645642-218163882.png" alt=""></p><p>opcode 和 oparg 各占一个字节，cpython 虚拟机使用小端方式保存字节码。</p><p>我们使用下面的代码片段先了解一下字节码的设计：</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">import</span> dis


<span class="token keyword">def</span> <span class="token function">add</span><span class="token punctuation">(</span>a<span class="token punctuation">,</span> b<span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token keyword">return</span> a <span class="token operator">+</span> b


<span class="token keyword">if</span> __name__ <span class="token operator">==</span> <span class="token string">&#39;__main__&#39;</span><span class="token punctuation">:</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span>add<span class="token punctuation">.</span>__code__<span class="token punctuation">.</span>co_code<span class="token punctuation">)</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">&quot;bytecode: &quot;</span><span class="token punctuation">,</span> <span class="token builtin">list</span><span class="token punctuation">(</span><span class="token builtin">bytearray</span><span class="token punctuation">(</span>add<span class="token punctuation">.</span>__code__<span class="token punctuation">.</span>co_code<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
    dis<span class="token punctuation">.</span>dis<span class="token punctuation">(</span>add<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的代码在 python3.9 的输出如下所示：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>b<span class="token string">&#39;|\\x00|\\x01\\x17\\x00S\\x00&#39;</span>
bytecode:  <span class="token punctuation">[</span><span class="token number">124</span>, <span class="token number">0</span>, <span class="token number">124</span>, <span class="token number">1</span>, <span class="token number">23</span>, <span class="token number">0</span>, <span class="token number">83</span>, <span class="token number">0</span><span class="token punctuation">]</span>
  <span class="token number">5</span>           <span class="token number">0</span> LOAD_FAST                <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>
              <span class="token number">2</span> LOAD_FAST                <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>
              <span class="token number">4</span> BINARY_ADD
              <span class="token number">6</span> RETURN_VALUE
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先 需要了解的是 add.__code__.co_code 是函数 add 的字节码，是一个字节序列，<code>list(bytearray(add.__code__.co_code))</code> 是将和这个序列一个字节一个字节进行分开，并且将其变成 10 进制形式。根据前面我们谈到的每一条指令——字节码占用 2 个字节，因此上面的字节码有四条指令： <img src="https://img2023.cnblogs.com/blog/2519003/202304/2519003-20230403011646155-2076914411.png" alt=""></p><p>操作码和对应的操作指令在文末有详细的对应表。在上面的代码当中主要使用到了三个字节码指令分别是 124，23 和 83 ，他们对应的操作指令分别为 LOAD_FAST，BINARY_ADD，RETURN_VALUE。他们的含义如下：</p><ul><li>LOAD_FAST：将 varnames[var_num] 压入栈顶。</li><li>BINARY_ADD：从栈中弹出两个对象并且将它们相加的结果压入栈顶。</li><li>RETURN_VALUE：弹出栈顶的元素，将其作为函数的返回值。</li></ul><p>首先我们需要知道的是 BINARY_ADD 和 RETURN_VALUE，这两个操作指令是没有参数的，因此在这两个操作码之后的参数都是 0 。</p><p>但是 LOAD_FAST 是有参数的，在上面我们已经知道 LOAD_FAST 是将 co-varnames[var_num] 压入栈，var_num 就是指令 LOAD_FAST 的参数。在上面的代码当中一共有两条 LOAD_FAST 指令，分别是将 a 和 b 压入到栈中，他们在 varnames 当中的下标分别是 0 和 1，因此他们的操作数就是 0 和 1 。</p><h2 id="字节码扩展参数" tabindex="-1"><a class="header-anchor" href="#字节码扩展参数" aria-hidden="true">#</a> 字节码扩展参数</h2><p>在上面我们谈到的 python 字节码操作数和操作码各占一个字节，但是如果 varnames 或者常量表的数据的个数大于 1 个字节的表示范围的话那么改如何处理呢？</p><p>为了解决这个问题，cpython 为字节码设计的扩展参数，比如说我们要加载常量表当中的下标为 66113 的对象，那么对应的字节码如下：</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token punctuation">[</span><span class="token number">144</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">144</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">,</span> <span class="token number">100</span><span class="token punctuation">,</span> <span class="token number">65</span><span class="token punctuation">]</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>其中 144 表示 EXTENDED_ARG，他本质上不是一个 python 虚拟机需要执行的字节码，这个字段设计出来主要是为了用与计算扩展参数的。</p><p>100 对应的操作指令是 LOAD_CONST ，其操作码是 65，但是上面的指令并不会加载常量表当中下标为 65 对象，而是会加载下标为 66113 的对象，原因就是因为 EXTENDED_ARG 。</p><p>现在来模拟一下上面的分析过程：</p><ul><li>先读取一条字节码指令，操作码等于 144 ，说明是扩展参数，那么此时的参数 arg 就等于 (1 x (1 &lt;&lt; 8)) = 256 。</li><li>读取第二条字节码指令，操作码等于 144 ，说明是扩展参数，因为前面 arg 已经存在切不等于 0 了，那么此时 arg 的计算方式已经发生了改变，arg = arg &lt;&lt; 8 + 2 &lt;&lt; 8 ，也就是说原来的 arg 乘以 256 再加上新的操作数乘以 256 ，此时 arg = 66048 。</li><li>读取第三条字节码指令，操作码等于 100，此时是 LOAD_CONST 这条指令，那么此时的操作码等于 arg += 65，因为操作码不是 EXTENDED_ARG 因此操作数不需要在乘以 256 了。</li></ul><p>上面的计算过程用程序代码表示如下，下面的代码当中 code 就是真正的字节序列 HAVE_ARGUMENT = 90 。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">def</span> <span class="token function">_unpack_opargs</span><span class="token punctuation">(</span>code<span class="token punctuation">)</span><span class="token punctuation">:</span>
    extended_arg <span class="token operator">=</span> <span class="token number">0</span>
    <span class="token keyword">for</span> i <span class="token keyword">in</span> <span class="token builtin">range</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token builtin">len</span><span class="token punctuation">(</span>code<span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
        op <span class="token operator">=</span> code<span class="token punctuation">[</span>i<span class="token punctuation">]</span>
        <span class="token keyword">if</span> op <span class="token operator">&gt;=</span> HAVE_ARGUMENT<span class="token punctuation">:</span>
            arg <span class="token operator">=</span> code<span class="token punctuation">[</span>i<span class="token operator">+</span><span class="token number">1</span><span class="token punctuation">]</span> <span class="token operator">|</span> extended_arg
            extended_arg <span class="token operator">=</span> <span class="token punctuation">(</span>arg <span class="token operator">&lt;&lt;</span> <span class="token number">8</span><span class="token punctuation">)</span> <span class="token keyword">if</span> op <span class="token operator">==</span> EXTENDED_ARG <span class="token keyword">else</span> <span class="token number">0</span>
        <span class="token keyword">else</span><span class="token punctuation">:</span>
            arg <span class="token operator">=</span> <span class="token boolean">None</span>
        <span class="token keyword">yield</span> <span class="token punctuation">(</span>i<span class="token punctuation">,</span> op<span class="token punctuation">,</span> arg<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们可以使用代码来验证我们前面的分析：</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">import</span> dis


<span class="token keyword">def</span> <span class="token function">num_to_byte</span><span class="token punctuation">(</span>n<span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token keyword">return</span> n<span class="token punctuation">.</span>to_bytes<span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token string">&quot;little&quot;</span><span class="token punctuation">)</span>


<span class="token keyword">def</span> <span class="token function">nums_to_bytes</span><span class="token punctuation">(</span>data<span class="token punctuation">)</span><span class="token punctuation">:</span>
    ans <span class="token operator">=</span> <span class="token string">b&quot;&quot;</span><span class="token punctuation">.</span>join<span class="token punctuation">(</span><span class="token punctuation">[</span>num_to_byte<span class="token punctuation">(</span>n<span class="token punctuation">)</span> <span class="token keyword">for</span> n <span class="token keyword">in</span> data<span class="token punctuation">]</span><span class="token punctuation">)</span>
    <span class="token keyword">return</span> ans


<span class="token keyword">if</span> __name__ <span class="token operator">==</span> <span class="token string">&#39;__main__&#39;</span><span class="token punctuation">:</span>
    <span class="token comment"># extended_arg extended_num opcode oparg for python_version &gt; 3.5</span>
    bytecode <span class="token operator">=</span> nums_to_bytes<span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token number">144</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">144</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">,</span> <span class="token number">100</span><span class="token punctuation">,</span> <span class="token number">65</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span>bytecode<span class="token punctuation">)</span>
    dis<span class="token punctuation">.</span>dis<span class="token punctuation">(</span>bytecode<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的代码输出结果如下所示：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>b<span class="token string">&#39;\\x90\\x01\\x90\\x02dA&#39;</span>
          <span class="token number">0</span> EXTENDED_ARG             <span class="token number">1</span>
          <span class="token number">2</span> EXTENDED_ARG           <span class="token number">258</span>
          <span class="token number">4</span> LOAD_CONST           <span class="token number">66113</span> <span class="token punctuation">(</span><span class="token number">66113</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>根据上面程序的输出结果可以看到我们的分析结果是正确的。</p><h2 id="源代码字节码映射表" tabindex="-1"><a class="header-anchor" href="#源代码字节码映射表" aria-hidden="true">#</a> 源代码字节码映射表</h2><p>在本小节主要分析一个 code object 对象当中的 co_lnotab 字段，通过分析一个具体的字段来学习这个字段的设计。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">import</span> dis


<span class="token keyword">def</span> <span class="token function">add</span><span class="token punctuation">(</span>a<span class="token punctuation">,</span> b<span class="token punctuation">)</span><span class="token punctuation">:</span>
    a <span class="token operator">+=</span> <span class="token number">1</span>
    b <span class="token operator">+=</span> <span class="token number">2</span>
    <span class="token keyword">return</span> a <span class="token operator">+</span> b


<span class="token keyword">if</span> __name__ <span class="token operator">==</span> <span class="token string">&#39;__main__&#39;</span><span class="token punctuation">:</span>
    dis<span class="token punctuation">.</span>dis<span class="token punctuation">(</span>add<span class="token punctuation">.</span>__code__<span class="token punctuation">)</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string-interpolation"><span class="token string">f&quot;</span><span class="token interpolation"><span class="token punctuation">{</span><span class="token builtin">list</span><span class="token punctuation">(</span><span class="token builtin">bytearray</span><span class="token punctuation">(</span>add<span class="token punctuation">.</span>__code__<span class="token punctuation">.</span>co_lnotab<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token operator">=</span> <span class="token punctuation">}</span></span><span class="token string">&quot;</span></span><span class="token punctuation">)</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string-interpolation"><span class="token string">f&quot;</span><span class="token interpolation"><span class="token punctuation">{</span>add<span class="token punctuation">.</span>__code__<span class="token punctuation">.</span>co_firstlineno <span class="token operator">=</span> <span class="token punctuation">}</span></span><span class="token string">&quot;</span></span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先 dis 的输出第一列是字节码对应的源代码的行号，第二列是字节码在字节序列当中的位移。</p><p>上面的代码输出结果如下所示：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>  源代码的行号  字节码的位移
  <span class="token number">6</span>           <span class="token number">0</span> LOAD_FAST                <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>
              <span class="token number">2</span> LOAD_CONST               <span class="token number">1</span> <span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
              <span class="token number">4</span> INPLACE_ADD
              <span class="token number">6</span> STORE_FAST               <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>

  <span class="token number">7</span>           <span class="token number">8</span> LOAD_FAST                <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>
             <span class="token number">10</span> LOAD_CONST               <span class="token number">2</span> <span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
             <span class="token number">12</span> INPLACE_ADD
             <span class="token number">14</span> STORE_FAST               <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>

  <span class="token number">8</span>          <span class="token number">16</span> LOAD_FAST                <span class="token number">0</span> <span class="token punctuation">(</span>a<span class="token punctuation">)</span>
             <span class="token number">18</span> LOAD_FAST                <span class="token number">1</span> <span class="token punctuation">(</span>b<span class="token punctuation">)</span>
             <span class="token number">20</span> BINARY_ADD
             <span class="token number">22</span> RETURN_VALUE
list<span class="token punctuation">(</span>bytearray<span class="token punctuation">(</span>add.__code__.co_lnotab<span class="token punctuation">))</span> <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token number">0</span>, <span class="token number">1</span>, <span class="token number">8</span>, <span class="token number">1</span>, <span class="token number">8</span>, <span class="token number">1</span><span class="token punctuation">]</span>
add.__code__.co_firstlineno <span class="token operator">=</span> <span class="token number">5</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>从上面代码的输出结果可以看出字节码一共分成三段，每段表示一行代码的字节码。现在我们来分析一下 co_lnotab 这个字段，这个字段其实也是两个字节为一段的。比如上面的 [0, 1, 8, 1, 8, 1] 就可以分成三段 [0, 1], [8, 1], [8, 1] 。这其中的含义分别为：</p><ul><li>第一个数字表示距离上一行代码的字节码数目。</li><li>第二个数字表示距离上一行有效代码的行数。</li></ul><p>现在我们来模拟上面代码的字节码的位移和源代码行数之间的关系：</p><ul><li>[0, 1]，说明这行代码离上一行代码的字节位移是 0 ，因此我们可以看到使用 dis 输出的字节码 LOAD_FAST ，前面的数字是 0，距离上一行代码的行数等于 1 ，代码的第一行的行号等于 5，因此 LOAD_FAST 对应的行号等于 5 + 1 = 6 。</li><li>[8, 1]，说明这行代码距离上一行代码的字节位移为 8 个字节，因此第二块的 LOAD_FAST 前面是 8 ，距离上一行代码的行数等于 1，因此这个字节码对应的源代码的行号等于 6 + 1 = 7。</li><li>[8, 1]，同理可以知道这块字节码对应源代码的行号是 8 。</li></ul><p>现在有一个问题是当两行代码之间相距的行数超过 一个字节的表示范围怎么办？在 python3.5 以后如果行数差距大于 127，那么就使用 (0, 行数) 对下一个组合进行表示，(0, $x_1$), (0,$ x_2$) ... ，直到 $x_1 + ... + x_n$ = 行数。</p><p>在后面的程序当中我们会使用 compile 这个 python 内嵌函数。当你使用Python编写代码时，可以使用<code>compile()</code>函数将Python代码编译成字节代码对象。这个字节码对象可以被传递给Python的解释器或虚拟机，以执行代码。</p><p><code>compile()</code>函数接受三个参数：</p><ul><li><code>source</code>: 要编译的Python代码，可以是字符串，字节码或AST对象。</li><li><code>filename</code>: 代码来源的文件名（如果有），通常为字符串。</li><li><code>mode</code>: 编译代码的模式。可以是 &#39;exec&#39;、&#39;eval&#39; 或 &#39;single&#39; 中的一个。&#39;exec&#39; 模式用于编译多行代码，&#39;eval&#39; 用于编译单个表达式，&#39;single&#39; 用于编译单行代码。</li></ul><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">import</span> dis

code <span class="token operator">=</span> <span class="token triple-quoted-string string">&quot;&quot;&quot;
x=1
y=2
&quot;&quot;&quot;</span> \\
<span class="token operator">+</span> <span class="token string">&quot;\\n&quot;</span> <span class="token operator">*</span> <span class="token number">500</span> <span class="token operator">+</span> \\
<span class="token triple-quoted-string string">&quot;&quot;&quot;
z=x+y
&quot;&quot;&quot;</span>

code <span class="token operator">=</span> <span class="token builtin">compile</span><span class="token punctuation">(</span>code<span class="token punctuation">,</span> <span class="token string">&#39;&lt;string&gt;&#39;</span><span class="token punctuation">,</span> <span class="token string">&#39;exec&#39;</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span><span class="token builtin">list</span><span class="token punctuation">(</span><span class="token builtin">bytearray</span><span class="token punctuation">(</span>code<span class="token punctuation">.</span>co_lnotab<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">print</span><span class="token punctuation">(</span>code<span class="token punctuation">.</span>co_firstlineno<span class="token punctuation">)</span>
dis<span class="token punctuation">.</span>dis<span class="token punctuation">(</span>code<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的代码输出结果如下所示：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span><span class="token number">0</span>, <span class="token number">1</span>, <span class="token number">4</span>, <span class="token number">1</span>, <span class="token number">4</span>, <span class="token number">127</span>, <span class="token number">0</span>, <span class="token number">127</span>, <span class="token number">0</span>, <span class="token number">127</span>, <span class="token number">0</span>, <span class="token number">121</span><span class="token punctuation">]</span>
<span class="token number">1</span>
  <span class="token number">2</span>           <span class="token number">0</span> LOAD_CONST               <span class="token number">0</span> <span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
              <span class="token number">2</span> STORE_NAME               <span class="token number">0</span> <span class="token punctuation">(</span>x<span class="token punctuation">)</span>

  <span class="token number">3</span>           <span class="token number">4</span> LOAD_CONST               <span class="token number">1</span> <span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
              <span class="token number">6</span> STORE_NAME               <span class="token number">1</span> <span class="token punctuation">(</span>y<span class="token punctuation">)</span>

<span class="token number">505</span>           <span class="token number">8</span> LOAD_NAME                <span class="token number">0</span> <span class="token punctuation">(</span>x<span class="token punctuation">)</span>
             <span class="token number">10</span> LOAD_NAME                <span class="token number">1</span> <span class="token punctuation">(</span>y<span class="token punctuation">)</span>
             <span class="token number">12</span> BINARY_ADD
             <span class="token number">14</span> STORE_NAME               <span class="token number">2</span> <span class="token punctuation">(</span>z<span class="token punctuation">)</span>
             <span class="token number">16</span> LOAD_CONST               <span class="token number">2</span> <span class="token punctuation">(</span>None<span class="token punctuation">)</span>
             <span class="token number">18</span> RETURN_VALUE
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>根据我们前面的分析因为第三行和第二行之间的差距大于 127 ，因此后面的多个组合都是用于表示行数的。</p><p>505 = 3(前面已经有三行了) + (127 + 127 + 127 + 121)(这个是第二行和第三行之间的差距，这个值为 502，中间有 500 个换行但是因为字符串相加的原因还增加了两个换行，因此一共是 502 个换行)。</p><p>具体的算法用代码表示如下所示，下面的参数就是我们传递给 dis 模块的 code，也就是一个 code object 对象。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">def</span> <span class="token function">findlinestarts</span><span class="token punctuation">(</span>code<span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token triple-quoted-string string">&quot;&quot;&quot;Find the offsets in a byte code which are start of lines in the source.

    Generate pairs (offset, lineno) as described in Python/compile.c.

    &quot;&quot;&quot;</span>
    byte_increments <span class="token operator">=</span> code<span class="token punctuation">.</span>co_lnotab<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">:</span><span class="token punctuation">:</span><span class="token number">2</span><span class="token punctuation">]</span>
    line_increments <span class="token operator">=</span> code<span class="token punctuation">.</span>co_lnotab<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">:</span><span class="token punctuation">:</span><span class="token number">2</span><span class="token punctuation">]</span>
    bytecode_len <span class="token operator">=</span> <span class="token builtin">len</span><span class="token punctuation">(</span>code<span class="token punctuation">.</span>co_code<span class="token punctuation">)</span>

    lastlineno <span class="token operator">=</span> <span class="token boolean">None</span>
    lineno <span class="token operator">=</span> code<span class="token punctuation">.</span>co_firstlineno
    addr <span class="token operator">=</span> <span class="token number">0</span>
    <span class="token keyword">for</span> byte_incr<span class="token punctuation">,</span> line_incr <span class="token keyword">in</span> <span class="token builtin">zip</span><span class="token punctuation">(</span>byte_increments<span class="token punctuation">,</span> line_increments<span class="token punctuation">)</span><span class="token punctuation">:</span>
        <span class="token keyword">if</span> byte_incr<span class="token punctuation">:</span>
            <span class="token keyword">if</span> lineno <span class="token operator">!=</span> lastlineno<span class="token punctuation">:</span>
                <span class="token keyword">yield</span> <span class="token punctuation">(</span>addr<span class="token punctuation">,</span> lineno<span class="token punctuation">)</span>
                lastlineno <span class="token operator">=</span> lineno
            addr <span class="token operator">+=</span> byte_incr
            <span class="token keyword">if</span> addr <span class="token operator">&gt;=</span> bytecode_len<span class="token punctuation">:</span>
                <span class="token comment"># The rest of the lnotab byte offsets are past the end of</span>
                <span class="token comment"># the bytecode, so the lines were optimized away.</span>
                <span class="token keyword">return</span>
        <span class="token keyword">if</span> line_incr <span class="token operator">&gt;=</span> <span class="token number">0x80</span><span class="token punctuation">:</span>
            <span class="token comment"># line_increments is an array of 8-bit signed integers</span>
            line_incr <span class="token operator">-=</span> <span class="token number">0x100</span>
        lineno <span class="token operator">+=</span> line_incr
    <span class="token keyword">if</span> lineno <span class="token operator">!=</span> lastlineno<span class="token punctuation">:</span>
        <span class="token keyword">yield</span> <span class="token punctuation">(</span>addr<span class="token punctuation">,</span> lineno<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="python-字节码表" tabindex="-1"><a class="header-anchor" href="#python-字节码表" aria-hidden="true">#</a> python 字节码表</h2><table><thead><tr><th>操作</th><th>操作码</th></tr></thead><tbody><tr><td>POP_TOP</td><td>1</td></tr><tr><td>ROT_TWO</td><td>2</td></tr><tr><td>ROT_THREE</td><td>3</td></tr><tr><td>DUP_TOP</td><td>4</td></tr><tr><td>DUP_TOP_TWO</td><td>5</td></tr><tr><td>ROT_FOUR</td><td>6</td></tr><tr><td>NOP</td><td>9</td></tr><tr><td>UNARY_POSITIVE</td><td>10</td></tr><tr><td>UNARY_NEGATIVE</td><td>11</td></tr><tr><td>UNARY_NOT</td><td>12</td></tr><tr><td>UNARY_INVERT</td><td>15</td></tr><tr><td>BINARY_MATRIX_MULTIPLY</td><td>16</td></tr><tr><td>INPLACE_MATRIX_MULTIPLY</td><td>17</td></tr><tr><td>BINARY_POWER</td><td>19</td></tr><tr><td>BINARY_MULTIPLY</td><td>20</td></tr><tr><td>BINARY_MODULO</td><td>22</td></tr><tr><td>BINARY_ADD</td><td>23</td></tr><tr><td>BINARY_SUBTRACT</td><td>24</td></tr><tr><td>BINARY_SUBSCR</td><td>25</td></tr><tr><td>BINARY_FLOOR_DIVIDE</td><td>26</td></tr><tr><td>BINARY_TRUE_DIVIDE</td><td>27</td></tr><tr><td>INPLACE_FLOOR_DIVIDE</td><td>28</td></tr><tr><td>INPLACE_TRUE_DIVIDE</td><td>29</td></tr><tr><td>RERAISE</td><td>48</td></tr><tr><td>WITH_EXCEPT_START</td><td>49</td></tr><tr><td>GET_AITER</td><td>50</td></tr><tr><td>GET_ANEXT</td><td>51</td></tr><tr><td>BEFORE_ASYNC_WITH</td><td>52</td></tr><tr><td>END_ASYNC_FOR</td><td>54</td></tr><tr><td>INPLACE_ADD</td><td>55</td></tr><tr><td>INPLACE_SUBTRACT</td><td>56</td></tr><tr><td>INPLACE_MULTIPLY</td><td>57</td></tr><tr><td>INPLACE_MODULO</td><td>59</td></tr><tr><td>STORE_SUBSCR</td><td>60</td></tr><tr><td>DELETE_SUBSCR</td><td>61</td></tr><tr><td>BINARY_LSHIFT</td><td>62</td></tr><tr><td>BINARY_RSHIFT</td><td>63</td></tr><tr><td>BINARY_AND</td><td>64</td></tr><tr><td>BINARY_XOR</td><td>65</td></tr><tr><td>BINARY_OR</td><td>66</td></tr><tr><td>INPLACE_POWER</td><td>67</td></tr><tr><td>GET_ITER</td><td>68</td></tr><tr><td>GET_YIELD_FROM_ITER</td><td>69</td></tr><tr><td>PRINT_EXPR</td><td>70</td></tr><tr><td>LOAD_BUILD_CLASS</td><td>71</td></tr><tr><td>YIELD_FROM</td><td>72</td></tr><tr><td>GET_AWAITABLE</td><td>73</td></tr><tr><td>LOAD_ASSERTION_ERROR</td><td>74</td></tr><tr><td>INPLACE_LSHIFT</td><td>75</td></tr><tr><td>INPLACE_RSHIFT</td><td>76</td></tr><tr><td>INPLACE_AND</td><td>77</td></tr><tr><td>INPLACE_XOR</td><td>78</td></tr><tr><td>INPLACE_OR</td><td>79</td></tr><tr><td>LIST_TO_TUPLE</td><td>82</td></tr><tr><td>RETURN_VALUE</td><td>83</td></tr><tr><td>IMPORT_STAR</td><td>84</td></tr><tr><td>SETUP_ANNOTATIONS</td><td>85</td></tr><tr><td>YIELD_VALUE</td><td>86</td></tr><tr><td>POP_BLOCK</td><td>87</td></tr><tr><td>POP_EXCEPT</td><td>89</td></tr><tr><td>STORE_NAME</td><td>90</td></tr><tr><td>DELETE_NAME</td><td>91</td></tr><tr><td>UNPACK_SEQUENCE</td><td>92</td></tr><tr><td>FOR_ITER</td><td>93</td></tr><tr><td>UNPACK_EX</td><td>94</td></tr><tr><td>STORE_ATTR</td><td>95</td></tr><tr><td>DELETE_ATTR</td><td>96</td></tr><tr><td>STORE_GLOBAL</td><td>97</td></tr><tr><td>DELETE_GLOBAL</td><td>98</td></tr><tr><td>LOAD_CONST</td><td>100</td></tr><tr><td>LOAD_NAME</td><td>101</td></tr><tr><td>BUILD_TUPLE</td><td>102</td></tr><tr><td>BUILD_LIST</td><td>103</td></tr><tr><td>BUILD_SET</td><td>104</td></tr><tr><td>BUILD_MAP</td><td>105</td></tr><tr><td>LOAD_ATTR</td><td>106</td></tr><tr><td>COMPARE_OP</td><td>107</td></tr><tr><td>IMPORT_NAME</td><td>108</td></tr><tr><td>IMPORT_FROM</td><td>109</td></tr><tr><td>JUMP_FORWARD</td><td>110</td></tr><tr><td>JUMP_IF_FALSE_OR_POP</td><td>111</td></tr><tr><td>JUMP_IF_TRUE_OR_POP</td><td>112</td></tr><tr><td>JUMP_ABSOLUTE</td><td>113</td></tr><tr><td>POP_JUMP_IF_FALSE</td><td>114</td></tr><tr><td>POP_JUMP_IF_TRUE</td><td>115</td></tr><tr><td>LOAD_GLOBAL</td><td>116</td></tr><tr><td>IS_OP</td><td>117</td></tr><tr><td>CONTAINS_OP</td><td>118</td></tr><tr><td>JUMP_IF_NOT_EXC_MATCH</td><td>121</td></tr><tr><td>SETUP_FINALLY</td><td>122</td></tr><tr><td>LOAD_FAST</td><td>124</td></tr><tr><td>STORE_FAST</td><td>125</td></tr><tr><td>DELETE_FAST</td><td>126</td></tr><tr><td>RAISE_VARARGS</td><td>130</td></tr><tr><td>CALL_FUNCTION</td><td>131</td></tr><tr><td>MAKE_FUNCTION</td><td>132</td></tr><tr><td>BUILD_SLICE</td><td>133</td></tr><tr><td>LOAD_CLOSURE</td><td>135</td></tr><tr><td>LOAD_DEREF</td><td>136</td></tr><tr><td>STORE_DEREF</td><td>137</td></tr><tr><td>DELETE_DEREF</td><td>138</td></tr><tr><td>CALL_FUNCTION_KW</td><td>141</td></tr><tr><td>CALL_FUNCTION_EX</td><td>142</td></tr><tr><td>SETUP_WITH</td><td>143</td></tr><tr><td>LIST_APPEND</td><td>145</td></tr><tr><td>SET_ADD</td><td>146</td></tr><tr><td>MAP_ADD</td><td>147</td></tr><tr><td>LOAD_CLASSDEREF</td><td>148</td></tr><tr><td>EXTENDED_ARG</td><td>144</td></tr><tr><td>SETUP_ASYNC_WITH</td><td>154</td></tr><tr><td>FORMAT_VALUE</td><td>155</td></tr><tr><td>BUILD_CONST_KEY_MAP</td><td>156</td></tr><tr><td>BUILD_STRING</td><td>157</td></tr><tr><td>LOAD_METHOD</td><td>160</td></tr><tr><td>CALL_METHOD</td><td>161</td></tr><tr><td>LIST_EXTEND</td><td>162</td></tr><tr><td>SET_UPDATE</td><td>163</td></tr><tr><td>DICT_MERGE</td><td>164</td></tr><tr><td>DICT_UPDATE</td><td>165</td></tr></tbody></table><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>在本篇文章当中主要给大家介绍了 cpython 当中对于字节码和源代码和字节码之间的映射关系的具体设计，这对于我们深入去理解 cpython 虚拟机的设计非常有帮助！</p><hr><p>本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython</p>`,57),u={href:"https://github.com/Chang-LeHung/CSCore",target:"_blank",rel:"noopener noreferrer"},k=n("p",null,"关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。",-1),b=n("p",null,[n("img",{src:t,alt:""})],-1);function m(_,v){const a=p("ExternalLinkIcon");return o(),d("div",null,[r,n("p",null,[s("更多精彩内容合集可访问项目："),n("a",u,[s("https://github.com/Chang-LeHung/CSCore"),c(a)])]),k,b])}const T=e(i,[["render",m],["__file","03bytecode_upload.html.vue"]]);export{T as default};
