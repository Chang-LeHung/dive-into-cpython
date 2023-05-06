# 深入理解python虚拟机：黑科技的幕后英雄——描述器

在本篇文章当中主要给大家介绍一个我们在使用类的时候经常使用但是却很少在意的黑科技——描述器，在本篇文章当中主要分析描述器的原理，以及介绍使用描述器实现属性访问控制和 orm 映射等等功能！在后面的文章当中我们将继续去分析描述器的实现原理。



## 描述器的基本用法

Python 类描述器是一个实现了 `__get__`、`__set__` 或 `__delete__` 中至少一个方法的 Python 类。这些方法分别用于在属性被访问、设置或删除时调用。当一个描述器被定义为一个类的属性时，它可以控制该属性的访问、修改和删除。

下面是一个示例，演示了如何定义一个简单的描述器：

```python
class Descriptor:
    def __get__(self, instance, owner):
        print(f"Getting {self.__class__.__name__}")
        return instance.__dict__.get(self.attrname)

    def __set__(self, instance, value):
        print(f"Setting {self.__class__.__name__}")
        instance.__dict__[self.attrname] = value

    def __delete__(self, instance):
        print(f"Deleting {self.__class__.__name__}")
        del instance.__dict__[self.attrname]

    def __set_name__(self, owner, name):
        self.attrname = name
```

在这个例子中，我们定义了一个名为 Descriptor 的描述器类，它有三个方法：`__get__`、`__set__` 和 `__delete__`。当我们在另一个类中使用这个描述器时，这些方法将被调用，以控制该类的属性的访问和修改。

要使用这个描述器，我们可以在另一个类中将其定义为一个类属性：

```python
class MyClass:
    x = Descriptor()
```

现在，我们可以创建一个 MyClass 对象并访问其属性：

```python
>>> obj = MyClass()
>>> obj.x = 1
Setting Descriptor
>>> obj.x
Getting Descriptor
1
>>> del obj.x
Deleting Descriptor
>>> obj.x
Getting Descriptor

```

在这个例子中，我们首先创建了一个 MyClass 对象，并将其 x 属性设置为 1。然后，我们再次访问 x 属性时，会调用 `__get__` 方法并返回 1。最后，我们删除了 x 属性，并再次访问它时，会调用 `__get__` 方法并返回 None。从上面的输出结果可以看到对应的方法都被调用了，这是符合上面对描述器的定义的。如果一个类对象不是描述器，那么在使用对应的属性的时候是不会调用`__get__`、`__set__` 和 `__delete__`三个方法的，。比如下面的代码：

```python

class NonDescriptor(object):
    pass


class MyClass():

    nd = NonDescriptor()


if __name__ == '__main__':
    a = MyClass()
    print(a.nd)
```

上面的代码输出结果如下所示：

```python
<__main__.NonDescriptor object at 0x1012cce20>
```

从上面程序的输出结果可以知道，当使用一个非描述器的类属性的时候是不会调用对应的方法的，而是直接得到对应的对象。

## 描述器的实现原理

描述器的实现原理可以用以下三个步骤来概括：

- 当一个类的属性被访问时，Python 解释器会检查该属性是否是一个描述器。如果是，它会调用描述器的 `__get__` 方法，并将该类的实例作为第一个参数，该实例所属的类作为第二个参数，并将属性名称作为第三个参数传递给 `__get__` 方法。
- 当一个类的属性被设置时，Python 解释器会检查该属性是否是一个描述器。如果是，它会调用描述器的 `__set__` 方法，并将该类的实例作为第一个参数，设置的值作为第二个参数，并将属性名称作为第三个参数传递给 `__set__` 方法。

- 当一个类的属性被删除时，Python 解释器会检查该属性是否是一个描述器。如果是，它会调用描述器的 `__delete__` 方法，并将该类的实例作为第一个参数和属性名称作为第二个参数传递给 `__delete__` 方法。

在描述器的实现中，通常还会使用 `__set_name__` 方法来在描述器被绑定到类属性时设置属性名称。这使得描述器可以在被多个属性使用时，正确地识别每个属性的名称。

现在来仔细了解一下上面的几个函数的参数，我们以下面的代码为例子进行说明：

```python


class Descriptor(object):

    def __set_name__(self, obj_type, attr_name):
        print(f"__set_name__ : {obj_type } {attr_name = }")
        return "__set_name__"

    def __get__(self, obj, obj_type):
        print(f"__get__ : {obj = } { obj_type = }")
        return "__get__"

    def __set__(self, instance, value):
        print(f"__set__ : {instance = } {value = }")
        return "__set__"

    def __delete__(self, obj):
        print(f"__delete__ : {obj = }")
        return "__delete__"


class MyClass(object):

    des = Descriptor()


if __name__ == '__main__':
    a = MyClass()
    _ = MyClass.des
    _ = a.des
    a.des = "hello"
    del a.des

```

上面的代码输入结果如下所示：

```bash
__set_name__ : <class '__main__.MyClass'> attr_name = 'des'
__get__ : obj = None  obj_type = <class '__main__.MyClass'>
__get__ : obj = <__main__.MyClass object at 0x1054abeb0>  obj_type = <class '__main__.MyClass'>
__set__ : instance = <__main__.MyClass object at 0x1054abeb0> value = 'hello'
__delete__ : obj = <__main__.MyClass object at 0x1054abeb0>
```

- `__set_name__` 这个函数一共有两个参数传入的参数第一个参数是使用描述器的类，第二个参数是使用这个描述器的类当中使用的属性名字，在上面的例子当中就是 "des" 。
- `__get__`，这个函数主要有两个参数，一个是使用属性的对象，另外一个是对象的类型，如果是直接使用类名使用属性的话，obj 就是 None，比如上面的 MyClass.des 。
- `__set__`，这个函数主要有两个参数一个是对象，另外一个是需要设置的值。
- `__delete__`，这函数有一个参数，就是传入的对象，比如 del a.des 传入的就是对象 a 。

## 描述器的应用场景

描述器在 Python 中有很多应用场景。以下是其中的一些示例：

### 实现属性访问控制

通过使用描述器，可以实现对类属性的访问控制，例如只读属性、只写属性、只读/只写属性等。通过在 `__get__` 和 `__set__` 方法中添加相应的访问控制逻辑，可以限制对类属性的访问和修改。

```python
class ReadOnly:
    def __init__(self, value):
        self._value = value
    
    def __get__(self, instance, owner):
        return self._value
    
    def __set__(self, instance, value):
        raise AttributeError("Read only attribute")
        
class MyClass:
    read_only_prop = ReadOnly(42)
    writeable_prop = None
    
my_obj = MyClass()
print(my_obj.read_only_prop)  # 42
my_obj.writeable_prop = "hello"
print(my_obj.writeable_prop)  # hello
my_obj.read_only_prop = 100  # raises AttributeError
```

在上面的例子中，`ReadOnly` 描述器只实现了 `__get__` 方法，而 `__set__` 方法则抛出了 `AttributeError` 异常，从而实现了只读属性的访问控制。

### 实现数据验证和转换

描述器还可以用于实现数据验证和转换逻辑。通过在 `__set__` 方法中添加数据验证和转换逻辑，可以确保设置的值符合某些特定的要求。例如，可以使用描述器来确保设置的值是整数、在某个范围内、符合某个正则表达式等。

```python
class Bounded:
    def __init__(self, low, high):
        self._low = low
        self._high = high
    
    def __get__(self, instance, owner):
        return self._value
    
    def __set__(self, instance, value):
        if not self._low <= value <= self._high:
            raise ValueError(f"Value must be between {self._low} and {self._high}")
        self._value = value

class MyClass:
    bounded_prop = Bounded(0, 100)

my_obj = MyClass()
my_obj.bounded_prop = 50
print(my_obj.bounded_prop)  # 50
my_obj.bounded_prop = 200  # raises ValueError
```

在上面的例子中，`Bounded` 描述器在 `__set__` 方法中进行了数值范围的检查，如果值不在指定范围内，则抛出了 `ValueError` 异常。

### 实现延迟加载和缓存

描述器还可以用于实现延迟加载和缓存逻辑。通过在 `__get__` 方法中添加逻辑，可以实现属性的延迟加载，即当属性第一次被访问时才进行加载。此外，还可以使用描述器来实现缓存逻辑，以避免重复计算。

```python
class LazyLoad:
    def __init__(self, func):
        self._func = func

    def __get__(self, instance, owner):
        if instance is None:
            return self
        value = self._func(instance)
        setattr(instance, self._func.__name__, value)
        return value


class MyClass:
    def __init__(self):
        self._expensive_data = None

    @LazyLoad
    def expensive_data(self):
        print("Calculating expensive data...")
        self._expensive_data = [i ** 2 for i in range(10)]
        return self._expensive_data


my_obj = MyClass()
print(my_obj.expensive_data)  # Calculating expensive data... 
print(my_obj.expensive_data)
```

上面的程序的输出结果如下所示：

```bash
Calculating expensive data...
[0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
[0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

从上面的结果可以看到，只有在第一次使用属性的时候才调用函数，后续再次调用函数将不会再调用函数而是直接返回缓存的结果。

### 实现 ORM 映射

ORM 的主要作用是把数据库中的关系数据转化为面向对象的数据，让开发者可以通过编写面向对象的代码来操作数据库。ORM 技术可以把面向对象的编程语言和关系数据库之间的映射关系抽象出来，开发者可以不用写 SQL 语句，而是直接使用面向对象的语法进行数据库操作。

我们现在需要实现一个功能，user.name 直接从数据库的 user 表当中查询 name 等于 user.name 的数据，user.name = "xxx" 根据 user 的主键 id 进行更新数据。这个功能我们就可以使用描述器实现，因为只需要了解如何使用描述器的，因此在下面的代码当中并没有连接数据库：

```python

conn = dict()


class Field:

    def __set_name__(self, owner, name):
        self.fetch = f'SELECT {name} FROM {owner.table} WHERE {owner.key}=?;'
        print(f"{self.fetch = }")
        self.store = f'UPDATE {owner.table} SET {name}=? WHERE {owner.key}=?;'
        print(f"{self.store = }")

    def __get__(self, obj, objtype=None):
        return conn.execute(self.fetch, [obj.key]).fetchone()[0]

    def __set__(self, obj, value):
        conn.execute(self.store, [value, obj.key])
        conn.commit()


class User:
    table = 'User'                    # Table name
    key = 'id'                       # Primary key
    name = Field()
    age = Field()

    def __init__(self, key):
        self.key = key


if __name__ == '__main__':
    u = User("Bob")
```

上面的程序输出结果如下所示：

```bash
self.fetch = 'SELECT name FROM User WHERE id=?;'
self.store = 'UPDATE User SET name=? WHERE id=?;'
self.fetch = 'SELECT age FROM User WHERE id=?;'
self.store = 'UPDATE User SET age=? WHERE id=?;
```

从上面的输出结果我们可以看到针对 name 和 age 两个字段的查询和更新语句确实生成了，当我们调用 u.name = xxx 或者 u.age = xxx 的时候就执行 `__set__` 函数，就会连接数据库进行相应的操作了。

## 总结

在本篇文章当中主要给大家介绍了什么是描述器以及我们能够使用描述器来实现什么样的功能，事实上 python 是一个比较随意的语言，因此我们可以利用很多有意思的语法做出黑多黑科技。python 语言本身也利用描述器实现了很多有意思的功能，比如 property、staticmethod 等等，这些内容我们在后面的文章当中再进行分析。

---

本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。

![](../qrcode2.jpg)

