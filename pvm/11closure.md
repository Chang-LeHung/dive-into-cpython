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

在正式了解闭包相关的字节码之前我们首先来重新回顾一下和闭包有关的 CodeObject 当中的字段：

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

cellvars 表示在其他函数当中会使用本地定义的变量，freevars 表示本地会使用其他函数定义的变量。在上面的例子当中，outer_function 当中的变量 x 会被 inner_function 使用，而cellvars 表示在其他函数当中会使用本地定义的变量，所以 outer_function 的这个字段为 （'x', ）。如果要了解详细的信息可以参考这篇文章 [深入理解 python 虚拟机：字节码灵魂——Code obejct](https://github.com/Chang-LeHung/dive-into-cpython/blob/master/pvm/02codeobject.md#深入理解-python-虚拟机字节码灵魂code-obejct) 。

>上面的内容我们简要回顾了一下 CodeObject 当中的两个非常重要的字段，这两个字段在进行传递参数的时候非常重要，当我们在进行函数调用的时候，虚拟机会新建一个栈帧，在进行新建栈帧的过程当中，如果发现 co_freevars 存储的字符串变量也是函数参数的时候，除了会在局部变量当中保存一份参数之外，还会将传递过来的参数保存到栈帧对象的其他位置当中（这里需要注意一下，CodeObject 当中的 co_freevars 保存的是字符串，也就是变量名，栈帧当中保存的是变量名字对应的真实对象，也就是函数参数），这么做的目的是为了方面后面字节码 LOAD_CLOSURE 的操作，因为实际虚拟机存储的是指向对象的指针，因此浪费不了多少空间。

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

- LOAD_CLOSURE