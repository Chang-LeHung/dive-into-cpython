class MyNumber:
    def __init__(self, value):
        self.value = value

    def __add__(self, other):
        return self.value + other.value

    def __sub__(self, other):
        return self.value - other.value

    def __mul__(self, other):
        return self.value * other.value

    def __matmul__(self, other):
        return self.value * other.value

    def __truediv__(self, other):
        return self.value / other.value

    def __floordiv__(self, other):
        return self.value // other.value

    def __mod__(self, other):
        return self.value % other.value

    def __divmod__(self, other):
        return divmod(self.value, other.value)

    def __pow__(self, other, modulo=None):
        return pow(self.value, other.value, modulo)

    def __lshift__(self, other):
        return self.value << other.value

    def __rshift__(self, other):
        return self.value >> other.value

    def __and__(self, other):
        return self.value & other.value

    def __xor__(self, other):
        return self.value ^ other.value

    def __or__(self, other):
        return self.value | other.value


if __name__ == '__main__':
    # 创建两个 MyNumber 对象
    num1 = MyNumber(5)
    num2 = MyNumber(3)

    # 使用 __add__ 方法执行加法运算
    result = num1 + num2
    print(result)  # 输出: 8

    # 使用 __sub__ 方法执行减法运算
    result = num1 - num2
    print(result)  # 输出: 2

    # 使用 __mul__ 方法执行乘法运算
    result = num1 * num2
    print(result)  # 输出: 15

    # 使用 __matmul__ 方法执行矩阵乘法运算
    result = num1 @ num2
    print(result)  # 输出: 根据具体需求返回结果

    # 使用 __truediv__ 方法执行真除法运算
    result = num1 / num2
    print(result)  # 输出: 1.6666666666666667

    # 使用 __floordiv__ 方法执行整除运算
    result = num1 // num2
    print(result)  # 输出: 1

    # 使用 __mod__ 方法执行取模运算
    result = num1 % num2
    print(result)  # 输出: 2

    # 使用 __divmod__ 方法执行 divmod 运算
    result = divmod(num1, num2)
    print(result)  # 输出: (1, 2)

    # 使用 __pow__ 方法执行幂运算
    result = num1 ** num2
    print(result)  # 输出: 125

    # 使用 __lshift__ 方法执行左移运算
    result = num1 << num2
    print(result)  # 输出: 40

    # 使用 __rshift__ 方法执行右移运算
    result = num1 >> num2
    print(result)  # 输出: 0

    # 使用 __and__ 方法执行按位与运算
    result = num1 & num2
    print(result)  # 输出: 1

    # 使用 __xor__ 方法执行按位异或运算
    result = num1 ^ num2
    print(result)  # 输出: 6

    # 使用 __or__ 方法执行按位或运算
    result = num1 | num2
    print(result)  # 输出: 7
    print(MyNumber.__bases__)
