# 深入理解 Python 虚拟机：字典（dict）的优化

在前面的文章当中我们讨论的是 python3 当中早期的内嵌数据结构字典的实现，在本篇文章当中主要介绍在后续对于字典的内存优化。

## 字典优化

在前面的文章当中我们介绍的字典的数据结构主要如下所示：

```c

typedef struct {
    PyObject_HEAD
    Py_ssize_t ma_used;
    PyDictKeysObject *ma_keys;
    PyObject **ma_values;
} PyDictObject;

struct _dictkeysobject {
    Py_ssize_t dk_refcnt;
    Py_ssize_t dk_size;
    dict_lookup_func dk_lookup;
    Py_ssize_t dk_usable;
    PyDictKeyEntry dk_entries[1];
};

typedef struct {
    /* Cached hash code of me_key. */
    Py_hash_t me_hash;
    PyObject *me_key;
    PyObject *me_value; /* This field is only meaningful for combined tables */
} PyDictKeyEntry;
```

用图示的方式表示如下图所示：

![31-bytes](../images/31-bytes.png)

所有的键值对都存储在 dk_entries 数组当中，比如对于 "Hello" "World" 这个键值对存储过程如下所示，如果 "Hello" 的哈希值等于 8 ，那么计算出来对象在 dk_entries 数组当中的下标位 0 。

![32-dict](../images/32-dict.png)

在前面的文章当中我们谈到了，在 cpython 当中 dk_entries 数组当中的一个对象占用 24 字节的内存空间，在 cpython 当中的负载因子是 $\frac{2}{3}$ 。而一个 entry 的大小是 24 个字节，如果 dk_entries 的长度是 1024 的话，那么大概有 1024  / 3 * 24 = 8K 的内存空间是浪费的。为了解决这个问题，在新版的 cpython 当中采取了一个策略用于减少内存的使用。具体的设计如下图所示：

![33-dict](../images/33-dict.png)



![33-dict](../images/34-dict.png)