# 深入理解 python 虚拟机：魔术方法大全

在本篇文章当中主要给大家介绍在 python 当中一些常见的魔术方法。

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

