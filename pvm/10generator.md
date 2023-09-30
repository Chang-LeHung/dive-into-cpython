# 深入理解 python 虚拟机：生成器停止背后的魔法

在本篇文章当中主要给大家介绍 Python 当中生成器的实现原理，尤其是生成器是如何能够被停止执行，而且还能够被恢复的，这是一个非常让人疑惑的地方。因为这与我们通常使用的函数的直接是相违背的，函数之后执行完成之后才会返回，而生成表面是函数的形式，但是这违背了我们正常的编程直觉。



## 生成器与函数的区别

为了从根本上建立对生成器的认识，我们首先就需要深入理解一下生成器和函数的区别。其实在从虚拟机的层面来看，他们两个都是对象，只不过一个是生成器对象，一个是函数对象。在 Python 当中，如果你在函数里面使用了 yield 语句，那么你的这个函数在被调用的时候就不会被执行，而是会返回一个生成器对象。

```python
>>> def bar():
...     print("before yield")
...     res = yield 1
...     print(f"{res = }")
...     print("after yield")
...     return "Return Value"
...
>>> generator = bar()
>>> generator
<generator object bar at 0x105267510>
>>> bar
<function bar at 0x10562fc40>
>>>
```

在 Python 当中有的对象是可以直接调用的，比如你自己的类如果实现了`__call__`方法的话，这个类生成的对象就是一个可调用对象，在 Python 当中一个最常见的可调用对象就是函数了，生成器和函数的区别之一就是，生成器不能够直接被调用，而函数可以。

```python
>>> generator()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: 'generator' object is not callable
>>>
```

在上面的代码当中我们要明确 bar 是一个函数，但是这个函数和正常的函数有一点区别，这个函数返回
