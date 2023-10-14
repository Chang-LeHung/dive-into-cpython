# 深入理解 Python 虚拟机：协程初探——不过是生成器而已

在 Python 3.4 Python 引入了一个非常有用的特性——协程，在后续的 Python 版本当中不断的进行优化和改进，引入了新的 await 和 async 语法。在本篇文章当中我们将详细介绍一下 Python 协程的原理以及虚拟机具体的实现协程的方式。

## 什么是协程

Coroutines are computer program components that allow execution to be suspended and resumed, generalizing subroutines for cooperative multitasking. 

根据 wiki 的描述，协程是一个允许停下来和恢复执行的程序，从文字上来看这与我们的常识或者直觉是相互违背的，因为在大多数情况下我们的函数都是执行完才返回的。其实目前 Python 当中早已有了一个特性能够做到这一点，就是生成器，如果想深入了解一下生成器的实现原理和相关的字节码可以参考这篇文章 [深入理解 Python 虚拟机：生成器停止背后的魔法](https://github.com/Chang-LeHung/dive-into-cpython/blob/master/pvm/10generator.md) 。



