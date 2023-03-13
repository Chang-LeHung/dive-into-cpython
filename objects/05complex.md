# 深入理解 Python 虚拟机：复数（complex）的实现原理及源码剖析

在本篇文章当中主要给大家介绍在 cpython 虚拟机当中是如何实现 复数 complex 这个数据类型的。

## 复数数据结构

```c
typedef struct {
    double real;
    double imag;
} Py_complex;
#define PyObject_HEAD                   PyObject ob_base;
typedef struct {
    PyObject_HEAD
    Py_complex cval;
} PyComplexObject;
typedef struct _object {
    _PyObject_HEAD_EXTRA
    Py_ssize_t ob_refcnt;
    struct _typeobject *ob_type;
} PyObject;
```

上面的数据结构图示如下：

![23-int](../images/23-int.png)