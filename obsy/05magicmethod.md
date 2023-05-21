# 深入理解 python 虚拟机：魔术方法之数学计算

在本篇文章当中主要给大家介绍在 python 当中一些常见的魔术方法，本篇文章主要是关于与数学计算相关的一些魔术方法，在很多科学计算的包当中都使用到了这些魔术方法。

## 大小比较

当我们在Python中定义自己的类时，可以通过重写一些特殊方法来改变对象的比较行为。这些特殊方法包括`__lt__`、`__le__`、`__eq__`、`__ne__`、`__gt__`和`__ge__`，它们分别对应于小于、小于等于、等于、不等于、大于和大于等于的比较运算符。这些方法允许我们自定义对象之间的比较规则。

下面是对每个方法的详细介绍：

- `object.__lt__(self, other)` 这个方法用于定义小于（<）运算符的行为。当我们使用小于运算符比较两个对象时，会调用该方法。如果`self`对象小于`other`对象，则返回`True`，否则返回`False`。
- `object.__le__(self, other)` 这个方法用于定义小于等于（<=）运算符的行为。当我们使用小于等于运算符比较两个对象时，会调用该方法。如果`self`对象小于等于`other`对象，则返回`True`，否则返回`False`。
- `object.__eq__(self, other)` 这个方法用于定义等于（==）运算符的行为。当我们使用等于运算符比较两个对象时，会调用该方法。如果`self`对象等于`other`对象，则返回`True`，否则返回`False`。
- `object.__ne__(self, other)` 这个方法用于定义不等于（!=）运算符的行为。当我们使用不等于运算符比较两个对象时，会调用该方法。如果`self`对象不等于`other`对象，则返回`True`，否则返回`False`。
- `object.__gt__(self, other)` 这个方法用于定义大于（>）运算符的行为。当我们使用大于运算符比较两个对象时，会调用该方法。如果`self`对象大于`other`对象，则返回`True`，否则返回`False`。
- `object.__ge__(self, other)` 这个方法用于定义大于等于（>=）运算符的行为。当我们使用大于等于运算符比较两个对象时，会调用该方法。如果`self`对象大于等于`other`对象，则返回`True`，否则返回`False`。

这些比较方法允许我们根据自己的需求自定义对象的比较规则。当我们使用比较运算符对对象进行比较时，Python会自动调用这些方法，并返回相应的结果。

下面是一个简单的示例，展示如何在自定义类中使用这些比较方法：

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __lt__(self, other):
        return self.x < other.x and self.y
        return self.y < other.y
    
    def __le__(self, other):
        return self.x <= other.x and self.y <= other.y
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
    
    def __ne__(self, other):
        return not self.__eq__(other)
    
    def __gt__(self, other):
        return self.x > other.x and self.y > other.y
    
    def __ge__(self, other):
        return self.x >= other.x and self.y >= other.y


p1 = Point(1, 2)
p2 = Point(3, 4)


print(p1 < p2)  
print(p1 <= p2)
print(p1 == p2)
print(p1 != p2)
print(p1 > p2)
print(p1 >= p2)
```

上面的代码输出结果如下所示：

```bash
2
True
False
True
False
False
```

在上面的示例中，我们定义了一个名为`Point`的类，它表示一个二维平面上的点。我们重写了`__lt__`、`__le__`、`__eq__`、`__ne__`、`__gt__`和`__ge__`方法来定义点之间的比较规则。根据我们的定义，如果一个点的`x`坐标和`y`坐标都小于另一个点的相应坐标，则我们认为前一个点小于后一个点。

通过创建两个`Point`对象并使用比较运算符进行比较，我们可以看到根据我们的定义，比较运算符返回了预期的结果。

## 模拟设计一个数学类型

当我们在Python中定义自己的类时，可以通过重写一些特殊方法来改变对象的算术运算行为。这些特殊方法包括`__add__`、`__sub__`、`__mul__`、`__matmul__`、`__truediv__`、`__floordiv__`、`__mod__`、`__divmod__`、`__pow__`、`__lshift__`、`__rshift__`、`__and__`、`__xor__`和`__or__`，它们分别对应于加法、减法、乘法、矩阵乘法、真除法、整除法、取模运算、divmod函数、幂运算、左移位、右移位、按位与、按位异或和按位或的运算符。这些方法允许我们自定义对象之间的算术运算规则。

- `object.__add__(self, other)` 这个方法用于定义加法（+）运算符的行为。当我们使用加法运算符对两个对象进行相加时，会调用该方法。它返回两个对象相加的结果。
- `object.__sub__(self, other)` 这个方法用于定义减法（-）运算符的行为。当我们使用减法运算符对两个对象进行相减时，会调用该方法。它返回两个对象相减的结果。
- `object.__mul__(self, other)` 这个方法用于定义乘法（*）运算符的行为。当我们使用乘法运算符对两个对象进行相乘时，会调用该方法。它返回两个对象相乘的结果。
- `object.__matmul__(self, other)` 这个方法用于定义矩阵乘法（@）运算符的行为。当我们使用矩阵乘法运算符对两个对象进行矩阵乘法时，会调用该方法。它返回两个对象的矩阵乘法结果。
- `object.__truediv__(self, other)` 这个方法用于定义真除法（/）运算符的行为。当我们使用真除法运算符对两个对象进行相除时，会调用该方法。它返回两个对象相除的结果。
- `object.__floordiv__(self, other)` 这个方法用于定义整除法（//）运算符的行为。当我们使用整除法运算符对两个对象进行相除并取整时，会调用该方法。它返回两个对象相除取整的结果。
- `object.__mod__(self, other)` 这个方法用于定义取模（%）运算符的行为。当我们使用取模运算符对两个对象进行取模运算时，会调用该方法。它返回两个对象取模运算的结果。
- `object.__divmod__(self, other)`这个方法用于定义divmod函数的行为。divmod函数接受两个参数，并返回一个包含商和余数的元组。当我们对两个对象使用divmod函数时，会调用该方法。它返回一个包含两个对象的商和余数的元组。
- `object.__pow__(self, other[, modulo])` 这个方法用于定义幂运算（**）运算符的行为。当我们使用幂运算符对两个对象进行幂运算时，会调用该方法。它返回两个对象的幂运算结果。可选的`modulo`参数用于指定取模运算的模数。
- `object.__lshift__(self, other)` 这个方法用于定义左移位（<<）运算符的行为。当我们对一个对象使用左移位运算符时，会调用该方法。它返回对象左移指定位数后的结果。
- `object.__rshift__(self, other)` 这个方法用于定义右移位（>>）运算符的行为。当我们对一个对象使用右移位运算符时，会调用该方法。它返回对象右移指定位数后的结果。
- `object.__and__(self, other)` 这个方法用于定义按位与（&）运算符的行为。当我们对两个对象使用按位与运算符时，会调用该方法。它返回两个对象按位与的结果。
- `object.__xor__(self, other)` 这个方法用于定义按位异或（^）运算符的行为。当我们对两个对象使用按位异或运算符时，会调用该方法。它返回两个对象按位异或的结果。
- `object.__or__(self, other)` 这个方法用于定义按位或（|）运算符的行为。当我们对两个对象使用按位或运算符时，会调用该方法。它返回两个对象按位或的结果。

通过重写这些方法，我们可以在自定义类中定义对象之间的算术运算规则。当我们使用相应的算术运算符或函数对对象进行操作时，Python会自动调用这些方法，并返回相应的结果。

下面是一个简单的示例，展示如何在自定义类中使用这些算术方法：

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar):
        return Vector(self.x * scalar, self.y * scalar)

    def __truediv__(self, scalar):
        return Vector(self.x / scalar, self.y / scalar)

    def __repr__(self):
        return f"Vector[{self.x}, {self.y}]"


# 创建两个 Vector 对象
v1 = Vector(1, 2)
v2 = Vector(3, 4)

# 使用算术运算符进行操作
v3 = v1 + v2
v4 = v1 - v2

v5 = v1 * 2
v6 = v2 / 3

print(f"{v1 = }")
print(f"{v2 = }")
print(f"{v3 = }")
print(f"{v4 = }")
print(f"{v5 = }")
print(f"{v6 = }")
```

上面的代码输出结果如下所示：

```bash
v1 = Vector[1, 2]
v2 = Vector[3, 4]
v3 = Vector[4, 6]
v4 = Vector[-2, -2]
v5 = Vector[2, 4]
v6 = Vector[1.0, 1.3333333333333333]
```

在上面的示例中，我们定义了一个名为`Vector`的类，它表示二维向量。我们重写了`__add__`、`__sub__`、`__mul__`和`__truediv__`方法来定义向量之间的加法、减法、乘法和真除法的规则。根据我们的定义，向量的加法是将对应的分量相加，向量的减法是将对应的分量相减，向量的乘法是将每个分量与标量相乘，向量的真除法是将每个分量除以标量。通过创建两个`Vector`对象并使用算术运算符进行操作，我们可以看到根据我们的定义，算术运算符返回了预期的结果。



当我们在Python中定义自己的类时，除了重写一些魔术方法来改变对象的算术运算行为之外，还可以重写对应的反向魔术方法来处理反向运算。这些反向魔术方法以`__r`开头，后面跟着对应的运算符，例如`__radd__`、`__rsub__`、`__rmul__`等。它们用于在无法直接对另一个对象调用相应的魔术方法时，尝试使用当前对象的魔术方法来处理反向运算。主要有下面的方法：

```python
object.__iadd__(self, other)
object.__isub__(self, other)
object.__imul__(self, other)
object.__imatmul__(self, other)
object.__itruediv__(self, other)
object.__ifloordiv__(self, other)
object.__imod__(self, other)
object.__ipow__(self, other[, modulo])
object.__ilshift__(self, other)
object.__irshift__(self, other)
object.__iand__(self, other)
object.__ixor__(self, other)
object.__ior__(self, other)
```

比如 a + b，当 a 当中没有定义 `__add__`的时候，就会调用 b 的 `__radd__` 。比如下面这个例子：

```python
class A:

    def __init__(self, x):
        self.x = x
        

class B:
    def __init__(self, x):
        self.x = x

    def __radd__(self, other):
        print("In B __radd__")
        return self.x + other.x


if __name__ == '__main__':
    a = A(1)
    b = B(1)
    print(a + b)
```

上面的代码输出结果如下所示：

```bash
In B __radd__
2
```

除了上面关于数据的魔术方法之外，还有一些其他的魔术方法，具体如下所示：

```python
object.__neg__(self)
object.__pos__(self)
object.__abs__(self)
object.__invert__(self)
object.__complex__(self)
object.__int__(self)
object.__float__(self)
object.__index__(self)
object.__round__(self[, ndigits])
object.__trunc__(self)
object.__floor__(self)
object.__ceil__(self)
```

- `object.__neg__(self)` 这个方法用于定义负号（-）运算符的行为。当应用负号运算符到一个对象时，会调用该对象的`__neg__`方法。它返回一个表示当前对象相反数的新对象。
- `object.__pos__(self)` 这个方法用于定义正号（+）运算符的行为。当应用正号运算符到一个对象时，会调用该对象的`__pos__`方法。它返回当前对象的副本。
- `object.__abs__(self)` 这个方法用于定义绝对值（abs()）函数的行为。当应用`abs()`函数到一个对象时，会调用该对象的`__abs__`方法。它返回当前对象的绝对值。
- `object.__invert__(self)` 这个方法用于定义按位取反（~）运算符的行为。当应用按位取反运算符到一个对象时，会调用该对象的`__invert__`方法。它返回当前对象按位取反后的结果。
- `object.__complex__(self)` 这个方法用于定义`complex()`函数的行为，用于将对象转换为复数形式。当应用`complex()`函数到一个对象时，会调用该对象的`__complex__`方法。它返回一个复数对象，表示当前对象。
- `object.__int__(self)` 这个方法用于定义`int()`函数的行为，用于将对象转换为整数形式。当应用`int()`函数到一个对象时，会调用该对象的`__int__`方法。它返回一个整数对象，表示当前对象。
- `object.__float__(self)` 这个方法用于定义`float()`函数的行为，用于将对象转换为浮点数形式。当应用`float()`函数到一个对象时，会调用该对象的`__float__`方法。它返回一个浮点数对象，表示当前对象。
- `object.__index__(self)` 这个方法用于定义`operator.index()`函数的行为，用于将对象转换为整数索引。当应用`operator.index()`函数到一个对象时，会调用该对象的`__index__`方法。它返回一个整数对象，表示当前对象可以用作索引。
- `object.__round__(self[, ndigits])` 这个方法用于定义`round()`函数的行为，用于对对象进行四舍五入。当应用`round()`函数到一个对象时，会调用该对象的`__round__`方法。可选的`ndigits`参数指定小数位数，默认为None。它返回一个新的对象，表示当前对象四舍五入后的结果。
- `object.__trunc__(self)` 这个方法用于定义`math.trunc()`函数的行为，用于将对象截断为整数。当应用`math.trunc()`函数到一个对象时，会调用该对象的`__trunc__`方法。

## 总结



本篇文章介绍了在Python中使用魔术方法来改变对象的比较和算术运算行为。对于比较运算符，可以通过重写`__lt__`、`__le__`、`__eq__`、`__ne__`、`__gt__`和`__ge__`方法来定义自定义对象之间的比较规则。对于算术运算符，可以通过重写`__add__`、`__sub__`、`__mul__`、`__matmul__`、`__truediv__`、`__floordiv__`、`__mod__`、`__divmod__`、`__pow__`、`__lshift__`、`__rshift__`、`__and__`、`__xor__`和`__or__`方法来定义对象之间的算术运算规则。这些方法允许自定义类的对象具有与内置类型相似的行为。

本篇文章还提到了反向魔术方法，即以`__r`开头的方法，用于处理反向运算。例如，`__radd__`、`__rsub__`、`__rmul__`等方法可以定义对象在反向运算中的行为。

通过示例代码，文章演示了如何在自定义类中重写这些魔术方法，以实现自定义的比较和算术运算规则。最后，展示了在自定义类中使用这些方法时得到的预期结果。

总而言之，通过理解和使用这些魔术方法，我们可以在Python中更好地控制自定义类对象的比较和算术运算行为，使其更符合特定需求。

---

本篇文章是深入理解 python 虚拟机系列文章之一，文章地址：https://github.com/Chang-LeHung/dive-into-cpython

更多精彩内容合集可访问项目：<https://github.com/Chang-LeHung/CSCore>

关注公众号：一无是处的研究僧，了解更多计算机（Java、Python、计算机系统基础、算法与数据结构）知识。

![](https://img2023.cnblogs.com/blog/2519003/202305/2519003-20230515205927052-1345839185.png)

