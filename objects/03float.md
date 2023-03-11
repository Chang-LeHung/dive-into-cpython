# 深入理解 Python 虚拟机：浮点数（float）的实现原理及源码剖析

在本篇文章当中主要分析在 cpython 虚拟机当中 float 类型的实现原理以及与他相关的一些源代码。

## Float 数据结构

在 cpython 虚拟机当中浮点数类型的数据结构定义如下所示：

```c
typedef struct {
    PyObject_HEAD
    double ob_fval;
} PyFloatObject;
```

上面的数据结构定义图示如下：

![](../images/12-tuple.png)

- 在上面的数据结构当中最重要的一个字段就是 ob_fval，这个就是真实存储浮点数的地方。
- ob_refcnt 就是对象的引用计数。
- ob_type 就是对象的类型。

## 浮点数的相关方法

### 创建 float 对象

和我们在前面所讨论到的元组和列表对象一样，在 cpython 内部实现 float 类型的时候也会给 float 对象做一层中间层以加快浮点数的内存分配，具体的相关代码如下所示：

```c
#define PyFloat_MAXFREELIST    100
static int numfree = 0;
static PyFloatObject *free_list = NULL;
```

在 cpython 内部做多会缓存 100 个 float 对象的内存空间，如果超过 100 就会直接释放内存了，这里需要注意一点的是只用一个指针就可以将所有的 float 对象缓存起来，这一点是如何实现的。

```c
PyObject *
PyFloat_FromDouble(double fval)
{
    PyFloatObject *op = free_list;
    if (op != NULL) {
        free_list = (PyFloatObject *) Py_TYPE(op);
        numfree--;
    } else {
        op = (PyFloatObject*) PyObject_MALLOC(sizeof(PyFloatObject));
        if (!op)
            return PyErr_NoMemory();
    }
    /* Inline PyObject_New */
    (void)PyObject_INIT(op, &PyFloat_Type);
    op->ob_fval = fval;
    return (PyObject *) op;
}
```



### 加法

下面是在 cpython 当中浮点数的加法具体实现。

```c
static PyObject *
float_add(PyObject *v, PyObject *w)
{
    double a,b;
    CONVERT_TO_DOUBLE(v, a); // CONVERT_TO_DOUBLE 这个宏的主要作用就是将对象的 ob_fval 这个字段的值保存到 a 当中
    CONVERT_TO_DOUBLE(w, b); // 这个就是将 w 当中的 ob_fval 字段的值保存到 b 当中
    a = a + b;
    return PyFloat_FromDouble(a); // 创建一个新的 float 对象 并且将这个对象返回
}
```



```python
import dis

def float_add():
  a = 1.2
  b = 2.4
  c = a + b

if __name__ == '__main__':
  dis.dis(float_add)
```

```bash
  4           0 LOAD_CONST               1 (1.2)
              3 STORE_FAST               0 (a)

  5           6 LOAD_CONST               2 (2.4)
              9 STORE_FAST               1 (b)

  6          12 LOAD_FAST                0 (a)
             15 LOAD_FAST                1 (b)
             18 BINARY_ADD
             19 STORE_FAST               2 (c)
             22 LOAD_CONST               0 (None)
             25 RETURN_VALUE
```

![](../images/14-float.png)



![](../images/13-float.png)

