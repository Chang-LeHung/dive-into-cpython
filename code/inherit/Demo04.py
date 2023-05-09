

class A:

    def method_a(self):
        print("In class A")


class B(A):

    pass


class C(A):

    def method_a(self):
        print("In class C")


class D(B, C):
    pass


if __name__ == '__main__':
    obj = D()
    print(D.mro())
    obj.method_a()
