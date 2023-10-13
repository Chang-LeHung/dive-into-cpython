# 深入理解 python 虚拟机：GIL 源码分析——天使还是魔鬼？

在目前的 CPython 当中一直有一个臭名昭著的问题就是 GIL (Global Interpreter Lock )，就是全局解释器锁，他限制了 Python 在多核架构当中的性能，在本篇文章当中我们将详细分析一下 GIL 的利弊和 GIL 实现的 C 的源代码。



## 选择 GIL 的原因

简单来说，Python 全局解释器锁或 GIL 是一个互斥锁，只允许一个线程保持 Python 解释器的控制权，也就是说在同一个时刻只能够有一个线程执行 Python 代码，如果整个程序是单线程的这也无伤大雅，但是如果你的程序是多线程计算密集型的程序的话，这对程序的影响就很大了。

因为整个虚拟机都有一把大锁进行保护，所以虚拟的代码就可以认为是单线程执行的，因此不需要做线程安全的防护，直接按照单线程的逻辑就行了。不仅仅是虚拟机，Python 层面的代码也是这样，对于 Python 层面的多线程代码也可以不用锁保护，因为本身就是线程安全的：

```python
import threading

data = []


def add_data(n):
	for i in range(n):
		data.append(i)


if __name__ == '__main__':
	ts = [threading.Thread(target=add_data, args=(10,)) for _ in range(10)]
	for t in ts:
		t.start()
	for t in ts:
		t.join()

	print(data)
	print(len(data))
	print(sum(data))
```

在上面的代码当中，当程序执行完之后 `len(data)` 的值永远都是 100，`sum(data) ` 的值永远都是 450，因为上面的代码是线程安全的，可能你会有所疑惑，上面的代码启动了 10 个线程同时往列表当中增加数据，如果两个线程同时增加数据的时候就有可能存在线程之间覆盖的情况，最终的 `len(data)` 的长度应该小于 100 ？

上面的代码之所以是线程安全的原因是因为 `data.append(i)` 执行 append 只需要虚拟机的一条字节码，而在前面介绍 GIL 时候已经谈到了，每个时刻只能够有一个线程在执行虚拟机的字节码，这就保证了每个 append 的操作都是原子的，因为只有一个 append 操作执行完成之后其他的线程才能够执行 append 操作。

我们来看一下上面程序的字节码：

```python
  5           0 LOAD_GLOBAL              0 (range)
              2 LOAD_FAST                0 (n)
              4 CALL_FUNCTION            1
              6 GET_ITER
        >>    8 FOR_ITER                14 (to 24)
             10 STORE_FAST               1 (i)

  6          12 LOAD_GLOBAL              1 (data)
             14 LOAD_METHOD              2 (append)
             16 LOAD_FAST                1 (i)
             18 CALL_METHOD              1
             20 POP_TOP
             22 JUMP_ABSOLUTE            8
        >>   24 LOAD_CONST               0 (None)
             26 RETURN_VALUE
```

在上面的字节码当中 `data.append(i)` 对应的字节码为 (14, 16, 18) 这三条字节码，而 (14, 16) 是不会产生数据竞争的问题的，因为他只是加载对象的方法和局部变量 `i` 的值，让 append 执行的方法是字节码 CALL_METHOD，而同一个时刻只能够有一个字节码在执行，因此这条字节码也是线程安全的，所以才会有上面的代码是线程安全的情况出现。

我们再来看一个非线程安全的例子：

```python
import threading
data = 0
def add_data(n):
	global data
	for i in range(n):
		data += 1

if __name__ == '__main__':
	ts = [threading.Thread(target=add_data, args=(100000,)) for _ in range(20)]
	for t in ts:
		t.start()
	for t in ts:
		t.join()
	print(data)
```

在上面的代码当中对于 data += 1 这个操作就是非线程安全的，因为这行代码汇编编译成 3 条字节码：

```bash
  9          12 LOAD_GLOBAL              1 (data)
             14 LOAD_CONST               1 (1)
             16 INPLACE_ADD
```

首先 LOAD_GLOBAL，加载 data 数据，LOAD_CONST 加载常量 1，最后执行 INPLACE_ADD 进行加法操作，这就可能出现线程1执行完 LOAD_GLOBAL 之后，线程 2 连续执行 3 条字节码，那么这个时候 data 的值已经发生变化了，而线程 1 拿的还是旧的数据，因此最终执行的之后会出现线程不安全的情况。（实际上虚拟机在执行的过程当中，发生数据竞争比这个复杂很多，这里只是简单说明一下）

GIL 最终大的影响是对于虚拟机，对于虚拟机的内存管理和垃圾回收来说，GIL 可以说极大的简化了 CPython 内部的内存管理和垃圾回收的实现。我们现在举一个内存管理和垃圾回收的多线程情况会出现数据竞争的场景：

在 Python 当中的垃圾回收是采用引用计数的方式进行处理，如果没有 GIL 那么就会存在多个线程同时对一个 CPython 对象的引用计数进行增加，而现在因为 GIL 的存在也就不需要进行考虑这个问题了。

另外一个比较重要的场景就是内存的申请和释放：在虚拟机内部并不是直接调用 malloc 进行实现的，在 CPython 内部自己实现了一个内存池进行内存的申请和释放（这么做的原因主要是节省内存），因为是自己实现内存池，因此需要保证线程安全，而现在因为有 GIL 的存在，虚拟机实现内存池只需要管单线程的情况，所以使得整个内存管理变得更加简单。



