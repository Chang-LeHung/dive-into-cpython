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

    setentry smalltable[PySet_MINSIZE]; // #define PySet_MINSIZE 8
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

- dummy entries ：如果在哈希表当中的数组原来有一个数据，如果我们删除这个 entry 的时候，对应的位置就会被赋值成 dummy，与 dummy 有关的定义在上面的代码当中已经给出，dummy 对象的哈希值等于 -1。
- 明白 dummy 的含义之后，fill 和 used 这两个字段的含义就比较容易理解了，used 就是数组当中真实有效的对象的个数，fill 还需要加上 dummy 对象的个数。
- mask，数组的长度等于 $2^n$，mask 的值等于 $2^n - 1$ 。
- table，实际保存 entry 对象的数组。
- hash，这个值对 frozenset 有用，保存计算出来的哈希值。如果你的数组很大的话，计算哈希值其实也是一个比较大的开销，因此可以将计算出来的哈希值保存下来，以便下一次求的时候可以将哈希值直接返回，这也印证了在 python 当中为什么只有 immutable 对象才能够放入到集合和字典当中，因为哈希值计算一次保存下来了，如果再加入对象对象的哈希值也会变化，这样做就会发生错误了。
- finger，主要是用于记录下一个开始寻找被删除对象的下标，这个在数组很大的时候会加快寻找被删除对象。
- smalltable，默认的小数组，cpython 设置的一半的集合对象不会超过这个大小（8），因此在申请一个集合对象的时候直接就申请了这个小数组的内存大小。
- weakrelist，这个字段主要和垃圾回收有关，这里暂时不进行详细说明。

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

## 往集合当中加入数据

首先我们先大致理清楚往集合当中插入数据的流程：

- 首先根据对象的哈希值，计算需要将对象放在哪个位置，也就是对应数组的下标。
- 查看对应下标的位置是否存在对象，如果不存在对象则将数据保存在对应下标的位置。
- 如果对应的位置存在对象，则查看是否和当前要插入的对象相等，则返回。
- 如果不相等，则使用类似于线性探测的方式去寻找下一个要插入的位置（具体的实现可以查看相关代码）。

```c
static PyObject *
set_add(PySetObject *so, PyObject *key)
{
    if (set_add_key(so, key))
        return NULL;
    Py_RETURN_NONE;
}

static int
set_add_key(PySetObject *so, PyObject *key)
{
    setentry entry;
    Py_hash_t hash;
    // 这里就查看一下是否是字符串，如果是字符串直接拿到哈希值
    if (!PyUnicode_CheckExact(key) ||
        (hash = ((PyASCIIObject *) key)->hash) == -1) {
      	// 如果不是字符串则需要调用对象自己的哈希函数求得对应的哈希值
        hash = PyObject_Hash(key);
        if (hash == -1)
            return -1;
    }
    // 创建一个 entry 对象将这个对象加入到哈希表当中
    entry.key = key;
    entry.hash = hash;
    return set_add_entry(so, &entry);
}

static int
set_add_entry(PySetObject *so, setentry *entry)
{
    Py_ssize_t n_used;
    PyObject *key = entry->key;
    Py_hash_t hash = entry->hash;

    assert(so->fill <= so->mask);  /* at least one empty slot */
    n_used = so->used;
    Py_INCREF(key);
    // 调用函数 set_insert_key 将对象插入到数组当中
    if (set_insert_key(so, key, hash)) {
        Py_DECREF(key);
        return -1;
    }
    // 这里就是哈希表的核心的扩容机制
    if (!(so->used > n_used && so->fill*3 >= (so->mask+1)*2))
        return 0;
    // 这是扩容大小的逻辑
    return set_table_resize(so, so->used>50000 ? so->used*2 : so->used*4);
}

static int
set_insert_key(PySetObject *so, PyObject *key, Py_hash_t hash)
{
    setentry *entry;
    // set_lookkey 这个函数便是插入的核心的逻辑的实现对应的实现函数在下方
    entry = set_lookkey(so, key, hash);
    if (entry == NULL)
        return -1;
    if (entry->key == NULL) {
        /* UNUSED */
        entry->key = key;
        entry->hash = hash;
        so->fill++;
        so->used++;
    } else if (entry->key == dummy) {
        /* DUMMY */
        entry->key = key;
        entry->hash = hash;
        so->used++;
    } else {
        /* ACTIVE */
        Py_DECREF(key);
    }
    return 0;
}

// 下面的代码就是在执行我们在前面所谈到的逻辑，直到找到相同的 key 或者空位置才退出 while 循环
static setentry *
set_lookkey(PySetObject *so, PyObject *key, Py_hash_t hash)
{
    setentry *table = so->table;
    setentry *freeslot = NULL;
    setentry *entry;
    size_t perturb = hash;
    size_t mask = so->mask;
    size_t i = (size_t)hash & mask; /* Unsigned for defined overflow behavior */
    size_t j;
    int cmp;

    entry = &table[i];
    if (entry->key == NULL)
        return entry;

    while (1) {
        if (entry->hash == hash) {
            PyObject *startkey = entry->key;
            /* startkey cannot be a dummy because the dummy hash field is -1 */
            assert(startkey != dummy);
            if (startkey == key)
                return entry;
            if (PyUnicode_CheckExact(startkey)
                && PyUnicode_CheckExact(key)
                && unicode_eq(startkey, key))
                return entry;
            Py_INCREF(startkey);
            // returning -1 for error, 0 for false, 1 for true
            cmp = PyObject_RichCompareBool(startkey, key, Py_EQ);
            Py_DECREF(startkey);
            if (cmp < 0)                                          /* unlikely */
                return NULL;
            if (table != so->table || entry->key != startkey)     /* unlikely */
                return set_lookkey(so, key, hash);
            if (cmp > 0)                                          /* likely */
                return entry;
            mask = so->mask;                 /* help avoid a register spill */
        }
        if (entry->hash == -1 && freeslot == NULL)
            freeslot = entry;

        if (i + LINEAR_PROBES <= mask) {
            for (j = 0 ; j < LINEAR_PROBES ; j++) {
                entry++;
                if (entry->key == NULL)
                    goto found_null;
                if (entry->hash == hash) {
                    PyObject *startkey = entry->key;
                    assert(startkey != dummy);
                    if (startkey == key)
                        return entry;
                    if (PyUnicode_CheckExact(startkey)
                        && PyUnicode_CheckExact(key)
                        && unicode_eq(startkey, key))
                        return entry;
                    Py_INCREF(startkey);
                    // returning -1 for error, 0 for false, 1 for true
                    cmp = PyObject_RichCompareBool(startkey, key, Py_EQ);
                    Py_DECREF(startkey);
                    if (cmp < 0)
                        return NULL;
                    if (table != so->table || entry->key != startkey)
                        return set_lookkey(so, key, hash);
                    if (cmp > 0)
                        return entry;
                    mask = so->mask;
                }
                if (entry->hash == -1 && freeslot == NULL)
                    freeslot = entry;
            }
        }

        perturb >>= PERTURB_SHIFT; // #define PERTURB_SHIFT 5
        i = (i * 5 + 1 + perturb) & mask;

        entry = &table[i];
        if (entry->key == NULL)
            goto found_null;
    }
  found_null:
    return freeslot == NULL ? entry : freeslot;
}
```

## 哈希表数组扩容

在 cpython 当中对于给哈希表数组扩容的操作，很多情况下都是用下面这行代码：

```c
set_table_resize(so, so->used>50000 ? so->used*2 : so->used*4);
```

对应的扩容函数如下所示：

```c
static int
set_table_resize(PySetObject *so, Py_ssize_t minused)
{
    Py_ssize_t newsize;
    setentry *oldtable, *newtable, *entry;
    Py_ssize_t oldfill = so->fill;
    Py_ssize_t oldused = so->used;
    int is_oldtable_malloced;
    setentry small_copy[PySet_MINSIZE];

    assert(minused >= 0);

    /* Find the smallest table size > minused. */
    /* XXX speed-up with intrinsics */
    for (newsize = PySet_MINSIZE;
         newsize <= minused && newsize > 0;
         newsize <<= 1)
        ;
    if (newsize <= 0) {
        PyErr_NoMemory();
        return -1;
    }

    /* Get space for a new table. */
    oldtable = so->table;
    assert(oldtable != NULL);
    is_oldtable_malloced = oldtable != so->smalltable;

    if (newsize == PySet_MINSIZE) {
        /* A large table is shrinking, or we can't get any smaller. */
        newtable = so->smalltable;
        if (newtable == oldtable) {
            if (so->fill == so->used) {
                /* No dummies, so no point doing anything. */
                return 0;
            }
            /* We're not going to resize it, but rebuild the
               table anyway to purge old dummy entries.
               Subtle:  This is *necessary* if fill==size,
               as set_lookkey needs at least one virgin slot to
               terminate failing searches.  If fill < size, it's
               merely desirable, as dummies slow searches. */
            assert(so->fill > so->used);
            memcpy(small_copy, oldtable, sizeof(small_copy));
            oldtable = small_copy;
        }
    }
    else {
        newtable = PyMem_NEW(setentry, newsize);
        if (newtable == NULL) {
            PyErr_NoMemory();
            return -1;
        }
    }

    /* Make the set empty, using the new table. */
    assert(newtable != oldtable);
    memset(newtable, 0, sizeof(setentry) * newsize);
    so->fill = 0;
    so->used = 0;
    so->mask = newsize - 1;
    so->table = newtable;

    /* Copy the data over; this is refcount-neutral for active entries;
       dummy entries aren't copied over, of course */
    if (oldfill == oldused) {
        for (entry = oldtable; oldused > 0; entry++) {
            if (entry->key != NULL) {
                oldused--;
                set_insert_clean(so, entry->key, entry->hash);
            }
        }
    } else {
        for (entry = oldtable; oldused > 0; entry++) {
            if (entry->key != NULL && entry->key != dummy) {
                oldused--;
                set_insert_clean(so, entry->key, entry->hash);
            }
        }
    }

    if (is_oldtable_malloced)
        PyMem_DEL(oldtable);
    return 0;
}
```

