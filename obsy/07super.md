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

从上面的例子我们可以看到当我们进行方法调用且方法当中有 super 的使用时，栈帧的局部变量表当中会多一个字段 `__class__`，这个字段表示对应的类，比如在 Demo 类当中，这个字段就是 Demo，在类 A 当中这个字段就是 A 。

## CPython的实现

CPython 是 Python 的默认解释器，它使用 C 语言实现。在 CPython 中，`super`函数的实现是通过查找对象的`__class__`属性来确定下一个要调用的方法。`__class__`属性指向对象所属的类。

CPython使用`PyTypeObject`结构体来表示每个类。该结构体包含了类的名称、父类、方法表等信息。在方法表中，每个方法都有一个指向实际函数的指针。

当使用`super`函数时，CPython会根据当前对象的`__class__`属性和方法名，在父类的方法表中找到对应的方法，并调用它。

## 总结

`super`函数是Python中重要的功能之一，它允许我们方便地调用父类的方法和访问父类的属性。它的实现原理是根据当前类的MRO找到下一个要调用的方法。在CPython中，`super`函数的实现是通过查找对象的`__class__`属性来确定下一个要调用的方法。

