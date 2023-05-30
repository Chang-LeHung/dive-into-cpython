# 深入理解 python 虚拟机：描述器实现原理与源码分析

在本篇文章当中主要给大家介绍描述器背后的实现原理，通过分析 cpython 对应的源代码了解与描述器相关的字节码的指令，我们就可以真正了解到描述器背后的原理！

## 从字节码角度看描述器

在前面的内容当中我们已经详细分析了描述器的使用和其相关的应用，我们通常使用描述器都是将其作为类的一个类属性使用，而使用的方式就是 `a.attr`，而这个使用方式使用的字节码如下所示：

```bash
Python 3.10.9 (main, Jan 11 2023, 09:18:18) [Clang 14.0.6 ] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> import dis
>>> dis.dis("a.attr")
  1           0 LOAD_NAME                0 (a)
              2 LOAD_ATTR                1 (attr)
              4 RETURN_VALUE
>>>
```

可以看到的是真正调用的字节码是 `LOAD_ATTR`，因此只需要我们深入 `LOAD_ATTR` 指令我们就能够了解这其中所有发生的内容，了解魔法背后的神秘。

## 描述器源码分析

cpython 虚拟机当中执行这个字节码的内容如下：

```c
TARGET(LOAD_ATTR) {
    PyObject *name = GETITEM(names, oparg);
    PyObject *owner = TOP();
    PyObject *res = PyObject_GetAttr(owner, name);
    Py_DECREF(owner);
    SET_TOP(res);
    if (res == NULL)
        goto error;
    DISPATCH();
}
```

`owner` 对应上面的代码当中的 `a` 对象，`name` 对应上面的字符串 `attr` 。从上面的代码分析我们可以知道真正获取属性的函数为 `PyObject_GetAttr` ，这个函数的源程序如下所示：

```c
PyObject *
PyObject_GetAttr(PyObject *v, PyObject *name)
{
    // 首先获取对象 v 的类型 ，对应上面的代码的话就是找到对象 a 的类型
    PyTypeObject *tp = Py_TYPE(v);

    if (!PyUnicode_Check(name)) {
        PyErr_Format(PyExc_TypeError,
                     "attribute name must be string, not '%.200s'",
                     name->ob_type->tp_name);
        return NULL;
    }
    // 获取对象的 tp_getattro 函数 这个函数就是负责属性查找的函数 我们一般使用的这个属性查找函数都是
    // object 这个基类的属性查找函数
    if (tp->tp_getattro != NULL)
        return (*tp->tp_getattro)(v, name);
    if (tp->tp_getattr != NULL) {
        const char *name_str = PyUnicode_AsUTF8(name);
        if (name_str == NULL)
            return NULL;
        return (*tp->tp_getattr)(v, (char *)name_str);
    }
    PyErr_Format(PyExc_AttributeError,
                 "'%.50s' object has no attribute '%U'",
                 tp->tp_name, name);
    return NULL;
}
```

在上面的代码当中我们提到了 object 这个基类，因为我们需要找到他的属性查找函数，因此我们看一下这个基类在 cpython 内部的定义，在 cpython 内部 object 基类定义为 `PyBaseObject_Type`：

```c
PyTypeObject PyBaseObject_Type = {
    PyVarObject_HEAD_INIT(&PyType_Type, 0)
    "object",                                   /* tp_name */
    sizeof(PyObject),                           /* tp_basicsize */
    0,                                          /* tp_itemsize */
    object_dealloc,                             /* tp_dealloc */
    0,                                          /* tp_print */
    0,                                          /* tp_getattr */
    0,                                          /* tp_setattr */
    0,                                          /* tp_reserved */
    object_repr,                                /* tp_repr */
    0,                                          /* tp_as_number */
    0,                                          /* tp_as_sequence */
    0,                                          /* tp_as_mapping */
    (hashfunc)_Py_HashPointer,                  /* tp_hash */
    0,                                          /* tp_call */
    object_str,                                 /* tp_str */
    // 这个就是真正的属性查找函数
    PyObject_GenericGetAttr,                    /* tp_getattro */
    PyObject_GenericSetAttr,                    /* tp_setattro */
    0,                                          /* tp_as_buffer */
    Py_TPFLAGS_DEFAULT | Py_TPFLAGS_BASETYPE,   /* tp_flags */
    PyDoc_STR("object()\n--\n\nThe most base type"),  /* tp_doc */
    0,                                          /* tp_traverse */
    0,                                          /* tp_clear */
    object_richcompare,                         /* tp_richcompare */
    0,                                          /* tp_weaklistoffset */
    0,                                          /* tp_iter */
    0,                                          /* tp_iternext */
    object_methods,                             /* tp_methods */
    0,                                          /* tp_members */
    object_getsets,                             /* tp_getset */
    0,                                          /* tp_base */
    0,                                          /* tp_dict */
    0,                                          /* tp_descr_get */
    0,                                          /* tp_descr_set */
    0,                                          /* tp_dictoffset */
    object_init,                                /* tp_init */
    PyType_GenericAlloc,                        /* tp_alloc */
    object_new,                                 /* tp_new */
    PyObject_Del,                               /* tp_free */
};

// 从上面的 object 定义可以看到真正的查找函数为 PyObject_GenericGetAttr 其函数内容如下所示：
PyObject *
PyObject_GenericGetAttr(PyObject *obj, PyObject *name)
{
    return _PyObject_GenericGetAttrWithDict(obj, name, NULL, 0);
}
```

`_PyObject_GenericGetAttrWithDict` 函数定义如下所示：

```c
/* Generic GetAttr functions - put these in your tp_[gs]etattro slot. */

PyObject *
_PyObject_GenericGetAttrWithDict(PyObject *obj, PyObject *name,
                                 PyObject *dict, int suppress)
{
    /* Make sure the logic of _PyObject_GetMethod is in sync with
       this method.

       When suppress=1, this function suppress AttributeError.
    */
    // 首先获取对象的类型 针对于上面的源代码来说就是找到对象 a 的类型
    PyTypeObject *tp = Py_TYPE(obj);
    PyObject *descr = NULL;
    PyObject *res = NULL;
    descrgetfunc f;
    Py_ssize_t dictoffset;
    PyObject **dictptr;

    if (!PyUnicode_Check(name)){
        PyErr_Format(PyExc_TypeError,
                     "attribute name must be string, not '%.200s'",
                     name->ob_type->tp_name);
        return NULL;
    }
    Py_INCREF(name);

    if (tp->tp_dict == NULL) {
        if (PyType_Ready(tp) < 0)
            goto done;
    }
    // 这个是从所有的基类当中找到一个名字为 name 的对象 如果没有就返回 NULL
    // 这里的过程还是比较复杂 需要从类的 mro 序列当中进行查找
    descr = _PyType_Lookup(tp, name);

    f = NULL;
    // 如果找到的类对象不为空 也就是在类本身或者基类当中找到一个名为 name 的对象
    if (descr != NULL) {
        Py_INCREF(descr);
        // 得到类对象的 __get__ 函数
        f = descr->ob_type->tp_descr_get;
        // 如果对象有 __get__ 函数则进行进一步判断
        if (f != NULL && PyDescr_IsData(descr)) { // PyDescr_IsData(descr) 这个宏是查看对象是否有 __set__ 函数
            // 如果是类对象又有 __get__ 函数 又有 __set__ 函数 则直接调用对象的 __get__ 函数 并且将结果返回
            // 这里需要注意一下优先级 这个优先级是最高的 如果一个类对象定义了 __set__ 和 __get__ 函数，那么
            // 就会直接调用类对象的 __get__ 函数并且将这个函数的返回值返回
            res = f(descr, obj, (PyObject *)obj->ob_type);
            if (res == NULL && suppress &&
                    PyErr_ExceptionMatches(PyExc_AttributeError)) {
                PyErr_Clear();
            }
            goto done;
        }
    }
    // 如果没有名为 name 的类对象 或者虽然有名为 name 的对象 但是只要没有同时定义 __get__ 和 __set__ 函数就需要
    // 继续往下执行 从对象本省的 dict 当中寻找
    if (dict == NULL) {
        /* Inline _PyObject_GetDictPtr */
        // 这部分代码就是从对象 obj 当中找到对象的 __dict__ 字段
        dictoffset = tp->tp_dictoffset;
        if (dictoffset != 0) {
            if (dictoffset < 0) {
                Py_ssize_t tsize;
                size_t size;

                tsize = ((PyVarObject *)obj)->ob_size;
                if (tsize < 0)
                    tsize = -tsize;
                size = _PyObject_VAR_SIZE(tp, tsize);
                assert(size <= PY_SSIZE_T_MAX);

                dictoffset += (Py_ssize_t)size;
                assert(dictoffset > 0);
                assert(dictoffset % SIZEOF_VOID_P == 0);
            }
            dictptr = (PyObject **) ((char *)obj + dictoffset);
            dict = *dictptr;
        }
    }
    // 如果对象 obj 存在 __dict__ 字段 那么就返回 __dict__ 字段当中名字等于 name 的对象
    if (dict != NULL) {
        Py_INCREF(dict);
        res = PyDict_GetItem(dict, name);
        if (res != NULL) {
            Py_INCREF(res);
            Py_DECREF(dict);
            goto done;
        }
        Py_DECREF(dict);
    }
    // 如果类对象定义了 __get__ 函数没有定义 __set__ 函数而且在 dict 当中没有找到名为 name 的对象的话
    // 那么久调用类对象的 __get__ 函数
    if (f != NULL) {
        res = f(descr, obj, (PyObject *)Py_TYPE(obj));
        if (res == NULL && suppress &&
                PyErr_ExceptionMatches(PyExc_AttributeError)) {
            PyErr_Clear();
        }
        goto done;
    }
    // 如果类对象没有定义 __get__ 函数那么就直接将这个类对象返回
    if (descr != NULL) {
        res = descr;
        descr = NULL;
        goto done;
    }

    if (!suppress) {
        PyErr_Format(PyExc_AttributeError,
                     "'%.50s' object has no attribute '%U'",
                     tp->tp_name, name);
    }
  done:
    Py_XDECREF(descr);
    Py_DECREF(name);
    return res;
}
```

根据对上面的程序进行分析，我们可以到得到从对象当中获取属性的顺序和优先级如下所示（以 `a.attr` 为例子）：

- 如果属性不是类属性，那么很简单就是直接从对象本身的 `__dict__` 当中获取这个对象。
- 如果属性是类属性，如果同时定义了 `__get__` 和 `__set__` 函数，那么就会调用这个类对象的 `__get__` 函数，将这个函数的返回值作为 `a.attr` 的返回值。
- 如果属性是类属性，如果只定义了 `__get__` 函数，那么就会从对象 `a` 本身的 `__dict__` 当中获取 `attr` ，如果 `attr` 存在与 `a.__dict__` 当中，那么久返回这个结果，如果不存在的话那么就会调用 `__get__` 函数，将这个函数的返回值作为 `a.attr` 的结果，如果连 `__get__` 都没有定义，那么就会直接返回这个类对象。

上面的函数过程用 python 语言来描述的话如下所示：

```python
def find_name_in_mro(cls, name, default):
    "Emulate _PyType_Lookup() in Objects/typeobject.c"
    for base in cls.__mro__:
        if name in vars(base):
            return vars(base)[name]
    return default

def object_getattribute(obj, name):
    "Emulate PyObject_GenericGetAttr() in Objects/object.c"
    null = object()
    objtype = type(obj)
    cls_var = find_name_in_mro(objtype, name, null)
    descr_get = getattr(type(cls_var), '__get__', null)
    if descr_get is not null:
        if (hasattr(type(cls_var), '__set__')
            or hasattr(type(cls_var), '__delete__')):
            return descr_get(cls_var, obj, objtype)     # data descriptor
    if hasattr(obj, '__dict__') and name in vars(obj):
        return vars(obj)[name]                          # instance variable
    if descr_get is not null:
        return descr_get(cls_var, obj, objtype)         # non-data descriptor
    if cls_var is not null:
        return cls_var                                  # class variable
    raise AttributeError(name)
```

仔细分析上面的 python 代码，他的整个逻辑和我们前面分析的 c 代码的逻辑是一样的。首先是获取对象的类型，然后从类型当中获取名字为 name 的属性，如果类属性定义了 `__get__` 函数，则需要进行描述器的判断，否则直接从对象的 `__dict__` 当中获取，如果其中没有则返回类对象。

## 总结

在本篇文章当中主要给大家深入分析了在 cpython 的内部对于描述器的实现原理，其中最重要的就是在获取属性的时候的优先级了。我们直接从 c 代码的层面分析了整个获取属性的优先级，并且给出了 python 层面的代码帮助大家理解。

---

本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。

![](../qrcode2.jpg)

