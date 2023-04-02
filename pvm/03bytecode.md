# 深入理解 python 虚拟机：字节码设计

在本篇文章当中主要给大家介绍 cpython 虚拟机对于字节码的设计以及在调试过程当中一个比较重要的字段 co_lnotab 的设计原理！

## python 字节码设计

一条 python 字节码主要有两部分组成，一部分是操作码，一部分是这个操作码的参数，在 cpython 当中只有部分字节码有参数，如果对应的字节码没有参数，那么 oparg 的值就等于 0 ，在 cpython 当中 opcode < 90 的指令是没有参数的。

![45-bytecode](../images/45-bytecode.png)

opcode 和 oparg 各占一个字节，cpython 虚拟机使用小端方式保存字节码。

我们使用下面的代码片段先了解一下字节码的设计：

```python
import dis


def add(a, b):
    return a + b


if __name__ == '__main__':
    print(add.__code__.co_code)
    print("bytecode: ", list(bytearray(add.__code__.co_code)))
    dis.dis(add)
```

上面的代码在 python3.9 的输出如下所示：

```bash
b'|\x00|\x01\x17\x00S\x00'
bytecode:  [124, 0, 124, 1, 23, 0, 83, 0]
  5           0 LOAD_FAST                0 (a)
              2 LOAD_FAST                1 (b)
              4 BINARY_ADD
              6 RETURN_VALUE
```

首先 需要了解的是 add.\_\_code\_\_.co\_code 是函数 add 的字节码，是一个字节序列，`list(bytearray(add.__code__.co_code))` 是将和这个序列一个字节一个字节进行分开，并且将其变成 10 进制形式。根据前面我们谈到的每一条指令——字节码占用 2 个字节，因此上面的字节码有四条指令：
![45-bytecode](../images/46-bytecode.png)

操作码和对应的操作指令在文末有详细的对应表。在上面的代码当中主要使用到了三个字节码指令分别是 124，23 和 83 ，他们对应的操作指令分别为 LOAD_FAST，BINARY_ADD，RETURN_VALUE。他们的含义如下：

- LOAD_FAST：将对本地 co-varnames[var_num] 压入栈顶。
- BINARY_ADD：从栈中弹出两个对象并且将它们相加的结果压入栈顶。
- RETURN_VALUE：弹出栈顶的元素，将其作为函数的返回值。

首先我们需要知道的是 BINARY_ADD 和 RETURN_VALUE，这两个操作指令是没有参数的，因此在这两个操作码之后的参数都是 0 。

但是 LOAD_FAST 是有参数的，在上面我们已经知道 LOAD_FAST 是将 co-varnames[var_num] 压入栈，var_num 就是指令 LOAD_FAST 的参数。在上面的代码当中一共有两条 LOAD_FAST 指令，分别是将 a 和 b 压入到栈中，他们在 varnames 当中的下标分别是 0 和 1，因此他们呢的操作数就是 0 和 1 。



## python 字节码表

|操作|操作码|
|---|---|
|POP_TOP|1|
|ROT_TWO|2|
|ROT_THREE|3|
|DUP_TOP|4|
|DUP_TOP_TWO|5|
|ROT_FOUR|6|
|NOP|9|
|UNARY_POSITIVE|10|
|UNARY_NEGATIVE|11|
|UNARY_NOT|12|
|UNARY_INVERT|15|
|BINARY_MATRIX_MULTIPLY|16|
|INPLACE_MATRIX_MULTIPLY|17|
|BINARY_POWER|19|
|BINARY_MULTIPLY|20|
|BINARY_MODULO|22|
|BINARY_ADD|23|
|BINARY_SUBTRACT|24|
|BINARY_SUBSCR|25|
|BINARY_FLOOR_DIVIDE|26|
|BINARY_TRUE_DIVIDE|27|
|INPLACE_FLOOR_DIVIDE|28|
|INPLACE_TRUE_DIVIDE|29|
|RERAISE|48|
|WITH_EXCEPT_START|49|
|GET_AITER|50|
|GET_ANEXT|51|
|BEFORE_ASYNC_WITH|52|
|END_ASYNC_FOR|54|
|INPLACE_ADD|55|
|INPLACE_SUBTRACT|56|
|INPLACE_MULTIPLY|57|
|INPLACE_MODULO|59|
|STORE_SUBSCR|60|
|DELETE_SUBSCR|61|
|BINARY_LSHIFT|62|
|BINARY_RSHIFT|63|
|BINARY_AND|64|
|BINARY_XOR|65|
|BINARY_OR|66|
|INPLACE_POWER|67|
|GET_ITER|68|
|GET_YIELD_FROM_ITER|69|
|PRINT_EXPR|70|
|LOAD_BUILD_CLASS|71|
|YIELD_FROM|72|
|GET_AWAITABLE|73|
|LOAD_ASSERTION_ERROR|74|
|INPLACE_LSHIFT|75|
|INPLACE_RSHIFT|76|
|INPLACE_AND|77|
|INPLACE_XOR|78|
|INPLACE_OR|79|
|LIST_TO_TUPLE|82|
|RETURN_VALUE|83|
|IMPORT_STAR|84|
|SETUP_ANNOTATIONS|85|
|YIELD_VALUE|86|
|POP_BLOCK|87|
|POP_EXCEPT|89|
|STORE_NAME|90|
|DELETE_NAME|91|
|UNPACK_SEQUENCE|92|
|FOR_ITER|93|
|UNPACK_EX|94|
|STORE_ATTR|95|
|DELETE_ATTR|96|
|STORE_GLOBAL|97|
|DELETE_GLOBAL|98|
|LOAD_CONST|100|
|LOAD_NAME|101|
|BUILD_TUPLE|102|
|BUILD_LIST|103|
|BUILD_SET|104|
|BUILD_MAP|105|
|LOAD_ATTR|106|
|COMPARE_OP|107|
|IMPORT_NAME|108|
|IMPORT_FROM|109|
|JUMP_FORWARD|110|
|JUMP_IF_FALSE_OR_POP|111|
|JUMP_IF_TRUE_OR_POP|112|
|JUMP_ABSOLUTE|113|
|POP_JUMP_IF_FALSE|114|
|POP_JUMP_IF_TRUE|115|
|LOAD_GLOBAL|116|
|IS_OP|117|
|CONTAINS_OP|118|
|JUMP_IF_NOT_EXC_MATCH|121|
|SETUP_FINALLY|122|
|LOAD_FAST|124|
|STORE_FAST|125|
|DELETE_FAST|126|
|RAISE_VARARGS|130|
|CALL_FUNCTION|131|
|MAKE_FUNCTION|132|
|BUILD_SLICE|133|
|LOAD_CLOSURE|135|
|LOAD_DEREF|136|
|STORE_DEREF|137|
|DELETE_DEREF|138|
|CALL_FUNCTION_KW|141|
|CALL_FUNCTION_EX|142|
|SETUP_WITH|143|
|LIST_APPEND|145|
|SET_ADD|146|
|MAP_ADD|147|
|LOAD_CLASSDEREF|148|
|EXTENDED_ARG|144|
|SETUP_ASYNC_WITH|154|
|FORMAT_VALUE|155|
|BUILD_CONST_KEY_MAP|156|
|BUILD_STRING|157|
|LOAD_METHOD|160|
|CALL_METHOD|161|
|LIST_EXTEND|162|
|SET_UPDATE|163|
|DICT_MERGE|164|
|DICT_UPDATE|165|
