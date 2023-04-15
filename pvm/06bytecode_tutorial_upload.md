# 深入理解 python 虚拟机：字节码教程(3)——深入剖析循环实现原理

在本篇文章当中主要给大家介绍 cpython 当中跟循环相关的字节码，这部分字节码相比起其他字节码来说相对复杂一点，通过分析这部分字节码我们对程序的执行过程将会有更加深刻的理解。

## 循环

### 普通 for 循环实现原理

我们使用各种例子来理解和循环相关的字节码：

```python
def test_loop():
    for i in range(10):
        print(i)
```

上面的代码对应的字节码如下所示：

```bash
  8           0 LOAD_GLOBAL              0 (range)
              2 LOAD_CONST               1 (10)
              4 CALL_FUNCTION            1
              6 GET_ITER
        >>    8 FOR_ITER                12 (to 22)
             10 STORE_FAST               0 (i)

  9          12 LOAD_GLOBAL              1 (print)
             14 LOAD_FAST                0 (i)
             16 CALL_FUNCTION            1
             18 POP_TOP
             20 JUMP_ABSOLUTE            8
        >>   22 LOAD_CONST               0 (None)
             24 RETURN_VALUE
```

首先是 range 他对应一个 builtin 的类型，在执行上面的字节码的过程当中，首先先将 range 将在进入栈空间当中，然后将常量 10 加载进入栈空间当中，最后会调用指令 CALL_FUNCTION，这个时候会将栈顶的两个元素弹出，调用 range 类型的创建函数，这个函数会返回一个 range 的实例对象。

这个时候栈的结果如下所示：


![](https://img2023.cnblogs.com/blog/2519003/202304/2519003-20230415172341979-425125403.png)

接下来的一条字节码为 GET_ITER，这条字节码的含义为，弹出栈顶的对象，并且将弹出的对象变成一个迭代器，并且将得到的迭代器对象再压入栈空间当中。

![](https://img2023.cnblogs.com/blog/2519003/202304/2519003-20230415172342305-35771567.png)

接下来的一条指令是 FOR_ITER，这条指令的含义为：已知栈顶对象是一个迭代器，调用这个迭代器的 \_\_next\_\_ 函数 ：

- 如果迭代器已经迭代完成了，则将栈顶的迭代器弹出，并且将 bytecode 的 counter 加上对应的参数值，在上面的函数字节码当中这个参数值等于 12 ，也就是说下一条指令为字节码序列的 22 这个位置。
- 如果没有迭代完成则将函数的返回值压入栈顶，并且不需要弹出迭代器，比如当我们第一次调用 \_\_next\_\_ 函数的时候，range 的返回值为0，那么此时栈空间的内容如下所示：

![](https://img2023.cnblogs.com/blog/2519003/202304/2519003-20230415172342615-1578610687.png)

接下来执行的字节码为 STORE_FAST，这条字节码的含义就是弹出栈顶的元素，并且将这个元素保存到 co_varnames[var_num] 当中，var_num 就是这条字节码的参数，在上面的函数当中就是 0，对应的变量为 i ，因此这条字节码的含义就是弹出栈顶的元素并且保存到变量 i 当中。

LOAD_GLOBAL，将内嵌函数 print 加载进入栈中，LOAD_FAST 将变量 i 加载进入栈空间当中，此时栈空间的内容如下所示：

![](https://img2023.cnblogs.com/blog/2519003/202304/2519003-20230415172342935-481440438.png)

CALL_FUNCTION 会调用 print 函数打印数字 0，并且将函数的返回值压入栈空间当中，print 函数的返回值为 None，此时栈空间的内容如下所示：

![](https://img2023.cnblogs.com/blog/2519003/202304/2519003-20230415172343286-1161277575.png)

POP_TOP 将栈顶的元素弹出，JUMP_ABSOLUTE 字节码有一个参数，在上面的函数当中这个参数为 8 ，当执行这条字节码的时候直接将 bytecode 的 counter 直接设置成这个参数值，因此执行完这条字节码之后下一条被执行的字节码又是 FOR_ITER，这便实现了循环的效果。

综合分析上面的分析过程，实现循环的效果主要是有两个字节码实现的，一个是 FOR_ITER，当迭代器迭代完成之后，会直接跳出循环，实现这个的原理是在字节码的 counter 上加上一个值，另外一个就是 JUMP_ABSOLUTE，他可以直接跳到某一处的字节码位置进行执行。

### continue 关键字实现原理

```python
def test_continue():
    for i in range(10):
        data = random.randint(0, 10)
        if data < 5:
            continue
        print(f"{data = }")
```

其实通过对上面的字节码的分析之后，我们可以大致分析出 continue 的实现原理，首先我们知道 continue 的语意直接进行下一次循环，这个语意其实和循环体执行完之后的语意是一样的，在上一份代码的分析当中实现这个语意的字节码是 JUMP_ABSOLUTE，直接跳到 FOR_ITER 指令的位置继续开始执行。我们现在来看看上面的函数对应的字节码是什么：

```bash
 13           0 LOAD_GLOBAL              0 (range)
              2 LOAD_CONST               1 (10)
              4 CALL_FUNCTION            1
              6 GET_ITER
        >>    8 FOR_ITER                40 (to 50)
             10 STORE_FAST               0 (i)

 14          12 LOAD_GLOBAL              1 (random)
             14 LOAD_METHOD              2 (randint)
             16 LOAD_CONST               2 (0)
             18 LOAD_CONST               1 (10)
             20 CALL_METHOD              2
             22 STORE_FAST               1 (data)

 15          24 LOAD_FAST                1 (data)
             26 LOAD_CONST               3 (5)
             28 COMPARE_OP               0 (<)
             30 POP_JUMP_IF_FALSE       34

 16          32 JUMP_ABSOLUTE            8

 17     >>   34 LOAD_GLOBAL              3 (print)
             36 LOAD_CONST               4 ('data = ')
             38 LOAD_FAST                1 (data)
             40 FORMAT_VALUE             2 (repr)
             42 BUILD_STRING             2
             44 CALL_FUNCTION            1
             46 POP_TOP
             48 JUMP_ABSOLUTE            8
        >>   50 LOAD_CONST               0 (None)
             52 RETURN_VALUE
```

- LOAD_GLOBAL 0 (range): 加载全局变量 range，将其压入栈顶。
- LOAD_CONST 1 (10): 加载常量值 10，将其压入栈顶。
- CALL_FUNCTION 1: 调用栈顶的函数，此处为 range 函数，并传入一个参数，参数个数为 1。
- GET_ITER: 获取迭代器对象。
- FOR_ITER 40 (to 50): 迭代循环的开始，当迭代完成之后将字节码的 counter 加上 40 ，也就是跳转到 50 的位置执行。
- STORE_FAST 0 (i): 将迭代器的值存储到局部变量 i 中。
- LOAD_GLOBAL 1 (random): 加载全局变量 random，将其压入栈顶。
- LOAD_METHOD 2 (randint): 加载对象 random 的属性 randint，将其压入栈顶。
- LOAD_CONST 2 (0): 加载常量值 0，将其压入栈顶。
- LOAD_CONST 1 (10): 加载常量值 10，将其压入栈顶。
- CALL_METHOD 2: 调用栈顶的方法，此处为 random.randint 方法，并传入两个参数，参数个数为 2。
- STORE_FAST 1 (data): 将方法返回值存储到局部变量 data 中。
- LOAD_FAST 1 (data): 加载局部变量 data，将其压入栈顶。
- LOAD_CONST 3 (5): 加载常量值 5，将其压入栈顶。
- COMPARE_OP 0 (<): 执行比较操作 <，将结果压入栈顶。
- POP_JUMP_IF_FALSE 34: 如果栈顶的比较结果为假，则跳转到字节码偏移为 34 的位置。
- JUMP_ABSOLUTE 8: 无条件跳转到字节码偏移为 8 的位置，即循环的下一次迭代。
- LOAD_GLOBAL 3 (print): 加载全局变量 print，将其压入栈顶。
- LOAD_CONST 4 ('data = '): 加载常量字符串 'data = '，将其压入栈顶。
- LOAD_FAST 1 (data): 加载局部变量 data，将其压入栈顶。
- FORMAT_VALUE 2 (repr): 格式化栈顶的值，并指定格式化方式为 repr。
- BUILD_STRING 2: 构建字符串对象，包含两个格式化后的值。
- CALL_FUNCTION 1: 调用栈顶的函数，此处为 print 函数，并传入一个参数，参数个数为 1。
- POP_TOP: 弹出栈顶的值，也就是函数 print 的返回值，print 函数返回值为 None 。
- JUMP_ABSOLUTE 8: 无条件跳转到字节码偏移为 8 的位置，即循环的下一次迭代。
- LOAD_CONST 0 (None): 加载常量值 None，将其压入栈顶。
- RETURN_VALUE: 返回栈顶的值，即 None。

这段字节码实现了一个简单的循环，使用 range 函数生成一个迭代器，然后对迭代器进行遍历，每次遍历都会调用 random.randint 方法生成一个随机数并存储到局部变量 data 中，然后根据 data 的值进行条件判断，如果小于 5 则打印 "data = " 和 data 的值，否则继续下一次循环，直到迭代器结束。最后返回 None。

### break 关键字实现原理

```python
def test_break():
    for i in range(10):
        data = random.randint(0, 10)
        if data < 5:
            break
    return "BREAK"
```

上面的函数对应的字节码如下所示：

```bash
 21           0 LOAD_GLOBAL              0 (range)
              2 LOAD_CONST               1 (10)
              4 CALL_FUNCTION            1
              6 GET_ITER
        >>    8 FOR_ITER                28 (to 38)
             10 STORE_FAST               0 (i)

 22          12 LOAD_GLOBAL              1 (random)
             14 LOAD_METHOD              2 (randint)
             16 LOAD_CONST               2 (0)
             18 LOAD_CONST               1 (10)
             20 CALL_METHOD              2
             22 STORE_FAST               1 (data)

 23          24 LOAD_FAST                1 (data)
             26 LOAD_CONST               3 (5)
             28 COMPARE_OP               0 (<)
             30 POP_JUMP_IF_FALSE        8

 24          32 POP_TOP
             34 JUMP_ABSOLUTE           38
             36 JUMP_ABSOLUTE            8

 26     >>   38 LOAD_CONST               4 ('BREAK')
             40 RETURN_VALUE
```

这段字节码与之前的字节码相似，但有一些细微的不同。

- LOAD_GLOBAL 0 (range): 加载全局变量 range，将其压入栈顶。
- LOAD_CONST 1 (10): 加载常量值 10，将其压入栈顶。
- CALL_FUNCTION 1: 调用函数，函数参数个数为 1。
- GET_ITER: 从栈顶获取可迭代对象，并返回迭代器对象。
- FOR_ITER 28 (to 38): 遍历迭代器，如果迭代器为空，则跳转到字节码偏移为 38 的位置，即跳出循环，否则继续执行下一条字节码。
- STORE_FAST 0 (i): 将迭代器的当前值存储到局部变量 i 中。

接下来的字节码与之前的字节码相似，都是调用 random.randint 方法生成随机数，并将随机数存储到局部变量 data 中。然后，对局部变量 data 进行条件判断，如果小于 5 则跳出循环，否则继续下一次循环。不同的是，这里使用了 POP_TOP 操作来弹出栈顶的值，即格式化后的字符串，无需使用。

- POP_JUMP_IF_FALSE 8: 如果栈顶的值（即 data）不满足条件（小于 5），则跳转到字节码偏移为 8 的位置，即循环的下一次迭代。
- POP_TOP: 弹出栈顶的值，也就是将迭代器弹出。
- JUMP_ABSOLUTE 38: 无条件跳转到字节码偏移为 38 的位置，即跳出循环。
- JUMP_ABSOLUTE 8: 无条件跳转到字节码偏移为 8 的位置，即循环的下一次迭代。

最后，字节码加载了一个常量字符串 'BREAK'，并通过 RETURN_VALUE 操作将其作为返回值返回。这段字节码实现了类似于之前的循环，但在满足条件时使用了 POP_TOP 和跳转指令来优化循环的执行。

从上面的分析过程可以看出来 break 的实现也是通过 JUMP_ABSOLUTE 来做到的，直接跳转到循环外部的下一行代码。

## 总结

在本本篇文章当中主要给大家分析了在python当中也循环有关的字节码，实现循环操作的主要是几个核心的字节码 FOR_ITER ，JUMP_ABSOLUTE，GET_ITER 等等。只要深入了解了这几个字节码的功能理解循环的过程就很简单了。

---

本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。

