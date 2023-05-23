# 深入理解 python 虚拟机：花里胡哨的魔术方法

在本篇文章当中主要给大家介绍在 cpython 当中一些比较花里胡哨的魔术方法，以帮助我们自己实现比较花哨的功能，当然这其中也包含一些也非常实用的魔术方法。

## 深入分析 hash 方法

在 Python 中，`__hash__()` 方法是一种特殊方法（也称为魔术方法或双下划线方法），用于返回对象的哈希值。哈希值是一个整数，用于在字典（`dict`）和集合（`set`）等数据结构中进行快速查找和比较。`__hash__()` 方法在创建自定义的可哈希对象时非常有用，例如自定义类的实例，以便可以将这些对象用作字典的键或集合的元素。

下面是一些需要注意的问题和示例来帮助理解 `__hash__()` 方法：

- 如果两个对象相等（根据 `__eq__()` 方法的定义），它们的哈希值应该相等。即，如果 `a == b` 为真，则 `hash(a) == hash(b)` 也为真，这一点非常重要，因为我们在使用集合和字典的时候，就需要保证容器当中每种对象只能够有一个，如果不满足这个条还的话，那么就可能会导致同一种对象在容器当中会存在多个。
- 重写 `__hash__()` 方法通常需要同时重写 `__eq__()` 方法，以确保对象的相等性和哈希值的一致性。
- 如果对象没有定义 `__eq__`方法，那么也不要定义 `__hash__`方法，因为如果遇到哈希值相等的对象时候，如果无法对两个对象进行比较的话，那么也会导致容易当中有多个相同的对象。

```python
import random


class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def __eq__(self, other):
        return self.name == other.name and self.age == other.age

    def __hash__(self):
        return hash((self.name, self.age)) + random.randint(0, 1024)

    def __repr__(self):
        return f"[name={self.name}, age={self.age}]"


person1 = Person("Alice", 25)
person2 = Person("Alice", 25)


print(hash(person1))  
print(hash(person2))  


container = set()
container.add(person1)
container.add(person2)
print(container)
```

在上面代码当中我们重写了 `__hash__` 函数，但是对象的哈希值每次调用的时候我们都加入一个随机数，因此即使 name 和 age 都相等，如果 hash 值不想等，那么可能会造成容器当中存在多个相同的对象，上面的代码就会造成相同的对象，上面的程序输出结果如下所示：

```bash
1930083569156318318
1930083569156318292
{[name=Alice, age=25], [name=Alice, age=25]}
```

如果重写上面的类对象：

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def __eq__(self, other):
        return self.name == other.name and self.age == other.age

    def __hash__(self):
        return hash((self.name, self.age))

    def __repr__(self):
        return f"[name={self.name}, age={self.age}]"
```

那么容器器当中只会有一个对象。

如果我们只重写了 `__hash__`方法的时候也会造成容器当中有多个相同的对象。

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    # def __eq__(self, other):
    #     return self.name == other.name and self.age == other.age

    def __hash__(self):
        return hash((self.name, self.age)) # + random.randint(0, 1024)

    def __repr__(self):
        return f"[name={self.name}, age={self.age}]"
```

这是因为如果哈希值相同的时候还需要在比较两个对象是否相等，如果相等那么就不需要将这个对象保存到容器当中，如果不相等那么将会将这个对象加入到容器当中。

## bool 方法

在 Python 中，`object.__bool__()` 方法是一种特殊方法，用于定义对象的布尔值。它在使用布尔运算符（如 `if` 语句和逻辑运算）时自动调用。`__bool__()` 方法应该返回一个布尔值，表示对象的真值。如果 `__bool__()` 方法未定义，Python 将尝试调用 `__len__()` 方法来确定对象的真值。如果 `__len__()` 方法返回零，则对象被视为假；否则，对象被视为真。

下面是一些需要注意的事项来帮助理解 `__bool__()` 方法：

- `__bool__()` 方法在对象被应用布尔运算时自动调用。例如，在 `if` 语句中，对象的真值由 `__bool__()` 方法确定。
- `__bool__()` 方法应该返回一个布尔值（`True` 或 `False`）。
- 如果 `__bool__()` 方法未定义，Python 将尝试调用 `__len__()` 方法来确定对象的真值。
- 当对象的长度为零时，即 `__len__()` 方法返回零，对象被视为假；否则，对象被视为真。
- 如果既未定义 `__bool__()` 方法，也未定义 `__len__()` 方法，则对象默认为真。

下面是一个示例，展示了如何在自定义类中使用 `__bool__()` 方法：

```python
class NonEmptyList:
    def __init__(self, items):
        self.items = items
    
    def __bool__(self):
        return len(self.items) > 0

my_list = NonEmptyList([1, 2, 3])

if my_list:
    print("The list is not empty.")
else:
    print("The list is empty.")
```

## 对象的属性访问

在Python中，我们可以通过一些特殊方法来定制属性访问的行为。本文将深入介绍这些特殊方法，包括`__getitem__()`、`__setitem__()`、`__delitem__()`和`__getattr__()`方法，以帮助更好地理解属性访问的机制和应用场景。

`__getitem__()`方法是用于索引操作的特殊方法。当我们通过索引访问对象的属性时，Python会自动调用该方法，并传入索引值作为参数。我们可以在该方法中实现对属性的获取操作，并返回相应的值。

```python
class MyList:
    def __init__(self):
        self.data = []
    
    def __getitem__(self, index):
        return self.data[index]

my_list = MyList()
my_list.data = [1, 2, 3]

print(my_list[1])  # 输出: 2
```

在上面的例子中，我们定义了一个名为MyList的类，它具有一个属性data，该属性是一个列表。通过重写__getitem__()方法，我们使得可以通过索引来访问MyList对象的data属性。当我们使用my_list[1]的形式进行索引操作时，Python会自动调用__getitem__()方法，并将索引值1作为参数传递给该方法。

`__setitem__()`方法用于属性的设置操作，即通过索引为对象的属性赋值。当我们使用索引操作并赋值给对象的属性时，Python会自动调用`__setitem__()`方法，并传入索引值和赋值的值作为参数。

```python
class MyList:
    def __init__(self):
        self.data = [0 for i in range(2)]

    def __setitem__(self, index, value):
        self.data[index] = value


my_list = MyList()

my_list[0] = 1
my_list[1] = 2

print(my_list.data)  # 输出: [1, 2]
```

在上述示例中，我们重写了`__setitem__()`方法来实现对对象属性的设置操作。当我们执行my_list[0] = 1和my_list[1] = 2的赋值操作时，Python会自动调用`__setitem__()`方法，并将索引值和赋值的值传递给该方法。在`__setitem__()`方法中，我们将值赋给了对象的data属性的相应索引位置。

`__delitem__()`方法用于删除对象属性的特殊方法。当我们使用del语句删除对象属性时，Python会自动调用`__delitem__()`方法，并传入要删除的属性的索引值作为参数。

```python
class MyDict:
    
    def __init__(self):
        self.data = dict()

    def __delitem__(self, key):
        print("In __delitem__")
        del self.data[key]


obj = MyDict()
obj.data["key"] = "val"
del obj["key"] # 输出 In __delitem__
```

`__getattr__()` 是一个特殊方法，用于在访问不存在的属性时自动调用。它接收一个参数，即属性名，然后返回相应的值或引发 `AttributeError` 异常。

```python
class MyClass:
    def __getattr__(self, name):
        if name == 'color':
            return 'blue'
        else:
            raise AttributeError(f"'MyClass' object has no attribute '{name}'")

my_obj = MyClass()
print(my_obj.color)  # 输出: blue
print(my_obj.size)   # 引发 AttributeError: 'MyClass' object has no attribute 'size'
```

在上面的示例中，当访问 `my_obj.color` 时，由于 `color` 属性不存在，Python 会自动调用 `__getattr__()` 方法，并返回预定义的值 `'blue'`。而当访问 `my_obj.size` 时，由于该属性也不存在，`__getattr__()` 方法会引发 `AttributeError` 异常。

`__setattr__()` 是一个特殊方法，用于在设置属性值时自动调用。它接收两个参数，即属性名和属性值。我们可以在该方法中对属性进行处理、验证或记录。

```python
class MyClass:
    def __init__(self):
        self.color = 'red' # 输出：Setting attribute 'color' to 'red'

    def __setattr__(self, name, value):
        print(f"Setting attribute '{name}' to '{value}'")
        super().__setattr__(name, value)


my_obj = MyClass()
my_obj.color = 'blue'  # 输出: Setting attribute 'color' to 'blue'
```

当我们使用 . 的方式去访问对象属性的时候，首先会调用对象的 `__getattribute__` 函数，如果属性不存在才会调用 `__getattr__`。当 `__getattribute__` 方法无法找到指定的属性时，Python 会调用 `__getattr__` 方法。以下是在之前的示例类 `CustomClass` 上添加 `__getattr__` 方法的代码：

```python
class CustomClass:
    def __init__(self):
        self.attribute = "Hello, world!"

    def __getattribute__(self, name):
        print(f"Accessing attribute: {name}")
        return super().__getattribute__(name)

    def __getattr__(self, name):
        print(f"Attribute {name} not found")
        return None
```

在这个示例中，我们在 `CustomClass` 中添加了 `__getattr__` 方法。当 `__getattribute__` 方法无法找到指定的属性时，会自动调用 `__getattr__` 方法，并打印出属性名称 "attribute" 以及未找到属性的提示信息。

我们执行下面的代码：

```python
obj = CustomClass()
print(obj.attribute)
print(obj.nonexistent_attribute)
```

输出结果如下所示：

```bash
Accessing attribute: attribute
Hello, world!
Accessing attribute: nonexistent_attribute
Attribute nonexistent_attribute not found
None
```

首先，我们访问存在的属性 `attribute`，此时 `__getattribute__` 方法被调用，并打印出属性名称 "attribute"，然后返回属性的实际值 "Hello, world!"。接着，我们尝试访问不存在的属性 `nonexistent_attribute`，由于 `__getattribute__` 方法无法找到该属性，因此会调用 `__getattr__` 方法，并打印出属性名称 "nonexistent_attribute" 以及未找到属性的提示信息，然后返回 `None`。