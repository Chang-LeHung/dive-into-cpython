from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self):
        print("area")

    @abstractmethod
    def perimeter(self):
        pass


class Rectangle(Shape):
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

    def perimeter(self):
        return 2 * (self.length + self.width)


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14 * self.radius ** 2

    def perimeter(self):
        return 2 * 3.14 * self.radius


rectangle = Rectangle(5, 3)
print("Rectangle area:", rectangle.area())       # 输出：Rectangle area: 15
print("Rectangle perimeter:", rectangle.perimeter()) # 输出：Rectangle perimeter: 16

circle = Circle(2)
print("Circle area:", circle.area())           # 输出：Circle area: 12.56
print("Circle perimeter:", circle.perimeter())     # 输出：Circle perimeter: 12.56

# 注意，无法实例化抽象基类
# shape = Shape()  # 会抛出TypeError: Can't instantiate abstract class Shape with abstract methods area, perimeter
