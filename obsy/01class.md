# 深入理解python虚拟机：黑科技的幕后英雄——描述器

在本篇文章当中主要给大家介绍一个我们在使用类的时候经常使用但是却很少在意的黑科技——描述器，在本篇文章当中主要分析描述器的原理，以及看看他能够实现什么功能！



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

    def __get__(self, obj, obj_type):
        print(f"__get__ : {obj = } { obj_type = }")
        return getattr(obj, "value", None)

    def __set__(self, instance, value):
        print(f"__set__ : {instance = } {value = }")
        self.value = value

    def __delete__(self, obj):
        print(f"__delete__ : {obj = }")


class MyClass(object):

    des = Descriptor()


if __name__ == '__main__':
    a = MyClass()
    print(a.des)
    print(MyClass.des)
    a.des = "hello"
    del a.des
```

上面的代码输入结果如下所示：

```bash
__set_name__ : <class '__main__.MyClass'> attr_name = 'des'
__get__ : obj = <__main__.MyClass object at 0x10133df70>  obj_type = <class '__main__.MyClass'>
None
__get__ : obj = None  obj_type = <class '__main__.MyClass'>
None
__set__ : instance = <__main__.MyClass object at 0x10133df70> value = 'hello'
__delete__ : obj = <__main__.MyClass object at 0x10133df70>
```



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

### 实现属性别名

描述器还可以用于实现属性别名。通过定义一个获取方法和一个设置方法，可以将一个属性绑定到另一个属性上。这使得可以在代码中使用不同的属性名称来访问相同的数据。

### 实现类属性的默认值

描述器还可以用于实现类属性的默认值。通过在 `__get__` 方法中添加逻辑，可以在属性第一次被访问时设置默认值。这使得可以在属性被访问之前，确保其具有某些默认值。

