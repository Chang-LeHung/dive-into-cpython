# 深入理解 Python 虚拟机：集合（set）的实现原理及源码剖析

在本篇文章当中主要给大家介绍在 cpython 虚拟机当中的集合 set 的实现原理以及对应的源代码分析。

## 数据结构介绍

```c
typedef struct {
    PyObject_HEAD

    Py_ssize_t fill;            /* Number active and dummy entries*/
    Py_ssize_t used;            /* Number active entries */

    /* The table contains mask + 1 slots, and that's a power of 2.
     * We store the mask instead of the size because the mask is more
     * frequently needed.
     */
    Py_ssize_t mask;

    /* The table points to a fixed-size smalltable for small tables
     * or to additional malloc'ed memory for bigger tables.
     * The table pointer is never NULL which saves us from repeated
     * runtime null-tests.
     */
    setentry *table;
    Py_hash_t hash;             /* Only used by frozenset objects */
    Py_ssize_t finger;          /* Search finger for pop() */

    setentry smalltable[PySet_MINSIZE];
    PyObject *weakreflist;      /* List of weak references */
} PySetObject;

typedef struct {
    PyObject *key;
    Py_hash_t hash;             /* Cached hash code of the key */
} setentry;

static PyObject _dummy_struct;

#define dummy (&_dummy_struct)
```

上面的数据结果用图示如下图所示：

![25-set](../images/25-set.png)

上面各个字段的含义如下所示：

- 

## 创建集合对象

首先先了解一下创建一个集合对象的过程，和前面其他的对象是一样的，首先先申请内存空间，然后进行相关的初始化操作。

这个函数有两个参数，使用第一个参数申请内存空间，然后后面一个参数如果不为 NULL 而且是一个可迭代对象的话，就将这里面的对象加入到集合当中。

```c
static PyObject *
make_new_set(PyTypeObject *type, PyObject *iterable)
{
    PySetObject *so = NULL;

    /* create PySetObject structure */
    so = (PySetObject *)type->tp_alloc(type, 0);
    if (so == NULL)
        return NULL;
    // 集合当中目前没有任何对象，因此 fill 和 used 都是 0
    so->fill = 0;
    so->used = 0;
    // 初始化哈希表当中的数组长度为 PySet_MINSIZE 因此 mask = PySet_MINSIZE - 1
    so->mask = PySet_MINSIZE - 1;
    // 让 table 指向存储 entry 的数组
    so->table = so->smalltable;
    // 将哈希值设置成 -1 表示还没有进行计算
    so->hash = -1;
    so->finger = 0;
    so->weakreflist = NULL;
    // 如果 iterable 不等于 NULL 则需要将它指向的对象当中所有的元素加入到集合当中
    if (iterable != NULL) {
        // 调用函数 set_update_internal 将对象 iterable 当中的元素加入到集合当中
        if (set_update_internal(so, iterable)) {
            Py_DECREF(so);
            return NULL;
        }
    }

    return (PyObject *)so;
}
```

