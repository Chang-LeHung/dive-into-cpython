# 深入理解 python 虚拟机：原来虚拟机是这么实现闭包的

在本篇文章当中主要从虚拟机层面讨论函数闭包是如何实现的，当能够从设计者的层面去理解闭包就再也不用死记硬背一些闭包的概念了，因为如果你理解闭包的设计原理之后，这些都是非常自然的。

根据 wiki 的描述，a closure is a record storing a function together with an environment。所谓闭包就是将函数和环境存储在一起的记录。这里有三个重点一个是函数，一个是环境（简单说来就是程序当中变量），最后一个需要将两者组合在一起所形成的东西，才叫做闭包。

## Python 中的闭包

我们现在用一种更加直观的方式描述一下闭包：闭包是指在函数内部定义的函数，它可以访问外部函数的局部变量，并且可以在外部函数执行完后继续使用这些变量。这是因为闭包在创建时会捕获其所在作用域的变量，然后保持对这些变量的引用。下面是一个详细的Python闭包示例：

```python
def outer_function(x):
    # 外部函数定义了一个局部变量 x

    def inner_function(y):
        # 内部函数可以访问外部函数的局部变量 x
        return x + y

    # 外部函数返回内部函数的引用，形成闭包
    return inner_function

# 创建两个闭包实例，分别使用不同的 x 值
closure1 = outer_function(10)
closure2 = outer_function(20)

# 调用闭包，它们仍然可以访问其所在外部函数的 x 变量
result1 = closure1(5)  # 计算 10 + 5，结果是 15
result2 = closure2(5)  # 计算 20 + 5，结果是 25

print(result1)
print(result2)
```

在上面的示例中，`outer_function` 是外部函数，它接受一个参数 `x`，然后定义了一个内部函数 `inner_function`，它接受另一个参数 `y`，并返回 `x + y` 的结果。当我们调用 `outer_function` 时，它返回了一个对 `inner_function` 的引用，形成了一个闭包。这个闭包可以保持对 `x` 的引用，即使 `outer_function` 已经执行完毕。

在上面的例子当中 `outer_function` 的返回值就是闭包，这个闭包包含函数和环境，函数是 `inner_function` ，环境就是 `x`，从程序语义的层面来说返回值是一个闭包，但是如果直接从 Python 层面来看，返回值也是一个函数，现在我们打印两个闭包看一下结果：

```python
>>> print(closure1)
<function outer_function.<locals>.inner_function at 0x102e17a60>
>>> print(closure2)
<function outer_function.<locals>.inner_function at 0x1168bc430>
```

从上面的输出结果可以看到两个闭包（从 Python 层面来说也是函数）所在的内存地址是不一样的，因此每次调用都会返回一个不同的函数（闭包），因此两个闭包相互不影响。

再来看下面的程序，他们的执行结果是什么？

```python
def outer_function(x):
	def inner_function(y):
		nonlocal x
		x += 1
		return x + y

	return inner_function


closure1 = outer_function(10)
closure2 = outer_function(20)

result1 = closure1(5)
print(result1)
result1 = closure1(5)
print(result1)
result2 = closure2(5)
print(result2)
```

输出结果为：

```bash
16
17
26
```

根据上面的分析 closure1 和 closure2 分别是两个不同的闭包，两个闭包的 x 也是各自的 x ，因此前一个闭包的 x 变化并不会影响第二个闭包，所以 result2 的输出结果为 26。

## 闭包相关的字节码

在正式了解闭包相关的字节码之前我们首先来重新回顾一下 CodeObject 当中的字段：

```python
def outer_function(x):
	def inner_function(y):
		nonlocal x
		x += 1
		return x + y

	print(inner_function.__code__.co_freevars)  # ('x',)
	print(inner_function.__code__.co_cellvars)  # （）
	return inner_function


if __name__ == '__main__':
	out = outer_function(1)
	print(outer_function.__code__.co_freevars)  # （）
	print(outer_function.__code__.co_cellvars)  # （'x', ）
```

cellvars 表示在其他函数当中会使用本地定义的变量，freevars 表示本地会使用其他函数定义的变量。在上面的例子当中，outer_function 当中的变量 x 会被 inner_function 使用，而cellvars 表示在其他函数当中会使用本地定义的变量，所以 outer_function 的这个字段为 （'x', ）。如果要了解详细的信息可以参考这篇文章 [深入理解 python 虚拟机：字节码灵魂——Code object](https://github.com/Chang-LeHung/dive-into-cpython/blob/master/pvm/02codeobject.md#深入理解-python-虚拟机字节码灵魂code-object) 。

>上面的内容我们简要回顾了一下 CodeObject 当中的两个非常重要的字段，这两个字段在进行传递参数的时候非常重要，当我们在进行函数调用的时候，虚拟机会新建一个栈帧，在进行新建栈帧的过程当中，如果发现 co_cellvars 存储的字符串变量也是函数参数的时候，除了会在局部变量当中保存一份参数之外，还会将传递过来的参数保存到栈帧对象的其他位置当中（这里需要注意一下，CodeObject 当中的 co_freevars 保存的是字符串，也就是变量名，栈帧当中保存的是变量名字对应的真实对象，也就是函数参数），这么做的目的是为了方面后面字节码 LOAD_CLOSURE 的操作，因为实际虚拟机存储的是指向对象的指针，因此浪费不了多少空间。
>
>实际在虚拟机的栈帧对象当中 freevars 是一个数组，后续的字节码都是会根据数组下标对这些变量进行操作。

下面我们分析一下和闭包相关的字节码操作

```python
def outer_function(x):
	def inner_function(y):
		nonlocal x
		x += 1
		return x + y

	return inner_function


if __name__ == '__main__':
	import dis

	dis.dis(outer_function)
```

上面的代码回输出 outer_function 和 inner_function 对应的字节码：

``` bash
  2           0 LOAD_CLOSURE             0 (x)
              2 BUILD_TUPLE              1
              4 LOAD_CONST               1 (<code object inner_function at 0x100757a80, file "closure_bytecode.py", line 2>)
              6 LOAD_CONST               2 ('outer_function.<locals>.inner_function')
              8 MAKE_FUNCTION            8 (closure)
             10 STORE_FAST               1 (inner_function)

  7          12 LOAD_FAST                1 (inner_function)
             14 RETURN_VALUE

Disassembly of <code object inner_function at 0x100757a80, file "closure_bytecode.py", line 2>:
  4           0 LOAD_DEREF               0 (x)
              2 LOAD_CONST               1 (1)
              4 INPLACE_ADD
              6 STORE_DEREF              0 (x)

  5           8 LOAD_DEREF               0 (x)
             10 LOAD_FAST                0 (y)
             12 BINARY_ADD
             14 RETURN_VALUE
```

我们现在来详细解释一下上面的字节码含义：

- LOAD_CLOSURE：这个就是从栈帧对象当中加载指定下标的 cellvars 变量，在上面的字节码当中就是加载栈帧对象 cellvars 当中下标为 0 的对象，对应的参数就是 x 。也就是将参数 x 加载到栈帧上。
- BUILD_TUPLE：从栈帧当中弹出 oparg (字节码参数) 个参数，并且将这些参数封装成元祖，在上面的程序当中 oparg = 1 。
- LOAD_CONST：加载对应的常量到栈帧当中，这里是会加载两个常量，分别是函数对应的 CodeObject 和函数名。

在执行完上的字节码之后栈帧当中 valuestack 如下所示：

![](https://img2023.cnblogs.com/blog/2519003/202310/2519003-20231007130727241-1806043651.png)

- MAKE_FUNCTION：这条字节码的主要作用是根据上面三个栈里面的对象创建一个函数，其中最重要的字段就是 CodeObject 这里面保存了函数最重要的代码，最下面的元祖就是 inner_function 的 freevars，当虚拟机在创建函数的时候就已经把这个对象保存下来了，然后在创建栈帧的时候会将这个对象保存到栈帧。需要注意的是这里所保存的变量就是函数参数 x，他们是同一个对象。这就使得内部函数每次调用的时候都可以使用参数 x 。

我们再来看一下函数 inner_function 的字节码

- LOAD_DEREF：这个字节码会从栈帧的 freevars 数组当中加载下标为 oparg 的对象，freevars 就是刚刚在创建函数的时候所保存的，也就是 outer_function 传递给 inner_function 的元祖。直观的来说就是将外部函数的 x 加载到 valuestack 当中。
- STORE_DEREF：就是将栈顶的元素弹出，保存到 cellvars 数组对应的下标 (oparg) 当中。

后续的字节码就很简单了，这里不做详细分析了。

>如果上面的过程太复杂，我们在这里从整体的角度再叙述一下，简单说来就是当有代码调用 outer_function 的时候，传递进来的参数，会在 outer_function 创建函数 inner_function 的时候当作闭包参数传递给 inner_function，这样 inner_function 就能够使用 outer_function 的参数了，因此这也不难理解，每次我们调用函数 outer_function 都会返回一个新的闭包（实际就是返回的新创建的函数），因为我们每次调用函数 outer_function 时，它都会创建一个新的函数，而这些被创建的函数唯一的区别就是他们的闭包参数不同。这也就解释了再之前的例子当中为什么两个闭包他们互不影响，因为函数 outer_function 创建了两个不同的函数。

## 总结

在本篇文章当中详细介绍了闭包的使用例子和使用原理，理解闭包最重要的一点就是函数和环境，也就是和函数绑定在一起的变量。当进行函数调用的时候函数就会创建一个新的内部函数，也就是闭包。在虚拟机内部实现闭包主要是通过函数参数传递和函数生成实现的，当执行 MAKE_FUNCTION 创建新函数的时候，会将外部函数的闭包变量 (在文章中就是 x ) 传递给内部函数，然后保存在内部函数当中，之后的每一次调用都是用这个变量，从而实现闭包的效果。

---

本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。
![](https://img2023.cnblogs.com/blog/2519003/202310/2519003-20231007130727540-1556371129.png)

