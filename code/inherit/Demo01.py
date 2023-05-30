class A:
    def __init__(self):
        self.x = 1
        print(f"In A {self.__dict__} {vars(self) = }")


class B:
    def __init__(self):
        self.x = 2
        print(f"In B {self.__dict__} {vars(self) = }")


class C(A, B):
    def __init__(self):
        super(C, self).__init__()
        super(A, self).__init__()
        # 此处调用的是 A 类的 x 属性，因为 A 在 MRO 中排在 B 的前面
        print(f"In c {self.__dict__} {vars(self) = }")


if __name__ == '__main__':
    c = C()
    print(c.__dict__)
