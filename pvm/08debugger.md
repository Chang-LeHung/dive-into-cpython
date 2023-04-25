# 深入理解python虚拟机：python 调试器实现原理

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

根据前面的学习我们可以了解到，一个 python 程序的执行首先需要经过 python 编译器编译成 python 字节码，然后交给 python 虚拟机进行执行，如果需要程序停下来就一定需要虚拟机给上层的 python 程序提供接口，让程序在执行的时候可以知道现在执行到什么位置了。这个神秘的机制就隐藏在 sys 这个模块当中，事实上这个模块几乎承担了所有我们与 python 解释器交互的接口。

