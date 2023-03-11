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

与 float 类型相关的主要是一些与数学计算相关的方法，主要是加减乘除取余等方法。

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

