from abc import ABCMeta, abstractmethod


class Demo(metaclass=ABCMeta):

    def __init__(self):
        pass

    @abstractmethod
    def demo(self):
        pass


class MyClass(Demo):
    pass


if __name__ == '__main__':
    a = MyClass()
    print(a)
