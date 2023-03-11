# 深入理解 Python 虚拟机：浮点数（float）的实现原理及源码剖析

在本篇文章当中主要分析在 cpython 虚拟机当中 float 类型的实现原理以及与他相关的一些源代码。

## Float 数据结构

在 cpython 虚拟机当中浮点数类型的数据结构定义如下所示：

```c
typedef struct {
    PyObject_HEAD
    double ob_fval;
} PyFloatObject;
```

上面的数据结构定义图示如下：

![](../images/12-tuple.png)

- 在上面的数据结构当中最重要的一个字段就是 ob_fval，这个就是真实存储浮点数的地方。
- ob_refcnt 就是对象的引用计数。
- ob_type 就是对象的类型。

