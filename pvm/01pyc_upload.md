# 深入理解 python 虚拟机：pyc 文件结构

在本篇文章当中主要给大姐介绍一下 .py 文件在被编译之后对应的 pyc 文件结构，pyc 文件当中的一个核心内容就是 python 字节码。

## pyc 文件

pyc 文件是 Python 在解释执行源代码时生成的一种字节码文件，它包含了源代码的编译结果和相关的元数据信息，以便于 Python 可以更快地加载和执行代码。

Python 是一种解释型语言，它不像编译型语言那样将源代码直接编译成机器码执行。Python 的解释器会在运行代码之前先将源代码编译成字节码，然后将字节码解释执行。.pyc 文件就是这个过程中生成的字节码文件。

当 Python 解释器首次执行一个 .py 文件时，它会在同一目录下生成一个对应的 .pyc 文件，以便于下次加载该文件时可以更快地执行。如果源文件在修改之后被重新加载，解释器会重新生成 .pyc 文件以更新缓存的字节码。

## 生成 pyc 文件

正常的 python 文件需要通过编译器变成字节码，然后将字节码交给 python 虚拟机，然后 python 虚拟机会执行字节码。整体流程如下所示：

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230328184219471-1209769963.png)

我们可以直接使用 compile all 模块生成对应文件的 pyc 文件。

```bash
➜  pvm ls
demo.py  hello.py
➜  pvm python -m compileall .
Listing '.'...
Listing './.idea'...
Listing './.idea/inspectionProfiles'...
Compiling './demo.py'...
Compiling './hello.py'...
➜  pvm ls
__pycache__ demo.py     hello.py
➜  pvm ls __pycache__ 
demo.cpython-310.pyc  hello.cpython-310.pyc
```

`python -m compileall .` 命令将递归扫描当前目录下面的 py 文件，并且生成对应文件的 pyc 文件。

## pyc 文件布局

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230328184219871-1081793408.png)

第一部分魔数由两部分组成：

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230328184220152-1179819134.png)

第一部分 魔术是由一个 2 字节的整数和另外两个字符回车换行组成的， "\r\n" 也占用两个字节，一共是四个字节。这个两个字节的整数在不同的 python 版本还不一样，比如说在 python3.5 当中这个值为 3351 等值，在 python3.9 当中这个值为 3420，3421，3422，3423，3424等值（在 python 3.9 的小版本）。

第二部分 Bit Field 这个字段的主要作用是为了将来能够实现复现编译结果，但是在 python3.9a2 时，这个字段的值还全部是 0 。详细内容可以参考 [PEP552-Deterministic pycs](https://peps.python.org/pep-0552/) 。这个字段在 python2 和 python3 早期版本并没有（python3.5 还没有），在 python3 的后期版本这个字段才出现的。

第三部分 就是整个 py  源文件的大小了。

第四部分 也是整个 pyc 文件当中最重要的一个部分，最后一个部分就是一个 CodeObject 对象序列化之后的数据，我们稍后再来仔细分析一下这个对象相关的数据。

我们现在来具体分析一个 pyc 文件，对应的 python 代码为：

```python
def f():
    x = 1
    return 2
```

pyc 文件的十六进制形式如下所示：

```bash
➜  __pycache__ hexdump -C hello.cpython-310.pyc
00000000  6f 0d 0d 0a 00 00 00 00  b9 48 21 64 20 00 00 00  |o........H!d ...|
00000010  e3 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
00000020  00 02 00 00 00 40 00 00  00 73 0c 00 00 00 64 00  |.....@...s....d.|
00000030  64 01 84 00 5a 00 64 02  53 00 29 03 63 00 00 00  |d...Z.d.S.).c...|
00000040  00 00 00 00 00 00 00 00  00 01 00 00 00 01 00 00  |................|
00000050  00 43 00 00 00 73 08 00  00 00 64 01 7d 00 64 02  |.C...s....d.}.d.|
00000060  53 00 29 03 4e e9 01 00  00 00 e9 02 00 00 00 a9  |S.).N...........|
00000070  00 29 01 da 01 78 72 03  00 00 00 72 03 00 00 00  |.)...xr....r....|
00000080  fa 0a 2e 2f 68 65 6c 6c  6f 2e 70 79 da 01 66 01  |.../hello.py..f.|
00000090  00 00 00 73 04 00 00 00  04 01 04 01 72 06 00 00  |...s........r...|
000000a0  00 4e 29 01 72 06 00 00  00 72 03 00 00 00 72 03  |.N).r....r....r.|
000000b0  00 00 00 72 03 00 00 00  72 05 00 00 00 da 08 3c  |...r....r......<|
000000c0  6d 6f 64 75 6c 65 3e 01  00 00 00 73 02 00 00 00  |module>....s....|
000000d0  0c 00                                             |..|
000000d2
```

因为数据使用小端表示方式，因此对于上面的数据来说：

- 第一部分魔数为：0xa0d0d6f 。
- 第二部分 Bit Field 为：0x0 。
- 第三部分最后一次修改日期为：0x642148b9 。
- 第四部分文件大小为：0x20 字节，也就是说 hello.py 这个文件的大小是 32 字节。

下面是一个小的代码片段用于读取 pyc 文件的头部元信息：

```python
import struct
import time
import binascii


fname = "./__pycache__/hello.cpython-310.pyc"
f = open(fname, "rb")
magic = struct.unpack('<l', f.read(4))[0]
bit_filed = f.read(4)
print(f"bit field = {binascii.hexlify(bit_filed)}")
moddate = f.read(4)
filesz = f.read(4)
modtime = time.asctime(time.localtime(struct.unpack('<l', moddate)[0]))
filesz = struct.unpack('<L', filesz)
print("magic %s" % (hex(magic)))
print("moddate (%s)" % (modtime))
print("File Size %d" % filesz)
f.close()
```

上面的代码输出结果如下所示：

```bash
bit field = b'00000000'
magic 0xa0d0d6f
moddate (Mon Mar 27 15:41:45 2023)
File Size 32
```

有关 pyc 文件的详细操作可以查看 python 标准库 importlib/_bootstrap_external.py 文件源代码。

## CodeObject

在 CPython 中，`CodeObject` 是一个对象，它包含了 Python 代码的字节码、常量、变量、位置参数、关键字参数等信息，以及一些用于运行代码的元数据，如文件名、代码行号等。

在 CPython 中，当我们执行一个 Python 模块或函数时，解释器会先将其代码编译为 `CodeObject`，然后再执行。在编译过程中，解释器会将 Python 代码转换为字节码，并将其保存在 `CodeObject` 对象中。此后，每当我们调用该模块或函数时，解释器都会使用 `CodeObject` 中的字节码来执行代码。

`CodeObject` 对象是不可变的，一旦创建就不能被修改。这是因为 Python 代码的字节码是不可变的，而 `CodeObject` 对象包含了这些字节码，所以也是不可变的。

在本篇文章当中主要介绍 code object 当中主要的内容，以及简单介绍他们的作用，在后续的文章当中会仔细分析 code object 对应的源代码以及对应的字段的详细作用。

现在举一个例子来分析一下 pycdemo.py 的 pyc 文件，pycdemo.py 的源程序如下所示：

```python


if __name__ == '__main__':
    a = 100
    print(a)
```

下面的代码是一个用于加载 pycdemo01.cpython-39.pyc 文件（也就是 hello.py 对应的 pyc 文件）的代码，使用 marshal 读取 pyc 文件里面的 code object 。

```python

import marshal
import dis
import struct
import time
import types
import binascii


def print_metadata(fp):
    magic = struct.unpack('<l', fp.read(4))[0]
    print(f"magic number = {hex(magic)}")
    bit_field = struct.unpack('<l', fp.read(4))[0]
    print(f"bit filed = {bit_field}")
    t = struct.unpack('<l', fp.read(4))[0]
    print(f"time = {time.asctime(time.localtime(t))}")
    file_size = struct.unpack('<l', fp.read(4))[0]
    print(f"file size = {file_size}")


def show_code(code, indent=''):
    print ("%scode" % indent)
    indent += '   '
    print ("%sargcount %d" % (indent, code.co_argcount))
    print ("%snlocals %d" % (indent, code.co_nlocals))
    print ("%sstacksize %d" % (indent, code.co_stacksize))
    print ("%sflags %04x" % (indent, code.co_flags))
    show_hex("code", code.co_code, indent=indent)
    dis.disassemble(code)
    print ("%sconsts" % indent)
    for const in code.co_consts:
        if type(const) == types.CodeType:
            show_code(const, indent+'   ')
        else:
            print("   %s%r" % (indent, const))
    print("%snames %r" % (indent, code.co_names))
    print("%svarnames %r" % (indent, code.co_varnames))
    print("%sfreevars %r" % (indent, code.co_freevars))
    print("%scellvars %r" % (indent, code.co_cellvars))
    print("%sfilename %r" % (indent, code.co_filename))
    print("%sname %r" % (indent, code.co_name))
    print("%sfirstlineno %d" % (indent, code.co_firstlineno))
    show_hex("lnotab", code.co_lnotab, indent=indent)


def show_hex(label, h, indent):
    h = binascii.hexlify(h)
    if len(h) < 60:
        print("%s%s %s" % (indent, label, h))
    else:
        print("%s%s" % (indent, label))
        for i in range(0, len(h), 60):
            print("%s   %s" % (indent, h[i:i+60]))


if __name__ == '__main__':
    filename = "./__pycache__/pycdemo01.cpython-39.pyc"
    with open(filename, "rb") as fp:
        print_metadata(fp)
        code_object = marshal.load(fp)
        show_code(code_object)
```

执行上面的程序输出结果如下所示：

```bash
magic number = 0xa0d0d61
bit filed = 0
time = Tue Mar 28 02:40:20 2023
file size = 54
code
   argcount 0
   nlocals 0
   stacksize 2
   flags 0040
   code b'650064006b02721464015a01650265018301010064025300'
  3           0 LOAD_NAME                0 (__name__)
              2 LOAD_CONST               0 ('__main__')
              4 COMPARE_OP               2 (==)
              6 POP_JUMP_IF_FALSE       20

  4           8 LOAD_CONST               1 (100)
             10 STORE_NAME               1 (a)

  5          12 LOAD_NAME                2 (print)
             14 LOAD_NAME                1 (a)
             16 CALL_FUNCTION            1
             18 POP_TOP
        >>   20 LOAD_CONST               2 (None)
             22 RETURN_VALUE
   consts
      '__main__'
      100
      None
   names ('__name__', 'a', 'print')
   varnames ()
   freevars ()
   cellvars ()
   filename './pycdemo01.py'
   name '<module>'
   firstlineno 3
   lnotab b'08010401'
```

下面是 code object 当中各个字段的作用：

- 首先需要了解一下代码块这个概念，所谓代码块就是一个小的 python 代码，被当做一个小的单元整体执行。在 python 当中常见的代码块块有：函数体、类的定义、一个模块。

- argcount，这个表示一个代码块的参数个数，这个参数只对函数体代码块有用，因为函数可能会有参数，比如上面的 pycdemo.py 是一个模块而不是一个函数，因此这个参数对应的值为 0 。
- co_code，这个对象的具体内容就是一个字节序列，存储真实的 python 字节码，主要是用于 python 虚拟机执行的，在本篇文章当中暂时不详细分析。
- co_consts，这个字段是一个列表类型的字段，主要是包含一些字符串常量和数值常量，比如上面的 "\_\_main\_\_" 和 100 。
- co_filename，这个字段的含义就是对应的源文件的文件名。
- co_firstlineno，这个字段的含义为在 python 源文件当中第一行代码出现的行数，这个字段在进行调试的时候非常重要。
- co_flags，这个字段的主要含义就是标识这个 code object 的类型。0x0080 表示这个 block 是一个协程，0x0010 表示这个 code object 是嵌套的等等。

- co_lnotab，这个字段的含义主要是用于计算每个字节码指令对应的源代码行数。
- co_varnames，这个字段的主要含义是表示在一个 code object 本地定义的一个名字。
- co_names，和 co_varnames 相反，表示非本地定义但是在 code object 当中使用的名字。

- co_nlocals，这个字段表示在一个 code object 当中本地使用的变量个数。
- co_stackszie，因为 python 虚拟机是一个栈式计算机，这个参数的值表示这个栈需要的最大的值。
- co_cellvars，co_freevars，这两个字段主要和嵌套函数和函数闭包有关，我们在后续的文章当中将详细解释这个字段。

## 总结

在本篇文章当中主要给大家介绍了 python 文件被编译之后的结果文件 .pyc 文件结构，在 pyc 文件当中一个最重要的结构就是 code object 对象，在本篇文章当中主要是简单介绍了 code object 各个字段的作用。在后续的文章当中将会举详细的例子进行说明，正确理解这些这些字段的含义，对于我们理解 python 虚拟机大有裨益。

---

本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。

