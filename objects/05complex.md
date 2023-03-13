# 深入理解 Python 虚拟机：复数（complex）的实现原理及源码剖析

在本篇文章当中主要给大家介绍在 cpython 虚拟机当中是如何实现 复数 complex 这个数据类型的，这个数据类型在 cpython 当中一应该是一个算比较简单的数据类型了，非常容易理解。

## 复数数据结构

在 cpython 当中对于复数的数据结构实现如下所示：

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

复数的数据在整个 cpython 虚拟机当中来说应该算是比较简单的了，除了一个 PyObject 头部之外就是实部和虚部了。

- ob_refcnt，表示对象的引用记数的个数，这个对于垃圾回收很有用处，后面我们分析虚拟机中垃圾回收部分在深入分析。
- ob_type，表示这个对象的数据类型是什么，在 python 当中有时候需要对数据的数据类型进行判断比如 isinstance, type 这两个关键字就会使用到这个字段。

- real，表示复数的实部。
- imag，表示复数的虚部。

## 复数的操作

### 复数加法

下面是 cpython 当中对于复数加法的实现，为了简洁删除了部分无用代码。

```c
static PyObject *
complex_add(PyObject *v, PyObject *w)
{
    Py_complex result;
    Py_complex a, b;
    TO_COMPLEX(v, a); // TO_COMPLEX 这个宏的作用就是将一个 PyComplexObject 中的 Py_complex 对象存储到 a 当中
    TO_COMPLEX(w, b);
    result = _Py_c_sum(a, b); // 这个函数的具体实现在下方
    return PyComplex_FromCComplex(result); // 这个函数的具体实现在下方
}

// 真正实现复数加法的函数
Py_complex
_Py_c_sum(Py_complex a, Py_complex b)
{
    Py_complex r;
    r.real = a.real + b.real;
    r.imag = a.imag + b.imag;
    return r;
}

PyObject *
PyComplex_FromCComplex(Py_complex cval)
{
    PyComplexObject *op;

    /* Inline PyObject_New */
    // 申请内存空间
    op = (PyComplexObject *) PyObject_MALLOC(sizeof(PyComplexObject));
    if (op == NULL)
        return PyErr_NoMemory();
    // 将这个对象的引用计数设置成 1
    (void)PyObject_INIT(op, &PyComplex_Type);
    // 将复数结构体保存下来
    op->cval = cval;
    return (PyObject *) op;
}
```

上面代码的整体过程比较简单：

- 首先先从 PyComplexObject 提取真正的复数部分。
- 将提取到的两个复数进行相加操作。
- 根据得到的结果在创建一个 PyComplexObject 对象，并且将这个对象返回。

