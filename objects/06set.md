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
```

上面的数据结果用图示如下图所示：

![25-set](../images/25-set.png)

## 创建集合对象

```c
static PyObject *
make_new_set(PyTypeObject *type, PyObject *iterable)
{
    PySetObject *so = NULL;

    /* create PySetObject structure */
    so = (PySetObject *)type->tp_alloc(type, 0);
    if (so == NULL)
        return NULL;

    so->fill = 0;
    so->used = 0;
    so->mask = PySet_MINSIZE - 1;
    so->table = so->smalltable;
    so->hash = -1;
    so->finger = 0;
    so->weakreflist = NULL;

    if (iterable != NULL) {
        if (set_update_internal(so, iterable)) {
            Py_DECREF(so);
            return NULL;
        }
    }

    return (PyObject *)so;
}
```

