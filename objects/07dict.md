# 深入理解 Python 虚拟机：字典（dict）的实现原理及源码剖析

在本篇文章当中主要给大家深入介绍一下在 cpython 当中字典的实现原理，在本篇文章当中主要介绍在早期 python3 当中的版本字典的实现，现在的字典做了部分优化，我们在后面的文章当中再介绍。

## 字典数据结构分析

```c
/* The ma_values pointer is NULL for a combined table
 * or points to an array of PyObject* for a split table
 */
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

![26-dict](../images/26-dict.png)



![26-dict](../images/27-dict.png)

## 源码分析



