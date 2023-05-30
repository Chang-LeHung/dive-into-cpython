class Ten:
    def __get__(self, obj, objtype=None):
        print(f"{objtype = }")
        print(f"{obj = }")
        return 10


class A:
    x = 5                       # Regular class attribute
    y = Ten()                   # Descriptor instance


if __name__ == '__main__':
    a = A()
    print(a.x)
    print(a.y)
