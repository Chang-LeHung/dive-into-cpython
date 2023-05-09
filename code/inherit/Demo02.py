class A:
    x = 1

    def __init__(self):
        print("in class A")


class B:
    x = 2

    def __init__(self):
        print("in class B")


class C(A, B):
    def __init__(self):
        super().__init__()
        print(self.x)


c = C()  # 输出 1
