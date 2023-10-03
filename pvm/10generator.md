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

- gi_frame: 这个字段就是表示生成器所拥有的栈帧。
- gi_running: 表示协程是否在运行。
- gi_code: 表示对应协程函数的代码（字节码）。
- gi_weakreflist: 用于保存这个栈帧对象保存的弱引用对象。
- gi_name 和 gi_qualname 都是表示生成器的名字，后者更加详细。
- gi_exc_state: 用于保存执行生成器代码之前的程序状态，因为之前的代码可能已经产生一些异常了，这个主要用于保存之前的程序状态，待生成器返回之后就进行恢复。

```python
class A:
	def hello(self):
		yield 1


if __name__ == '__main__':
	g = A().hello()
	print(g.__name__)
	print(g.__qualname__)
```

上面的程序输出结果为:

```bash
hello
A.hello
```

## 生成器对应的字节码行为

我们通过下面的例子来分析一下，生成器 yield 对应的字节码：

```python
>>> import dis
>>> def hello():
...     yield 1
...     yield 2
...
>>> dis.dis(hello)
  2           0 LOAD_CONST               1 (1)
              2 YIELD_VALUE
              4 POP_TOP

  3           6 LOAD_CONST               2 (2)
              8 YIELD_VALUE
             10 POP_TOP
             12 LOAD_CONST               0 (None)
             14 RETURN_VALUE
```

在上面的程序当中只有和生成器相关的字节码为 YIELD_VALUE，在加载完常量 1 之后就会执行 YIELD_VALUE 指令，虚拟机在执行完 yield 指令之后，就会直接返回，此时虚拟机的状态——valuestack 和当前指令执行的位置（在上面的这个例子当中就是 4）都会被保存到虚拟机栈帧当中，当下一次执行生成器的代码的时候就会直接从 POP_TOP 指令直接执行。

我们再来看一下另外一个比较重要的指令 YIELD_FROM:

```python
>>> def generator_b(gen):
...     yield from gen
...
>>> dis.dis(generator_b)
  2           0 LOAD_FAST                0 (gen)
              2 GET_YIELD_FROM_ITER
              4 LOAD_CONST               0 (None)
              6 YIELD_FROM
              8 POP_TOP
             10 LOAD_CONST               0 (None)
             12 RETURN_VALUE
```

我们现在用一个简单的例子重新回顾一下程序的行为：

```python
def generator_a():
	yield 1
	yield 2


def generator_b(gen):
	yield from gen


if __name__ == '__main__':
	gen = generator_b(generator_a())
	print(gen.send(None))
	print(gen.send(None))
	try:
		gen.send(None)
	except StopIteration:
		print("generator exit")
```

上面的程序输出结果如下所示：

```bash
1
2
generator exit
```

从上面程序的输出结果我们可以看到 generator_a 的两个值都会被返回，这些魔法隐藏在字节码 YIELD_FROM 当中。YIELD_FROM 字节码会调用栈顶上的生成器对象的 send 方法，并且将参数生成器对象 gen 的返回结果返回，比如 1 和 2 这两个值会被返回到 generator_b ，然后 generator_b 会将这个结果继续传播出来。

- 在这个字节码执行最后会进行判断虚拟机当中是否出现了 StopIteration 异常，如果出现了则说 yield from 的生成器已经执行完了，则 generator_b 继续往下执行。
- 如果没有 StopIteration 异常，则说明 yield from 的生成器没有执行完成，这个时候虚拟机会将当前栈帧的字节码执行位置往前移动，这么做的目的是让下一次生成器执行的时候继续执行 YIELD_FROM 字节码，这就是 YIELD_FROM 能够将另一个生成器对象执行完整的秘密。



