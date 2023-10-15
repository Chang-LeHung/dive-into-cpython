# 深入理解 Python 虚拟机：协程初探——不过是生成器而已

在 Python 3.4 Python 引入了一个非常有用的特性——协程，在后续的 Python 版本当中不断的进行优化和改进，引入了新的 await 和 async 语法。在本篇文章当中我们将详细介绍一下 Python 协程的原理以及虚拟机具体的实现协程的方式。

## 什么是协程

Coroutines are computer program components that allow execution to be suspended and resumed, generalizing subroutines for cooperative multitasking. 

根据 wiki 的描述，协程是一个允许停下来和恢复执行的程序，从文字上来看这与我们的常识或者直觉是相互违背的，因为在大多数情况下我们的函数都是执行完才返回的。其实目前 Python 当中早已有了一个特性能够做到这一点，就是生成器，如果想深入了解一下生成器的实现原理和相关的字节码可以参考这篇文章 [深入理解 Python 虚拟机：生成器停止背后的魔法](https://github.com/Chang-LeHung/dive-into-cpython/blob/master/pvm/10generator.md) 。

现在在 Python 当中可以使用 async 语法定一个协程函数（当函数使用 async 进行修饰的时候这个函数就是协程函数），当我们调用这个函数的时候会返回一个协程对象，而不是直接调用函数：

```python
>>> async def hello():
...     return 0
... 
>>> hello()
<coroutine object hello at 0x100a04740>
```

在 inspect 模块当中也有一个方法用于判断一个函数是否是协程函数：

```python
import inspect

async def hello():
	return 0

print(inspect.iscoroutinefunction(hello)) # True
```

在 Python 当中当你想创建一个协程的话，就直接使用一个 async 关键字定一个函数，调用这个函数就可以得到一个协程对象。

在协程当中可以使用 await 关键字等待其他协程完成，当被等待的协程执行完成之后，就会返回到当前协程继续执行：

```python 
import asyncio
import datetime
import time


async def sleep(t):
	time.sleep(t)


async def hello():
	print("start a coroutine", datetime.datetime.now())
	await sleep(3)
	print("wait for 3s", datetime.datetime.now())


if __name__ == '__main__':
	coroutine = hello()
	try:
		coroutine.send(None)
	except StopIteration:
		print("coroutine finished")
```

```bash
start a coroutine 2023-10-15 02:21:33.503505
wait for 3s 2023-10-15 02:21:36.503984
coroutine finished
```

在上面的程序当中，await asyncio.sleep(3) 确实等待了 3 秒之后才继续执行。

## 协程的实现

在 Python 当中协程其实就是生成器，只不过在生成器的基础之上稍微包装了一下，比如在写成当中的 await 语句，其实作用和 yield from 对于生成器的作用差不多，稍微有点细微差别。我们用几个例子来详细分析一下协程和生成器之间的关系：

```python
async def hello():
	return 0

if __name__ == '__main__':
	coroutine = hello()
	print(coroutine)
	try:
		coroutine.send(None)
	except StopIteration:
		print("coroutine finished")
```

上面的代码的输出结果：

```bash
<coroutine object hello at 0x1170200c0>
coroutine finished
```

在上面的代码当中首先调用 hello 之后返回一个协程对象，协程对象和生成器对象一样都有 send 方法，而且作用也一样都是让协程开始执行，然后写成直接执行完成。和生成器一样当一个生成器执行完成之后会产生 StopIteration 异常，因此需要对异常进行 try catch 处理。和协程还有一个相关的异常为 StopAsyncIteration，这一点我们后面在详细说。

我们再来写一个稍微复杂一点例子：

```python
async def bar():
	return "bar"


async def foo():
	name = await bar()
	print(f"{name = }")
	return "foo"


if __name__ == '__main__':
	coroutine = foo()
	try:
		coroutine.send(None)
	except StopIteration as e:
		print(f"{e.value = }")
```

上面的程序的输出结果如下所示：

```python
name = 'bar'
e.value = 'foo'
```

上面两个协程都正确的执行完了代码，我们现在来看一下协程程序的字节码是怎么样的，上面的 foo 函数对应的字节码如下所示：

```bash
  9           0 LOAD_GLOBAL              0 (bar)
              2 CALL_FUNCTION            0
              4 GET_AWAITABLE
              6 LOAD_CONST               0 (None)
              8 YIELD_FROM
             10 STORE_FAST               0 (name)

 10          12 LOAD_GLOBAL              1 (print)
             14 LOAD_CONST               1 ('name = ')
             16 LOAD_FAST                0 (name)
             18 FORMAT_VALUE             2 (repr)
             20 BUILD_STRING             2
             22 CALL_FUNCTION            1
             24 POP_TOP

 11          26 LOAD_CONST               2 ('foo')
             28 RETURN_VALUE
```

在上面的代码当中和 await 语句相关的字节码有两条，分别是 GET_AWAITABLE 和 YIELD_FROM，在函数 foo 当中首先会调用函数 bar 得到一个协程对象，得到的这个协程对象会放到虚拟机的栈顶，然后执行 GET_AWAITABLE 这条字节码来说对于协程来说相当于没执行。他具体的操作为弹出栈顶元素，如果栈顶元素是一个协程对象，则直接将这个协程对象再压回栈顶，如果不是则调用对象的 `__await__` 方法，将这个方法的返回值压入栈顶。

然后需要运行的字节码就是 YIELD_FROM，这个字节码和 "yield from" 语句对应的字节码是一样的，这就是为什么说协程就是生成器（准确的来说还是有点不够准确，因为协程只是通过生成器的机制来完成，具体的实现需要编译器、虚拟机和标准库协同工作，才能够很好的完成协程程序）。如果你不了解 YIELD_FROM 的工作原理，可以参考这篇文章：[深入理解 Python 虚拟机：生成器停止背后的魔法](https://github.com/Chang-LeHung/dive-into-cpython/blob/master/pvm/10generator.md)。

我们在使用生成器的方式来重写上面的程序：

```python
def bar():
	yield # 这条语句的主要作用是将函数编程生成器
	return "bar"


def foo():
	name = yield from bar()
	print(f"{name = }")
	return "foo"


if __name__ == '__main__':
	generator = foo()
	try:
		generator.send(None) # 运行到第一条 yield 语句
		generator.send(None) # 从 yield 语句运行完成
	except StopIteration as e:
		print(f"{e.value = }")
```

我们再来看一下 foo 函数的字节码：

```bash
  7           0 LOAD_GLOBAL              0 (bar)
              2 CALL_FUNCTION            0
              4 GET_YIELD_FROM_ITER
              6 LOAD_CONST               0 (None)
              8 YIELD_FROM
             10 STORE_FAST               0 (name)

  8          12 LOAD_GLOBAL              1 (print)
             14 LOAD_CONST               1 ('name = ')
             16 LOAD_FAST                0 (name)
             18 FORMAT_VALUE             2 (repr)
             20 BUILD_STRING             2
             22 CALL_FUNCTION            1
             24 POP_TOP

  9          26 LOAD_CONST               2 ('foo')
             28 RETURN_VALUE
```

字节码 GET_YIELD_FROM_ITER 就是从一个对象当中获取一个生成器。这个字节码会弹出栈顶对象，如果对象是一个生成器则直接返回，并且将它再压入栈顶，如果不是则调用对象的 `__iter__` 方法，将这个返回对象压入栈顶。后续执行 YIELD_FROM 方法，就和前面的协程一样了。

## 总结

