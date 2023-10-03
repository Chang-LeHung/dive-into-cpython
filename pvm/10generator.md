# 深入理解 python 虚拟机：生成器停止背后的魔法

在本篇文章当中主要给大家介绍 Python 当中生成器的实现原理，尤其是生成器是如何能够被停止执行，而且还能够被恢复的，这是一个非常让人疑惑的地方。因为这与我们通常使用的函数的直接是相违背的，函数之后执行完成之后才会返回，而生成表面是函数的形式，但是这违背了我们正常的编程直觉。



## 深入理解生成器与函数的区别

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

在上面的代码当中我们要明确 bar 是一个函数，但是这个函数和正常的函数有一点区别，这个函数在被调用的时候不会直接执行代码，而是会返回一个生成器对象，因为在这个函数体当中使用了 yield 语句，我们称这种函数为生成器函数 (generator function)，在 Python 当中你可以通过查看一个函数的 co_flags 字段查看一个函数的属性，如果这个字段和 0x0020 进行 & 操作之后的结果大于 0，那么就说明这个函数是一个生成器函数。

```python
>>> (bar.__code__.co_flags & 0x0020) > 0
True
>>> bar.__code__.co_flags & 0x0020
32
```

从上面的代码当中我们可以看到 bar 就是一个生成器函数，除了上面的方法 Python 的标准库也提供了方法去辅助我们进行判断。

```python
>>> import inspect
>>> inspect.isgeneratorfunction(bar)
True
```

上面的特性在 Python 程序进行编译的时候，编译器可以做到这一点，当发现一个函数当中存在类似 yield 的语句的时候就在函数的 co_flags 字段当中和 0x0020 进行或操作，然后将这个值保存在 co_flags 当中。

总之生成器和函数之间的关系为：生成器对象是通过调用生成器函数得到的，调用生成器函数的返回对象是生成器。

## 虚实交错的时空魔法

首先我们需要了解的是，如果我们想让一个生成器对象执行下去的话，我们可以使用 next 或者 send 函数，进行实现：

```python
>>> next(generator)
before yield
1
>>> next(generator)
res = None
after yield
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
StopIteration: Return Value
```

在 CPython 实现的虚拟机当中，如果我们想要正确的使用 send 函数首先需要让生成器对象执行到第一个 yield 语句，我们可以使用` next(generator)` 或者 `generator.send(None)`。比如在上面的第一条语句当中执行 `next(generator)`，运行到语句 `res = yield 1`，但是这条语句还没有执行完，需要我们调用 send 函数之后才能够完成赋值操作，send 函数的参数会被赋值给变量 res 。当整个函数体执行完成之后虚拟机就会抛出 StopIteration 异常，并且将返回值保存到 StopIteration 异常对象当中：

```python
>>> generator = bar()
>>> next(generator)
before yield
1
>>> try:
...     generator.send("None")
... except StopIteration as e:
...     print(f"{e.value = }")
...
res = 'None'
after yield
e.value = 'Return Value'
>>>
```

上面的代码当中可以看到，我们正确的执行力我们在上面谈到的生成器的使用方法，并且将生成器执行完成之后的返回值保存到异常的 value 当中。

## 生成器内部实现原理

从上面的关于生成器的使用方式来看，生成器可以在函数执行到一半的时候停止，然后继续恢复执行，为了实现这一点我们就需要有一种手段去保存函数执行的状态。但是我们需要保存函数执行的那些状态呢？最重要的两点就是代码现在执行到什么位置了，因为我们之后要继续从下一条指令开始恢复执行，同时我们需要保存虚拟机的栈空间，就是在执行字节码的时候使用到的 valuestack，注意这不是栈帧，同时还有执行函数的局部变量表，这里主要是保存一些局部变量的。而这些东西都保存在虚拟机的栈帧当中了，这一点我们在前面的文章当中已经详细介绍过了。

因此根据这些分析我们应该知道了，生成器里面最重要的就是一个虚拟机的栈帧数据结构了。一个生成器对象当中一定需要有一个虚拟机的栈帧，在 CPython 的实现当中，生成器对象的数据结构如下：

```c
typedef struct
{
    /* The gi_ prefix is intended to remind of generator-iterator. */
    PyObject ob_base;
    struct _frame *gi_frame;
    char gi_running;
    PyObject *gi_code;
    PyObject *gi_weakreflist;
    PyObject *gi_name;
    PyObject *gi_qualname;
    _PyErr_StackItem gi_exc_state;
} PyGenObject;
```

