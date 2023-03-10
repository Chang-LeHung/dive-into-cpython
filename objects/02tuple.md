# 深入理解 Python 虚拟机：元组（tuple）的实现原理及源码剖析

在本篇文章当中主要给大家介绍 cpython 虚拟机当中针对列表的实现，在 Python 中，tuple 是一种非常常用的数据类型，在本篇文章当中将深入去分析这一点是如何实现的。

## 元组的结构

在这一小节当中主要介绍在 python 当中元组的数据结构：
```c
typedef struct {
    PyObject_VAR_HEAD
    PyObject *ob_item[1];

    /* ob_item contains space for 'ob_size' elements.
     * Items must normally not be NULL, except during construction when
     * the tuple is not yet visible outside the function that builds it.
     */
} PyTupleObject;

#define PyObject_VAR_HEAD      PyVarObject ob_base;
typedef struct {
    PyObject ob_base;
    Py_ssize_t ob_size; /* Number of items in variable part */
} PyVarObject;

typedef struct _object {
    _PyObject_HEAD_EXTRA
    Py_ssize_t ob_refcnt;
    struct _typeobject *ob_type;
} PyObject;
```

从上面的数据结构来看和 list 的数据结构基本上差不多，最终的使用方法也差不多。将上面的结构体展开之后，PyTupleObject 的结构大致如下所示：

![](../images/09-tuple.png)

现在来解释一下上面的各个字段的含义：

- Py_ssize_t，一个整型数据类型。

- ob_refcnt，表示对象的引用记数的个数，这个对于垃圾回收很有用处，后面我们分析虚拟机中垃圾回收部分在深入分析。
- ob_type，表示这个对象的数据类型是什么，在 python 当中有时候需要对数据的数据类型进行判断比如 isinstance, type 这两个关键字就会使用到这个字段。
- ob_size，这个字段表示这个元组当中有多少个元素。
- ob_item，这是一个指针，指向真正保存 python 对象数据的地址，大致的内存他们之间大致的内存布局如下所示：

![](../images/10-tuple.png)

需要注意的是元组的数组大小是不能够进行更改的，这一点和 list 不一样，我们可以注意到在 list 的数据结构当中还有一个 allocated 字段，但是在元组当中是没有的，这主要是因为元组的数组大小是固定的，而列表的数组大小是可以更改的。

