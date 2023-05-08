import functools


class StaticMethod:
    "Emulate PyStaticMethod_Type() in Objects/funcobject.c"

    def __init__(self, f):
        self.f = f
        f = functools.update_wrapper(self, f)

    def __get__(self, obj, objtype=None):
        return self.f

    def __call__(self, *args, **kwds):
        return self.f(*args, **kwds)


class MyClass(object):

    @StaticMethod
    def demo():
        return "demo"


if __name__ == '__main__':
    a = MyClass()
    print(a.demo())
