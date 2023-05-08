# 深入理解 python 虚拟机：描述器的王炸应用

在本篇文章当中主要给大家介绍描述器在 python 语言当中有哪些应用，主要介绍如何使用 python 语言实现 python 内置的 proterty 、staticmethod 和 class method 。

## property

当你在编写Python代码时，你可能会遇到一些需要通过方法来访问或设置的属性。Python中的 property 装饰器提供了一种优雅的方式来处理这种情况，允许你将这些方法封装为属性，从而使代码更加简洁和易于阅读。在本文中，我将向你介绍 property 装饰器的工作原理以及如何在你的代码中使用它。

### 什么是 property？

Python 中的 property 是一种装饰器，它允许你定义一个方法，使其看起来像一个属性。换句话说，property 允许你以属性的方式访问或设置类的数据成员，而不必直接调用一个方法。

在 Python 中，属性通常是一个对象的数据成员，它们可以通过直接访问对象来获取或设置。然而，有时候你可能需要在获取或设置属性时执行某些额外的操作，例如进行类型检查、范围检查或计算属性等。在这种情况下，使用 property 装饰器可以让你以属性的方式访问或设置这些属性，并在访问或设置时执行额外的操作。

### 如何使用 property？

让我们看一个简单的例子，假设你正在编写一个表示矩形的类，并且你想要在计算矩形的面积时执行一些额外的操作。你可以使用 property 装饰器来实现这个功能，如下所示：

```python
class Rectangle:
    def __init__(self, width, height):
        self._width = width
        self._height = height
    
    @property
    def width(self):
        return self._width
    
    @width.setter
    def width(self, value):
        if value <= 0:
            raise ValueError("Width must be positive")
        self._width = value
    
    @property
    def height(self):
        return self._height
    
    @height.setter
    def height(self, value):
        if value <= 0:
            raise ValueError("Height must be positive")
        self._height = value
    
    @property
    def area(self):
        return self._width * self._height
```

在这个示例中，我们使用 property 装饰器定义了三个属性：width、height和area。每个属性都有一个 getter 方法和一个 setter 方法，它们分别负责获取和设置属性的值。当你使用类的实例访问这些属性时，你会发现它们似乎就像是一个普通的属性，而不是一个方法。

注意，getter 方法没有参数，而 setter 方法接受一个参数。当你通过类的实例访问属性时，你只需要使用点运算符即可访问这些属性，就像这样：

```python
rect = Rectangle(10, 20)
print(rect.width)
print(rect.height)
print(rect.area)
```

输出结果：

```bash
10
20
200
```

你也可以像下面这样设置属性的值：

```python
rect.width = 5
rect.height = 10
print(rect.width)
print(rect.height)
print(rect.area)
```

输出结果如下所示：

```basj
5
10
50
```

在设置 width 或 height 属性的值时，会执行对应的 setter 方法进行类型检查和范围检查。如果值不符合要求，将会抛出一个 ValueError 异常。这使得你的代码更加健壮和可靠。

除了在属性的 getter 和 setter 方法中执行额外的操作外，你还可以使用 property 装饰器计算属性。计算属性是指，当你访问属性时，它不是从类的实例中获取数据，而是基于类的其他数据成员进行计算。例如，如果你有一个表示温度的类，你可以定义一个计算属性，用于将摄氏度转换为华氏度，如下所示：

```python
class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius
    
    @property
    def celsius(self):
        return self._celsius
    
    @celsius.setter
    def celsius(self, value):
        self._celsius = value
    
    @property
    def fahrenheit(self):
        return (self._celsius * 9/5) + 32
```

在这个示例中，我们定义了一个 Temperature 类，它包含一个 celsius 属性和一个 fahrenheit 属性。celsius 属性是一个普通的属性，可以直接访问和设置。而 fahrenheit 属性是一个计算属性，它基于 celsius 属性计算而来。当你访问 fahrenheit 属性时，它将自动计算出相应的华氏度并返回。你可以会对上面的代码有点疑惑`celsius.setter` 是什么，他是那里来的，事实上在它上面的 `@property` 执行之后 celsius 已经不再是一个函数了，而是一个 property 的类产生的对象了，因此 `celsius.setter` 是 property 类中的 `setter` 属性了，事实上他是一个类的方法了，而装饰器 `@celsius.setter` 就是将 `def celsius(self, value)` 这个函数作为参数传递给方法 `celsius.setter`。

我们介绍了 Python 中的 property 装饰器，它允许你将方法封装为属性，并在访问或设置属性时执行额外的操作。通过使用 property 装饰器，你可以编写更加简洁、优雅和可读的代码，同时使代码更加健壮和可靠。

### property 的本质

property 是 python 内置的一个类，注意它是类。在前面的内容当中我们已经详细讨论过了装饰器的原理，并且从字节码的角度进行了分析。因此我们可以很容易理解上面 `Temperature` 类。我们可以将装饰器展开：

```python
class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    def celsius1(self):
        return self._celsius

    celsius = property(celsius1)

    def celsius2(self, value):
        self._celsius = value

    celsius = celsius.setter(celsius2)

    def fahrenheit(self):
        return (self._celsius * 9 / 5) + 32

    fahrenheit = property(fahrenheit)


if __name__ == '__main__':
    t = Temperature(10)
    print(t.celsius)
    t.celsius = 100
    print(t.celsius)
    print(t.fahrenheit)
```

上面的程序输出结果如下所示：

```bash
10
100
212.0
```

可以看到上面的程序正确的输出了结果，符合我们对与 property 的理解和使用。从上面的分析我们可以看到 property 本质就是一个 python 的类，因此我可以完全自己实现一个和内置的 property 类相同功能的类，具体的代码如下所示：

```python
class Property:
    "Emulate PyProperty_Type() in Objects/descrobject.c"

    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel
        if doc is None and fget is not None:
            doc = fget.__doc__
        self.__doc__ = doc
        self._name = ''

    def __set_name__(self, owner, name):
        self._name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if self.fget is None:
            raise AttributeError(f"property '{self._name}' has no getter")
        return self.fget(obj)

    def __set__(self, obj, value):
        if self.fset is None:
            raise AttributeError(f"property '{self._name}' has no setter")
        self.fset(obj, value)

    def __delete__(self, obj):
        if self.fdel is None:
            raise AttributeError(f"property '{self._name}' has no deleter")
        self.fdel(obj)

    def getter(self, fget):
        prop = type(self)(fget, self.fset, self.fdel, self.__doc__)
        prop._name = self._name
        return prop

    def setter(self, fset):
        prop = type(self)(self.fget, fset, self.fdel, self.__doc__)
        prop._name = self._name
        return prop

    def deleter(self, fdel):
        prop = type(self)(self.fget, self.fset, fdel, self.__doc__)
        prop._name = self._name
        return prop
```

现在对上面我们自己实现的类对象进行使用测试：

```python
class Rectangle:
    def __init__(self, width, height):
        self._width = width
        self._height = height

    @Property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        if value <= 0:
            raise ValueError("Width must be positive")
        self._width = value

    @Property
    def height(self):
        return self._height

    @height.setter
    def height(self, value):
        if value <= 0:
            raise ValueError("Height must be positive")
        self._height = value

    @Property
    def area(self):
        return self._width * self._height


if __name__ == '__main__':
    rect = Rectangle(10, 20)
    print(rect.width)
    print(rect.height)
    print(rect.area)

    rect.width = 5
    rect.height = 10
    print(rect.width)
    print(rect.height)
    print(rect.area)
```

上面的程序输出结果如下所示：

```python
10
20
200
5
10
50
```

可以看到正确的输出了结果。

现在我们来好好分析一下我们在上面使用到的自己实现的 `Property` 类是如何被调用的，在前面的内容当中我们已经讨论过了，只有类属性才可能是描述器，我们在使用 `@Property` 的时候是获取到对应的函数，更准确的说是获得对象的 get 函数，然后使用 `@Property` 的类当中的原来的函数就变成了 `Property` 对象了，后面就可以使用对象的 `setter` 方法了。

然后在使用 `rect.width` 或者 `rect.height` 方法的时候就活触发描述器的机制， rect 对象就会被传入到描述器的 `__get__`方法，然后在这个方法当中将传入的对象再传给之前得到的 `fget` 函数，就完美的实现了这个机制。

