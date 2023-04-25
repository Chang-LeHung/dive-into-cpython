# 深入理解python虚拟机：python 调试器实现原理

调试器是一个编程语言非常重要的部分，调试器是一种用于诊断和修复代码错误（或称为 bug）的工具，它允许开发者在程序执行时逐步查看和分析代码的状态和行为，它可以帮助开发者诊断和修复代码错误，理解程序的行为，优化性能。无论在哪种编程语言中，调试器都是一个强大的工具，对于提高开发效率和代码质量都起着积极的作用。

在本篇文章当中主要给大家介绍 python 语言当中调试器的实现原理，通过了解一个语言的调试器的实现原理我们可以更加深入的理解整个语言的运行机制，可以帮助我们更好的理解程序的执行。

## 让程序停下来

如果我们需要对一个程序进行调试最重要的一个点就是如果让程序停下来，只有让程序的执行停下来我们才能够观察程序执行的状态，比如我们需要调试 99 乘法表：

```python
def m99():
    for i in range(1, 10):
        for j in range(1, i + 1):
            print(f"{i}x{j}={i*j}", end='\t')
        print()


if __name__ == '__main__':
    m99()
```

现在执行命令 `python -m pdb pdbusage.py `  就可以对上面的程序进行调试：

```bash
(py3.8) ➜  pdb_test git:(master) ✗ python -m pdb pdbusage.py
> /Users/xxxx/Desktop/workdir/dive-into-cpython/code/pdb_test/pdbusage.py(3)<module>()
-> def m99():
(Pdb) s
> /Users/xxxx/Desktop/workdir/dive-into-cpython/code/pdb_test/pdbusage.py(10)<module>()
-> if __name__ == '__main__':
(Pdb) s
> /Users/xxxx/Desktop/workdir/dive-into-cpython/code/pdb_test/pdbusage.py(11)<module>()
-> m99()
(Pdb) s
--Call--
> /Users/xxxx/Desktop/workdir/dive-into-cpython/code/pdb_test/pdbusage.py(3)m99()
-> def m99():
(Pdb) s
> /Users/xxxx/Desktop/workdir/dive-into-cpython/code/pdb_test/pdbusage.py(4)m99()
-> for i in range(1, 10):
(Pdb) s
> /Users/xxxx/Desktop/workdir/dive-into-cpython/code/pdb_test/pdbusage.py(5)m99()
-> for j in range(1, i + 1):
(Pdb) s
> /Users/xxxx/Desktop/workdir/dive-into-cpython/code/pdb_test/pdbusage.py(6)m99()
-> print(f"{i}x{j}={i*j}", end='\t')
(Pdb) p i
1
(Pdb) 
```

当然你也可以在 ide 当中进行调试：

![76-debugger](../images/76-debugger.png)

现在的问题是，上面的程序是怎么在程序执行时停下来的呢？

根据前面的学习我们可以了解到，一个 python 程序的执行首先需要经过 python 编译器编译成 python 字节码，然后交给 python 虚拟机进行执行，如果需要程序停下来就一定需要虚拟机给上层的 python 程序提供接口，让程序在执行的时候可以知道现在执行到什么位置了。这个神秘的机制就隐藏在 sys 这个模块当中，事实上这个模块几乎承担了所有我们与 python 解释器交互的接口。实现调试器一个非常重要的函数就是 sys.settrace 函数，这个函数将为线程设置一个追踪函数，当虚拟机有函数调用，执行完一行代码的时候、甚至执行完一条字节码之后就会执行这个函数。

设置系统的跟踪函数，允许在 Python 中实现一个 Python 源代码调试器。该函数是线程特定的；为了支持多线程调试，必须对每个正在调试的线程注册一个跟踪函数，使用 settrace() 或者使用 threading.settrace() 。

跟踪函数应该有三个参数：frame、event 和 arg。frame 是当前的栈帧。event 是一个字符串：'call'、'line'、'return'、'exception'或者'opcode'。arg 取决于事件类型。

**跟踪函数在每次进入新的局部作用域时被调用（事件设置为'call'）；它应该返回一个引用，用于新作用域的本地跟踪函数，或者如果不想在该作用域中进行跟踪，则返回None。**

如果在跟踪函数中发生任何错误，它将被取消设置，就像调用settrace(None)一样。

事件的含义如下：

- call，调用了一个函数（或者进入了其他代码块）。调用全局跟踪函数；arg 为 None；返回值指定了本地跟踪函数。

- line，将要执行一行新的代码。

- return，函数（或其他代码块）即将返回。调用本地跟踪函数；arg是将要返回的值，如果事件是由引发的异常引起的，则arg为None。跟踪函数的返回值将被忽略。

- exception，发生了异常。调用本地跟踪函数；arg是一个元组（exception，value，traceback）；返回值指定了新的本地跟踪函数。

- opcode，解释器即将执行新的操作码（有关操作码详细信息，请参见dis）。调用本地跟踪函数；arg为None；返回值指定了新的本地跟踪函数。默认情况下，不会发出每个操作码的事件：必须通过在帧上设置f_trace_opcodes为True来显式请求。

- c_call，一个 c 函数将要被调用。

- c_exception，调用 c 函数的时候产生了异常。

