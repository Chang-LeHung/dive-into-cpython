# 深入理解Python虚拟机：super超级魔法的背后原理

## 介绍

在本篇文章中，我们将深入探讨Python中的`super`类的使用和原理。`super`类作为Python虚拟机中强大的功能之一，可以帮助我们更灵活地使用继承和多重继承。

## super类的使用

在 Python 中，我们经常使用继承来构建类的层次结构。当子类继承了父类的属性和方法时，有时我们需要在子类中调用父类的方法或属性。这就是`super`类的用武之地。

`super`函数的一般用法是在子类中调用父类的方法，格式为`super().method()`。这样可以方便地使用父类的实现，并在子类中添加自己的特定行为。

下面是一个示例代码，演示了`super`函数的使用：

```python
class Parent:
    def __init__(self, name):
        self.name = name
    
    def say_hello(self):
        print(f"Hello, I'm {self.name}")

class Child(Parent):
    def __init__(self, name, age):
        super().__init__(name)
        self.age = age
    
    def say_hello(self):
        super().say_hello()
        print(f"I'm {self.name} and I'm {self.age} years old")

child = Child("Alice", 10)
child.say_hello()
```

输出结果为：

```
Hello, I'm Alice
I'm Alice and I'm 10 years old
```

在上述示例中，`Child`类继承自`Parent`类。在`Child`类的构造函数中，我们使用`super().__init__(name)`来调用父类`Parent`的构造函数，以便在子类中初始化父类的属性。在`say_hello`方法中，我们使用`super().say_hello()`调用父类`Parent`的`say_hello`方法，并在子类中添加了额外的输出。

除了调用父类的方法，`super`函数还可以用于访问父类的属性。例如，`super().attribute`可以用来获取父类的属性值。

## super类的工作原理

### Super 设计的目的

要理解`super`类的工作原理，我们需要了解Python中的多重继承和方法解析顺序（Method Resolution Order，MRO）。多继承是指一个类可以同时继承多个父类。在Python中，每个类都有一个内置属性`__mro__`，它记录了方法解析顺序。MRO是根据C3线性化算法生成的，它决定了在多重继承中调用方法的顺序。当对象进行方法调用的时候，就会从类的 mro 第一个类开始寻找，直到最后一个类位置，当第一次发现对应的类有相应的方法时就进行返回就调用这个类的这个方法。关于 C3 算法和 mro 的细节可以参考文章 [深入理解 python 虚拟机：多继承与 mro](https://github.com/Chang-LeHung/dive-into-cpython/blob/master/obsy/04mro.md#深入理解-python-虚拟机多继承与-mro) 。

Super 类的的签名为 *class* **super**(*type*, *object_or_type=None*)，这个类返回的是一个 super 对象，也是一个代理对象，当使用这个对象进行方法调用的时候，这个调用会转发给 *type* 父类或同级类。object_or_type 确定要搜索的方法解析顺序（也就是通过object_or_type得到具体的 mro），对于方法的搜索从 *type* 后面的类开始。

例如，如果 的 object_or_type 的 mro 是 `D -> B -> C -> A -> object` 并且*type*的值是 `B` ，则进行方法搜索的顺序为`C -> A -> object` ，因为搜索是从 *type* 的下一个类开始的。

下面我们使用一个例子来实际体验一下：

```python
class A:

	def __init__(self):
		super().__init__()

	def method(self):
		print("In method of A")


class B(A):

	def __init__(self):
		super().__init__()

	def method(self):
		print("In method of B")


class C(B):

	def __init__(self):
		super().__init__()

	def method(self):
		print("In method of C")


if __name__ == '__main__':
	print(C.__mro__)
	obj = C()
	s = super(C, obj)
	s.method()
	s = super(B, obj)
	s.method()
```

上面的程序输出结果为：

```bash
(<class '__main__.C'>, <class '__main__.B'>, <class '__main__.A'>, <class 'object'>)
In method of B
In method of A
```

在上面的代码当中继承顺序为，C 继承 B，B 继承 A，C 的 mro 为，(C, B, A, object)，`super(C, obj)` 表示从 C 的下一个类开始搜索，因此具体的搜索顺序为 ( B, A, object)，因此此时调用 method 方法的时候，会调用 B 的 method 方法，`super(B, obj)` 表示从 B 的下一个类开始搜索，因此搜索顺序为 (A, object)，因此此时调用的是 A 的 method 方法。

### Super 和栈帧的关系

在上一小节当中我们在使用 super 进行测试的时候，都是给了 super 两个参数，但是需要注意的是我们在一个类的 `__init__`方法当中并没有给 super 任何参数，那么他是如何找到 super 需要的两个参数呢？

这其中的魔法就是在 Super 类对象的初始化会获取当前栈帧的第一个参数对象，这个就是对应上面的 *object_or_type* 参数，*type* 就是局部变量表当中的一个参数 `__class__`：

```python
import inspect


class A(object):

	def __init__(self):
		super().__init__()
		print(inspect.currentframe().f_locals)

	def bar(self):
		pass

	def foo(self):
		pass


class Demo(A):

	def __init__(self):
		super().__init__()
		print(inspect.currentframe().f_locals)

	def bar(self):
		super().bar()
		print(inspect.currentframe().f_locals)

	def foo(self):
		print(inspect.currentframe().f_locals)


if __name__ == '__main__':
	demo = Demo()
	demo.bar()
	demo.foo()

```

上面的代码输出结果为：

```bash
{'self': <__main__.Demo object at 0x103059040>, '__class__': <class '__main__.A'>}
{'self': <__main__.Demo object at 0x103059040>, '__class__': <class '__main__.Demo'>}
{'self': <__main__.Demo object at 0x103059040>, '__class__': <class '__main__.Demo'>}
{'self': <__main__.Demo object at 0x103059040>}
```

从上面的例子我们可以看到当我们进行方法调用且方法当中有 super 的使用时，栈帧的局部变量表当中会多一个字段 `__class__`，这个字段表示对应的类，比如在 Demo 类当中，这个字段就是 Demo，在类 A 当中这个字段就是 A 。为什么要进行这样的处理呢，这是因为需要调用相应位置类的父类方法，因此所有的使用 super 的位置的 *type* 都必须是所在类。而在前面我们已经说明了*object_or_type* 表示的是栈帧当中的第一个参数，也就是对象 self，这一点从上面的局部变量表也可以看出来，通过这个对象我们可以知道对象本身的 mro 序列了。在 super 得到两个参数之后，也就能够实现对应的功能了。

## CPython的实现

在本小节当中我们来仔细看一下 CPython 内部是如何实现 super 类的，首先来看一下他的 `__init__` 方法（删除了error checking 代码）：

```c
static int
super_init(PyObject *self, PyObject *args, PyObject *kwds)
{
    superobject *su = (superobject *)self;
    PyTypeObject *type = NULL; // 表示从哪个类的后面开始查询，含义和 上文当中的 type 一样
    PyObject *obj = NULL; // 表示传递过来的对象
    PyTypeObject *obj_type = NULL; // 表示对象 obj 的类型
    // 获取 super 的两个参数 type 和 object_or_type
    if (!PyArg_ParseTuple(args, "|O!O:super", &PyType_Type, &type, &obj))
        return -1;

    if (type == NULL) {
        /* Call super(), without args -- fill in from __class__
           and first local variable on the stack. */
        PyFrameObject *f;
        PyCodeObject *co;
        Py_ssize_t i, n;
        f = _PyThreadState_GET()->frame; // 得到当前栈帧
        // 栈帧的第一个参数表示对象
        obj = f->f_localsplus[0];
        if (obj == NULL && co->co_cell2arg) {
            /* The first argument might be a cell. */
            n = PyTuple_GET_SIZE(co->co_cellvars);
            for (i = 0; i < n; i++) {
                if (co->co_cell2arg[i] == 0) {
                    PyObject *cell = f->f_localsplus[co->co_nlocals + i];
                    assert(PyCell_Check(cell));
                    obj = PyCell_GET(cell);
                    break;
                }
            }
        }
        if (co->co_freevars == NULL)
            n = 0;
        else {
            assert(PyTuple_Check(co->co_freevars));
            n = PyTuple_GET_SIZE(co->co_freevars);
        }
        // 下面的代码表示获取 type 对象，也就是从局部变量表当中获取到 __class__ 
        for (i = 0; i < n; i++) {
            PyObject *name = PyTuple_GET_ITEM(co->co_freevars, i);
            assert(PyUnicode_Check(name));
            if (_PyUnicode_EqualToASCIIId(name, &PyId___class__)) {
                Py_ssize_t index = co->co_nlocals +
                    PyTuple_GET_SIZE(co->co_cellvars) + i;
                PyObject *cell = f->f_localsplus[index];
                type = (PyTypeObject *) PyCell_GET(cell);
                break;
            }
        }
    }

    if (obj == Py_None)
        obj = NULL;
    if (obj != NULL) {
        // 这个函数是用于获取 obj 的 type
        obj_type = supercheck(type, obj);
        if (obj_type == NULL)
            return -1;
        Py_INCREF(obj);
    }
    return 0;
}

```

在上面的代码执行完成之后就得到了一个 super 对象，之后在进行函数调用的时候就会将对应类的方法和对象 obj 绑定成一个方法对象返回，然后在进行方法调用的时候就能够成功调用了。

```python
class Demo:

	def __init__(self):
		print(super().__init__)


if __name__ == '__main__':
	Demo()
```

输出结果：

```bash
<method-wrapper '__init__' of Demo object at 0x100584070>
```



## 总结

super 是 Python 面向对象编程当中非常重要的一部分内容，在本篇文章当中详细介绍了 super 内部的工作原理和 CPython 内部部分源代码分析了 super 的具体实现。

---

本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。

![](https://img2023.cnblogs.com/blog/2519003/202305/2519003-20230515205927052-1345839185.png)

