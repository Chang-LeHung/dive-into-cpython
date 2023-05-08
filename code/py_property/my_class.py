
from types import MethodType


class ClassMethod:
    "Emulate PyClassMethod_Type() in Objects/funcobject.c"

    def __init__(self, f):
        self.f = f

    def __get__(self, obj, cls=None):
        if cls is None:
            cls = type(obj)
        return MethodType(self.f, cls)


class Myclass:

    @ClassMethod
    def demo(cls):
        return "demo"


if __name__ == '__main__':
    a = Myclass()
    print(a.demo())
