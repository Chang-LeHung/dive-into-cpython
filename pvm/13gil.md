# 深入理解 python 虚拟机：GIL 源码分析——天使还是魔鬼？

在目前的 CPython 当中一直有一个臭名昭著的问题就是 GIL (Global Interpreter Lock )，就是全局解释器锁，他限制了 Python 在多核架构当中的性能，在本篇文章当中我们将详细分析一下 GIL 的利弊和 GIL 实现的 C 的源代码。

## 选择 GIL 的原因

### GIL 对 Python 代码的影响

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

### GIL 对于虚拟机的影响

除了上面 GIL 对于 Python 代码层面的影响，GIL 对于虚拟机来说还有一个非常好的作用就是他不会让虚拟机产生死锁的现象，因为整个虚拟机只有一把锁🔒。

对于虚拟机的内存管理和垃圾回收来说，GIL 可以说极大的简化了 CPython 内部的内存管理和垃圾回收的实现。我们现在举一个内存管理和垃圾回收的多线程情况会出现数据竞争的场景：

在 Python 当中的垃圾回收是采用引用计数的方式进行处理，如果没有 GIL 那么就会存在多个线程同时对一个 CPython 对象的引用计数进行增加，而现在因为 GIL 的存在也就不需要进行考虑这个问题了。

另外一个比较重要的场景就是内存的申请和释放：在虚拟机内部并不是直接调用 malloc 进行实现的，在 CPython 内部自己实现了一个内存池进行内存的申请和释放（这么做的原因主要是节省内存），因为是自己实现内存池，因此需要保证线程安全，而现在因为有 GIL 的存在，虚拟机实现内存池只需要管单线程的情况，所以使得整个内存管理变得更加简单。

GIL 对与 Python 的第三方 C 库开发人员来说也是非常友好的，当他们在进行第三方库开发的时候不需要去考虑在修改 CPython 对象的线程安全问题，因为已经有 GIL 了。从这个角度来说 GIL 在一定程度上推动了 Python 的发展和普及。

## GIL 带来的问题

GIL 带来的最主要的问题就是当你的程序是计算密集型的时候，比如数学计算、图像处理，GIL 就会带来性能问题，因为他无法在同一个时刻跑多个线程。

之所以没有在 Python 当中删除 GIL，最主要的原因就是目前很多 CPython 第三方库是依赖 GIL 这个特性的，如果直接在虚拟机层面移除 GIL，就会破坏 CPython C-API 的兼容性，这会导致很多依赖 GIL 的第三方 C 库发生错误。而向后兼容这个特性对于社区来说非常重要，这就是目前 CPython 还保留 GIL 最主要的原因。

## GIL 源代码分析

在本小节当中为了更好的说明 GIL 的设计和源代码分析，本小节使用 CPython2.7.6 的 GIL 源代码进行分析，我还翻了一下更早的 CPython 源代码，都是使用这种方式实现的（这种实现方式在 Python 3.2 以后被优化改进了，在本文当中先不提及），我们现在来分析一下 GIL 具体是如何实现的，下面的代码是一 GIL 加锁和解锁的代码以及锁的数据结构表示：

```c
// PyThread_type_lock 就是 void* 的 typedef
void 
PyThread_release_lock(PyThread_type_lock lock)
{
	pthread_lock *thelock = (pthread_lock *)lock;
	int status, error = 0;
  // dprintf 一个宏定义 都是打印消息的，不需要关心，而且默认是不打印
	dprintf(("PyThread_release_lock(%p) called\n", lock));
  // 上锁
	status = pthread_mutex_lock( &thelock->mut );
	CHECK_STATUS("pthread_mutex_lock[3]");
  // 释放全局解释器锁
	thelock->locked = 0;
  // 解锁
	status = pthread_mutex_unlock( &thelock->mut );
	CHECK_STATUS("pthread_mutex_unlock[3]");
  // 因为释放了全局解释器锁，现在需要唤醒一个被阻塞的线程
	/* wake up someone (anyone, if any) waiting on the lock */
	status = pthread_cond_signal( &thelock->lock_released );
	CHECK_STATUS("pthread_cond_signal");
}

// waitflag 表示如果没有获取锁是否需要等待，如果不为 0 就表示没获取锁就等待，即线程被挂起
int 
PyThread_acquire_lock(PyThread_type_lock lock, int waitflag)
{
	int success;
	pthread_lock *thelock = (pthread_lock *)lock;
	int status, error = 0;

	dprintf(("PyThread_acquire_lock(%p, %d) called\n", lock, waitflag));

	status = pthread_mutex_lock( &thelock->mut );
	CHECK_STATUS("pthread_mutex_lock[1]");
	success = thelock->locked == 0;
  // 如果没有上锁，则获取锁成功，并且上锁
	if (success) thelock->locked = 1;
	status = pthread_mutex_unlock( &thelock->mut );
	CHECK_STATUS("pthread_mutex_unlock[1]");

	if ( !success && waitflag ) {
		/* continue trying until we get the lock */

		/* mut must be locked by me -- part of the condition
		 * protocol */
		status = pthread_mutex_lock( &thelock->mut );
		CHECK_STATUS("pthread_mutex_lock[2]");
    // 如果现在已经有线程获取到锁了，就将当前线程挂起
		while ( thelock->locked ) {
			status = pthread_cond_wait(&thelock->lock_released,
						   &thelock->mut);
			CHECK_STATUS("pthread_cond_wait");
		}
    // 当线程被唤醒之后，就说明线程只有当前线程在运行可以直接获取锁
		thelock->locked = 1;
		status = pthread_mutex_unlock( &thelock->mut );
		CHECK_STATUS("pthread_mutex_unlock[2]");
		success = 1;
	}
	if (error) success = 0;
	dprintf(("PyThread_acquire_lock(%p, %d) -> %d\n", lock, waitflag, success));
	return success;
}

```

pthread_lock 的结构体如下所示：

其中锁的结构体如下所示：

```c
typedef struct {
	char             locked; /* 0=unlocked, 1=locked */
	/* a <cond, mutex> pair to handle an acquire of a locked lock */
	pthread_cond_t   lock_released;
	pthread_mutex_t  mut;
} pthread_lock;
```

熟悉 pthread 编程的话，上面的代码应该很轻易可以看懂，我们现在来分析一下这个数据结构：

- locked，表示全局解释器锁 GIL 是否有线程获得锁，0 表示没有，1 则表示目前有线程获取到了这把锁。
- lock_released，主要是用于线程的阻塞和唤醒的，如果当前有线程获取到全局解释器锁了，也就是 locked 的值等于 1，就将线程阻塞（执行pthread_cond_wait），当线程执行释放锁的代码 (PyThread_release_lock) 的时候就会将这个被阻塞的线程唤醒（执行 pthread_cond_signal ）。

- mut，这个主要是进行临界区保护的，因为对于 locked 这个变量的访问是线程不安全的，因此需要用锁进行保护。

在上面的代码当中我们详细介绍了 GIL 的实现源代码，但是还没有介绍虚拟机是如何使用它的。虚拟机在使用 GIL 的时候会有一个问题，那就是如果多个线程同时在虚拟机当中跑的时候，一个线程获取到锁了之后如果一直执行的话，那么其他线程不久饥饿了吗？因此虚拟机需要有一种机制保证当有多个线程同时获取锁的时候不会让线程饥饿。

在 CPython 当中为了不让线程饥饿有一个机制，就是虚拟机会有一个 _Py_Ticker 记录当前线程执行的字节码的个数，让执行的字节码个数超过 _Py_CheckInterval (虚拟机这只这个值为 100) 的时候就会释放锁，然后重新获取锁，在这释放和获取之间就能够让其他线程有机会获得锁从而进行字节码的执行过程。相关的源代码如下所示：

```c
if (--_Py_Ticker < 0) { // 每执行完一个字节码就进行 -- 操作，这个值初始化为 _Py_CheckInterval
    if (*next_instr == SETUP_FINALLY) {
        /* Make the last opcode before
           a try: finally: block uninterruptible. */
        goto fast_next_opcode;
    }
    _Py_Ticker = _Py_CheckInterval; // 重新将这个值设置成 100
    tstate->tick_counter++;
#ifdef WITH_TSC
    ticked = 1;
#endif
    // 这个主要是处理异常信号的 不用管
    if (pendingcalls_to_do) {
        if (Py_MakePendingCalls() < 0) {
            why = WHY_EXCEPTION;
            goto on_error;
        }
        if (pendingcalls_to_do)
            /* MakePendingCalls() didn't succeed.
               Force early re-execution of this
               "periodic" code, possibly after
               a thread switch */
            _Py_Ticker = 0;
    }
#ifdef WITH_THREAD
    // 如果有 GIL 存在
    if (interpreter_lock) {
        /* Give another thread a chance */

        if (PyThreadState_Swap(NULL) != tstate)
            Py_FatalError("ceval: tstate mix-up");
        PyThread_release_lock(interpreter_lock); // 首先释放锁
        /* 其他线程的代码在这就能够运行了 */
        /* Other threads may run now */
        // 然后获取锁
        PyThread_acquire_lock(interpreter_lock, 1);
        if (PyThreadState_Swap(tstate) != NULL)
            Py_FatalError("ceval: orphan tstate");
    }
#endif
}

```



## GIL 的挣扎

在上面的内容当中我们详细讲述了 GIL 的原理，我们可以很明显的发现其中的问题，就是一个时刻只有一个线程在运行，限制了整个虚拟机的性能，但是整个虚拟机还有一个地方可以极大的提高整个虚拟机的性能，就是在进行 IO 操作的时候首先释放 GIL，然后在 IO 操作完成之后重新获取 GIL，这个 IO 操作是广义上的 IO 操作，也包括网络相关的 API，只要和设备进行交互就可以释放 GIL，然后操作执行完成之后重新获取 GIL。

在虚拟机的自带的标准库模块当中，就有很多地方使用了这种方法，比如文件的读写和关闭，我们以文件关闭为例看一下 CPython 是如何操作的：

```c
static int
internal_close(fileio *self)
{
    int err = 0;
    int save_errno = 0;
    if (self->fd >= 0) {
        int fd = self->fd;
        self->fd = -1;
        /* fd is accessible and someone else may have closed it */
        if (_PyVerify_fd(fd)) {
            // 释放全局解释器锁 这是一个宏 会调用前面的释放锁的函数
            Py_BEGIN_ALLOW_THREADS
            err = close(fd);
            if (err < 0)
                save_errno = errno;
            // 重新获取全局解释器锁 也是一个宏 会调用前面的获取锁的函数
            Py_END_ALLOW_THREADS
        } else {
            save_errno = errno;
            err = -1;
        }
    }
    if (err < 0) {
        errno = save_errno;
        PyErr_SetFromErrno(PyExc_IOError);
        return -1;
    }
    return 0;
}
```

这就会使得 Python 虽然有 GIL ，但是在 IO 密集型的程序上还是能打的，比如在网络数据采集等领域， Python 还是有很大的比重。

## 总结

在本篇文章当中详细介绍了 CPython 选择 GIL 的原因，以及 GIL 对于 Python 程序和虚拟机的影响，最后详细分析了一个早起版本的 GIL 源代码实现。GIL 可以很大程度上简化虚拟机的设计与实现，因为有一把全局锁，整个虚拟机的开发就会变得更加简单，这种简单对于大型项目来说是非常重要的。同时这对 CPython 第三方库的开发者来说也是福音。最后讨论了 CPython 当中 GIL 的实现和使用方式以及 CPython 使用 ticker 来保证线程不会饥饿的问题。

---

本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。
![](../qrcode2.jpg)



