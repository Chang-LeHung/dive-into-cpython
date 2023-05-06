
class NonDescriptor(object):
    pass


class MyClass():

    nd = NonDescriptor()


if __name__ == '__main__':
    a = MyClass()
    print(a.nd)
