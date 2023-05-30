

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
