

class Y():
    pass


class X():
    pass


class B(Y, X):
    def say(self):
        print("In class B")


class A(X, Y):

    def say(self):
        print("In class A")
class C(A, B):

    pass


