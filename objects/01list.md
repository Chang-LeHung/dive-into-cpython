# 深入理解 Python 虚拟机：列表（list）的实现原理及源码剖析

在本篇文章当中主要给大家介绍 cpython 虚拟机当中针对列表的实现，在 Python 中，List 是一种非常常用的数据类型，可以存储任何类型的数据，并且支持各种操作，如添加、删除、查找、切片等，在本篇文章当中将深入去分析这一点是如何实现的。

## 列表的结构

在 cpython 实现的 python 虚拟机当中，下面就是 cpython 内部列表实现的源代码：

```c
typedef struct {
    PyObject_VAR_HEAD
    /* Vector of pointers to list elements.  list[0] is ob_item[0], etc. */
    PyObject **ob_item;

    /* ob_item contains space for 'allocated' elements.  The number
     * currently in use is ob_size.
     * Invariants:
     *     0 <= ob_size <= allocated
     *     len(list) == ob_size
     *     ob_item == NULL implies ob_size == allocated == 0
     * list.sort() temporarily sets allocated to -1 to detect mutations.
     *
     * Items must normally not be NULL, except during construction when
     * the list is not yet visible outside the function that builds it.
     */
    Py_ssize_t allocated;
} PyListObject;

#define PyObject_VAR_HEAD      PyVarObject ob_base;
typedef struct {
    PyObject ob_base;
    Py_ssize_t ob_size; /* Number of items in variable part */
} PyVarObject;

typedef struct _object {
    _PyObject_HEAD_EXTRA // 这个宏定义为空
    Py_ssize_t ob_refcnt;
    struct _typeobject *ob_type;
} PyObject;

```

