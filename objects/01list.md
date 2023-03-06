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

将上面的结构体展开之后，PyListObject 的结构大致如下所示：

![](../images/01-list.png)

现在来解释一下上面的各个字段的含义：

- ob_refcnt，表示对象的引用记数的个数，这个对于垃圾回收很有用处，后面我们分析虚拟机中垃圾回收部分在深入分析。
- ob_type，表示这个对象的数据类型是什么，在 python 当中有时候需要对数据的数据类型进行判断比如 isinstance, type 这两个关键字就会使用到这个字段。
- ob_size，这个字段表示这个列表当中有多少个元素。
- ob_item，这是一个指针，指向真正保存 python 对象数据的地址，大致的内存他们之间大致的内存布局如下所示：

![](../images/02-list.png)

- allocated，这个表示在进行内存分配的时候，一共分配了多少个 (PyObject *) ，真实分配的内存空间为 `allocated * sizeof(PyObject *)`。

## 列表操作函数源代码分析

### 创建列表

首先需要了解的是在 python 虚拟机内部为列表创建了一个数组，所有的创建的被释放的内存空间，并不会直接进行释放而是会将这些内存空间的首地址保存到这个数组当中，好让下一次申请创建新的列表的时候不需要再申请内存空间，而是直接将之前需要释放的内存直接进行复用即可。

```c
/* Empty list reuse scheme to save calls to malloc and free */
#ifndef PyList_MAXFREELIST
#define PyList_MAXFREELIST 80
#endif
static PyListObject *free_list[PyList_MAXFREELIST];
static int numfree = 0;
```

- free_list，保存被释放的内存空间的首地址。
- numfree，目前 free_list 当中有多少个地址是可以被使用的，事实上是 free_list 前 numfree 个首地址是可以被使用的。

创建链表的代码如下所示（为了精简删除了一些代码只保留核心部分）：

```c
PyObject *
PyList_New(Py_ssize_t size)
{
    PyListObject *op;
    size_t nbytes;

    /* Check for overflow without an actual overflow,
     *  which can cause compiler to optimise out */
    if ((size_t)size > PY_SIZE_MAX / sizeof(PyObject *))
        return PyErr_NoMemory();
    nbytes = size * sizeof(PyObject *);
  // 如果 numfree 不等于 0 那么说明现在 free_list 有之前使用被释放的内存空间直接使用这部分即可
    if (numfree) {
        numfree--;
        op = free_list[numfree]; // 将对应的首地址返回
        _Py_NewReference((PyObject *)op); // 这条语句的含义是将 op 这个对象的 reference count 设置成 1
    } else {
      // 如果没有空闲的内存空间 那么就需要申请内存空间 这个函数也会对对象的 reference count 进行初始化 设置成 1
        op = PyObject_GC_New(PyListObject, &PyList_Type);
        if (op == NULL)
            return NULL;
    }
  /* 下面是申请列表对象当中的 ob_item 申请内存空间，上面只是给列表本身申请内存空间，但是列表当中有许多元素
  	保存这些元素也是需要内存空间的 下面便是给这些对象申请内存空间
  */
    if (size <= 0)
        op->ob_item = NULL;
    else {
        op->ob_item = (PyObject **) PyMem_MALLOC(nbytes);
      // 如果申请内存空间失败 则报错
        if (op->ob_item == NULL) {
            Py_DECREF(op);
            return PyErr_NoMemory();
        }
      // 对元素进行初始化操作 全部赋值成 0
        memset(op->ob_item, 0, nbytes);
    }
  // Py_SIZE 是一个宏
    Py_SIZE(op) = size; // 这条语句会被展开成 (PyVarObject*)(ob))->ob_size = size
  // 分配数组的元素个数是 size
    op->allocated = size;
  // 下面这条语句对于垃圾回收比较重要 主要作用就是将这个列表对象加入到垃圾回收的链表当中
  // 后面如果这个对象的 reference count 变成 0 或者其他情况 就可以进行垃圾回收了
    _PyObject_GC_TRACK(op);
    return (PyObject *) op;
}
```

在 cpython 当中，创建链表的字节码为 BUILD_LIST，我们可以在文件 ceval.c 当中找到对应的字节码对应的执行步骤：

```c
TARGET(BUILD_LIST) {
    PyObject *list =  PyList_New(oparg);
    if (list == NULL)
        goto error;
    while (--oparg >= 0) {
        PyObject *item = POP();
        PyList_SET_ITEM(list, oparg, item);
    }
    PUSH(list);
    DISPATCH();
}
```

从上面 BUILD_LIST 字节码对应的解释步骤可以知道，在解释执行字节码 BUILD_LIST 的时候确实调用了函数 PyList_New 创建一个新的列表。

### 列表 append 函数



```c
static PyObject *
// 这个函数的传入参数是列表本身 self 需要 append 的元素为 v
  // 也就是将对象 v 加入到列表 self 当中
listappend(PyListObject *self, PyObject *v)
{
    if (app1(self, v) == 0)
        Py_RETURN_NONE;
    return NULL;
}

static int
app1(PyListObject *self, PyObject *v)
{
  // PyList_GET_SIZE(self) 展开之后为 ((PyVarObject*)(self))->ob_size
    Py_ssize_t n = PyList_GET_SIZE(self);

    assert (v != NULL);
  // 如果元素的个数已经等于允许的最大的元素个数 就报错
    if (n == PY_SSIZE_T_MAX) {
        PyErr_SetString(PyExc_OverflowError,
            "cannot add more objects to list");
        return -1;
    }
	// 下面的函数 list_resize 会保存 ob_item 指向的位置能够容纳最少 n+1 个元素（PyObject *）
  // 如果容量不够就会进行扩容操作
    if (list_resize(self, n+1) == -1)
        return -1;
		
  // 将对象 v 的 reference count 加一 因为列表当中使用了一次这个对象 所以对象的引用计数需要进行加一操作
    Py_INCREF(v);
    PyList_SET_ITEM(self, n, v); // 宏展开之后 ((PyListObject *)(op))->ob_item[i] = v
    return 0;
}
```

### 列表的扩容机制

```c
static int
list_resize(PyListObject *self, Py_ssize_t newsize)
{
    PyObject **items;
    size_t new_allocated;
    Py_ssize_t allocated = self->allocated;

    /* Bypass realloc() when a previous overallocation is large enough
       to accommodate the newsize.  If the newsize falls lower than half
       the allocated size, then proceed with the realloc() to shrink the list.
    */
    if (allocated >= newsize && newsize >= (allocated >> 1)) {
        assert(self->ob_item != NULL || newsize == 0);
        Py_SIZE(self) = newsize;
        return 0;
    }

    /* This over-allocates proportional to the list size, making room
     * for additional growth.  The over-allocation is mild, but is
     * enough to give linear-time amortized behavior over a long
     * sequence of appends() in the presence of a poorly-performing
     * system realloc().
     * The growth pattern is:  0, 4, 8, 16, 25, 35, 46, 58, 72, 88, ...
     */
    new_allocated = (newsize >> 3) + (newsize < 9 ? 3 : 6);

    /* check for integer overflow */
    if (new_allocated > PY_SIZE_MAX - newsize) {
        PyErr_NoMemory();
        return -1;
    } else {
        new_allocated += newsize;
    }

    if (newsize == 0)
        new_allocated = 0;
    items = self->ob_item;
    if (new_allocated <= (PY_SIZE_MAX / sizeof(PyObject *)))
        PyMem_RESIZE(items, PyObject *, new_allocated);
    else
        items = NULL;
    if (items == NULL) {
        PyErr_NoMemory();
        return -1;
    }
    self->ob_item = items;
    Py_SIZE(self) = newsize;
    self->allocated = new_allocated;
    return 0;
}
```

上面的扩容机制大致如下所示：
$$
new\_size \approx size \cdot (size + 1)^{\frac{1}{8}}
$$
