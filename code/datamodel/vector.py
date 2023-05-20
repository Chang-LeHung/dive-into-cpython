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

    def __matmul__(self, other):
        return Vector(self.x * other.x, self.y * other.y)

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

v7 = v5 @ v6 # matmul

print(f"{v1 = }")
print(f"{v2 = }")
print(f"{v3 = }")
print(f"{v4 = }")
print(f"{v5 = }")
print(f"{v6 = }")
print(f"{v7 = }")
