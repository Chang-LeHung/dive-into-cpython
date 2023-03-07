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

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230308021441928-1342159016.png)

现在来解释一下上面的各个字段的含义：

- Py_ssize_t，一个整型数据类型。

- ob_refcnt，表示对象的引用记数的个数，这个对于垃圾回收很有用处，后面我们分析虚拟机中垃圾回收部分在深入分析。
- ob_type，表示这个对象的数据类型是什么，在 python 当中有时候需要对数据的数据类型进行判断比如 isinstance, type 这两个关键字就会使用到这个字段。
- ob_size，这个字段表示这个列表当中有多少个元素。
- ob_item，这是一个指针，指向真正保存 python 对象数据的地址，大致的内存他们之间大致的内存布局如下所示：

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230308021442302-2082688979.png)

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
  // 如果列表已经分配的元素个数大于需求个数 newsize 的就直接返回不需要进行扩容
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
  // 这是核心的数组大小扩容机制 new_allocated 表示新增的数组大小
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
      	// PyMem_RESIZE 这是一个宏定义 会申请 new_allocated 个数元素并且将原来数组的元素拷贝到新的数组当中
        PyMem_RESIZE(items, PyObject *, new_allocated);
    else
        items = NULL;
  // 如果没有申请到内存 那么报错
    if (items == NULL) {
        PyErr_NoMemory();
        return -1;
    }
  // 更新列表当中的元素数据
    self->ob_item = items;
    Py_SIZE(self) = newsize;
    self->allocated = new_allocated;
    return 0;
}
```

在上面的扩容机制下，数组的大小变化大致如下所示：
$$
newsize \approx size \cdot (size + 1)^{\frac{1}{8}}
$$
![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230308021442813-1571648088.png)

### 列表的插入函数 insert

在列表当中插入一个数据比较简单，只需要将插入位置和其后面的元素往后移动一个位置即可，整个过程如下所示：

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230308021443161-80165674.png)

在 cpython 当中列表的插入函数的实现如下所示：

- 参数 op 表示往哪个链表当中插入元素。
- 参数 where 表示在链表的哪个位置插入元素。
- 参数 newitem 表示新插入的元素。

```c
int
PyList_Insert(PyObject *op, Py_ssize_t where, PyObject *newitem)
{
  // 检查是否是列表类型
    if (!PyList_Check(op)) {
        PyErr_BadInternalCall();
        return -1;
    }
  // 如果是列表类型则进行插入操作
    return ins1((PyListObject *)op, where, newitem);
}

static int
ins1(PyListObject *self, Py_ssize_t where, PyObject *v)
{
    Py_ssize_t i, n = Py_SIZE(self);
    PyObject **items;
    if (v == NULL) {
        PyErr_BadInternalCall();
        return -1;
    }
  // 如果列表的元素个数超过限制 则进行报错
    if (n == PY_SSIZE_T_MAX) {
        PyErr_SetString(PyExc_OverflowError,
            "cannot add more objects to list");
        return -1;
    }
  // 确保列表能够容纳 n + 1 个元素
    if (list_resize(self, n+1) == -1)
        return -1;
  // 这里是 python 的一个小 trick 就是下标能够有负数的原理
    if (where < 0) {
        where += n;
        if (where < 0)
            where = 0;
    }
    if (where > n)
        where = n;
    items = self->ob_item;
  // 从后往前进行元素的拷贝操作，也就是将插入位置及其之后的元素往后移动一个位置
    for (i = n; --i >= where; )
        items[i+1] = items[i];
  // 因为链表应用的对象，因此对象的 reference count 需要进行加一操作
    Py_INCREF(v);
  // 在列表当中保存对象 v 
    items[where] = v;
    return 0;
}
```

### 列表的删除函数 remove

对于数组 ob_item 来说，删除一个元素就需要将这个元素后面的元素往前移动，因此整个过程如下所示：

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230308021443516-812866335.png)

```c
static PyObject *
listremove(PyListObject *self, PyObject *v)
{
    Py_ssize_t i;
  	// 编译数组 ob_item 查找和对象 v 相等的元素并且将其删除
    for (i = 0; i < Py_SIZE(self); i++) {
        int cmp = PyObject_RichCompareBool(self->ob_item[i], v, Py_EQ);
        if (cmp > 0) {
            if (list_ass_slice(self, i, i+1,
                               (PyObject *)NULL) == 0)
                Py_RETURN_NONE;
            return NULL;
        }
        else if (cmp < 0)
            return NULL;
    }
  	// 如果没有找到这个元素就进行报错处理 在下面有一个例子重新编译 python 解释器 将这个错误内容修改的例子
    PyErr_SetString(PyExc_ValueError, "list.remove(x): x not in list");
    return NULL;
}
```

执行的 python 程序内容为：

```python
data = []
data.remove(1)
```

下面是整个修改内容和报错结果：

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230308021443877-1597833859.png)

从上面的结果我们可以看到的是，我们修改的错误信息正确打印了出来。

### 列表的统计函数 count

这个函数的主要作用就是统计列表 self 当中有多少个元素和 v 相等。

```c
static PyObject *
listcount(PyListObject *self, PyObject *v)
{
    Py_ssize_t count = 0;
    Py_ssize_t i;

    for (i = 0; i < Py_SIZE(self); i++) {
        int cmp = PyObject_RichCompareBool(self->ob_item[i], v, Py_EQ);
      // 如果相等则将 count 进行加一操作
        if (cmp > 0)
            count++;
      // 如果出现错误就返回 NULL
        else if (cmp < 0)
            return NULL;
    }
  // 将一个 Py_ssize_t 的变量变成 python 当中的对象
    return PyLong_FromSsize_t(count);
}

```

### 列表的拷贝函数 copy

这是列表的浅拷贝函数，它只拷贝了真实 python 对象的指针，并没有拷贝真实的 python 对象 ，从下面的代码可以知道列表的拷贝是浅拷贝，当 b 对列表当中的元素进行修改时，列表 a 当中的元素也改变了。如果需要进行深拷贝可以使用 copy 模块当中的 deepcopy 函数。

```python
>>> a = [1, 2, [3, 4]]
>>> b = a.copy()
>>> b[2][1] = 5
>>> b
[1, 2, [3, 5]]
```

copy 函数对应的源代码（listcopy）如下所示：

```c
static PyObject *
listcopy(PyListObject *self)
{
    return list_slice(self, 0, Py_SIZE(self));
}

static PyObject *
list_slice(PyListObject *a, Py_ssize_t ilow, Py_ssize_t ihigh)
{
  // Py_SIZE(a) 返回列表 a 当中元素的个数（注意不是数组的长度 allocated）
    PyListObject *np;
    PyObject **src, **dest;
    Py_ssize_t i, len;
    if (ilow < 0)
        ilow = 0;
    else if (ilow > Py_SIZE(a))
        ilow = Py_SIZE(a);
    if (ihigh < ilow)
        ihigh = ilow;
    else if (ihigh > Py_SIZE(a))
        ihigh = Py_SIZE(a);
    len = ihigh - ilow;
    np = (PyListObject *) PyList_New(len);
    if (np == NULL)
        return NULL;

    src = a->ob_item + ilow;
    dest = np->ob_item;
  // 可以看到这里循环拷贝的是指向真实 python 对象的指针 并不是真实的对象
    for (i = 0; i < len; i++) {
        PyObject *v = src[i];
      // 同样的因为并没有创建新的对象，但是这个对象被新的列表使用到啦 因此他的 reference count 需要进行加一操作 Py_INCREF(v) 的作用：将对象 v 的 reference count 加一
        Py_INCREF(v);
        dest[i] = v;
    }
    return (PyObject *)np;
}
```

下图就是使用 a.copy() 浅拷贝的时候，内存的布局的示意图，可以看到列表指向的对象数组发生了变化，但是数组中元素指向的 python 对象并没有发生变化。

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230308021444435-839793409.png)

下面是对列表对象进行深拷贝的时候内存的大致示意图，可以看到数组指向的 python 对象也是不一样的。

![](https://img2023.cnblogs.com/blog/2519003/202303/2519003-20230308021444807-2140011460.png)

### 列表的清空函数 clear

当我们在使用 list.clear() 的时候会调用下面这个函数。清空列表需要注意的就是将表示列表当中元素个数的 ob_size 字段设置成 0 ，同时将列表当中所有的对象的 reference count 设置进行 -1 操作，这个操作是通过宏 Py_XDECREF 实现的，这个宏还会做另外一件事就是如果这个对象的引用计数变成 0 了，那么就会直接释放他的内存。

```c
static PyObject *
listclear(PyListObject *self)
{
    list_clear(self);
    Py_RETURN_NONE;
}

static int
list_clear(PyListObject *a)
{
    Py_ssize_t i;
    PyObject **item = a->ob_item;
    if (item != NULL) {
        /* Because XDECREF can recursively invoke operations on
           this list, we make it empty first. */
        i = Py_SIZE(a);
        Py_SIZE(a) = 0;
        a->ob_item = NULL;
        a->allocated = 0;
        while (--i >= 0) {
            Py_XDECREF(item[i]);
        }
        PyMem_FREE(item);
    }
    /* Never fails; the return value can be ignored.
       Note that there is no guarantee that the list is actually empty
       at this point, because XDECREF may have populated it again! */
    return 0;
}
```

### 列表反转函数 reverse

在 python 当中如果我们想要反转类表当中的内容的话，就会使用这个函数 reverse 。

```python
>>> a = [i for i in range(10)]
>>> a.reverse()
>>> a
[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
```

其对应的源程序如下所示：

```c
static PyObject *
listreverse(PyListObject *self)
{
    if (Py_SIZE(self) > 1)
        reverse_slice(self->ob_item, self->ob_item + Py_SIZE(self));
    Py_RETURN_NONE;
}

static void
reverse_slice(PyObject **lo, PyObject **hi)
{
    assert(lo && hi);

    --hi;
    while (lo < hi) {
        PyObject *t = *lo;
        *lo = *hi;
        *hi = t;
        ++lo;
        --hi;
    }
}
```

上面的源程序还是比较容易理解的，给 reverse_slice 传递的参数就是保存数据的数组的首尾地址，然后不断的将首尾数据进行交换（其实是交换指针指向的地址）。

## 总结

本文介绍了 Python 中列表对象的实现细节，介绍了一些常用函数的实现，包括列表的扩容机制，插入、删除、统计、拷贝、清空和反转等操作的实现方式。

- 列表的扩容机制采用了一种线性时间摊销的方式，使得列表的插入操作具有较好的时间复杂度。
- 列表的插入、删除和统计操作都是通过操作ob_item 数组实现的，其中插入和删除操作需要移动数组中的元素。
- 列表的拷贝操作是浅拷贝，需要注意的是进行深拷贝需要使用 copy 模块当中的 deepcopy 函数。
- 列表清空会将 ob_size 字段设置成 0，同时需要将列表当中的所有对象的 reference count 进行 -1 操作，从而避免内存泄漏。
- 列表的反转操作可以通过交换 ob_item 数组中前后元素的位置实现。

总之，了解 Python 列表对象的实现细节有助于我们更好地理解 Python 的内部机制，从而编写更高效、更可靠的 Python 代码。

---

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。
