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



