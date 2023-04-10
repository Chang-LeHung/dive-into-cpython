# 深入理解 python 虚拟机：字节码教程(2)——控制流是如何实现的？

在本篇文章当中主要给大家分析 python 当中与控制流有关的字节码，通过对这部分字节码的了解，我们可以更加深入了解 python 字节码的执行过程和控制流实现原理。

## 控制流实现

控制流这部分代码主要涉及下面几条字节码指令，下面的所有字节码指令都会有一个参数：

- **JUMP_FORWARD**，指令完整条指令会将当前执行字节码指令的位置加上这个参数，然后跳到对应的结果继续执行。
- **POP_JUMP_IF_TRUE**，如果栈顶元素等于 true，将字节码的执行位置改成参数的值。将栈顶元素弹出。
- **POP_JUMP_IF_FALSE**，这条指令和 **POP_JUMP_IF_TRUE** 一样，唯一差别就是判断栈顶元素是否等于 true。 
- **JUMP_IF_TRUE_OR_POP**，如果栈顶元素等于等于 true 则将字节码执行位置设置成参数对应的值，并且不需要将栈顶元素弹出。但是如果栈顶元素是 false 的话那么就需要将栈顶元素弹出。
- **JUMP_IF_FALSE_OR_POP**，和**JUMP_IF_TRUE_OR_POP**一样只不过需要栈顶元素等于 false 。
- **JUMP_ABSOLUTE**，直接将字节码的执行位置设置成参数的值。

总的来说，这些跳转指令可以让 Python 的解释器在执行字节码时根据特定条件来改变执行流程，实现循环、条件语句等基本语言结构。

现在我们使用一个例子来深入理解上面的各种指令的执行过程。

```python

import dis


def test_control01():
    a = 1

    if a > 1:
        print("a > 1")
    elif a < 1:
        print("a < 1")
    else:
        print("a == 1")

if __name__ == '__main__':
    dis.dis(test_control01)
```

上面的程序输出结果如下所示：

```bash
  6           0 LOAD_CONST               1 (1)
              2 STORE_FAST               0 (a)

  8           4 LOAD_FAST                0 (a)
              6 LOAD_CONST               1 (1)
              8 COMPARE_OP               4 (>)
             10 POP_JUMP_IF_FALSE       22

  9          12 LOAD_GLOBAL              0 (print)
             14 LOAD_CONST               2 ('a > 1')
             16 CALL_FUNCTION            1
             18 POP_TOP
             20 JUMP_FORWARD            26 (to 48)

 10     >>   22 LOAD_FAST                0 (a)
             24 LOAD_CONST               1 (1)
             26 COMPARE_OP               0 (<)
             28 POP_JUMP_IF_FALSE       40

 11          30 LOAD_GLOBAL              0 (print)
             32 LOAD_CONST               3 ('a < 1')
             34 CALL_FUNCTION            1
             36 POP_TOP
             38 JUMP_FORWARD             8 (to 48)

 13     >>   40 LOAD_GLOBAL              0 (print)
             42 LOAD_CONST               4 ('a == 1')
             44 CALL_FUNCTION            1
             46 POP_TOP
        >>   48 LOAD_CONST               0 (None)
             50 RETURN_VALUE
```

我们现在来模拟一下上面的字节码执行过程，我们使用 counter 表示当前字节码的执行位置：

在字节码还没开始执行之前，栈空间和 counter 的状态如下：

![56-bytecode](../images/56-bytecode.png)

现在执行第一条字节码 LOAD_CONST，执行完之后 counter = 2，因为这条字节码占一个字节，参数栈一个字节，因此下次执行的字节码的位置在 bytecode 的低三个位置，对应的下标为 2，因此 counter = 2 。

![56-bytecode](../images/57-bytecode.png)