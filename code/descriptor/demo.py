class Descriptor:
    def __get__(self, instance, owner):
        print(f"Getting {self.__class__.__name__}")
        return instance.__dict__.get(self.attrname)

    def __set__(self, instance, value):
        print(f"Setting {self.__class__.__name__}")
        instance.__dict__[self.attrname] = value

    def __delete__(self, instance):
        print(f"Deleting {self.__class__.__name__}")
        del instance.__dict__[self.attrname]

    def __set_name__(self, owner, name):
        self.attrname = name


class MyClass:
    x = Descriptor()


if __name__ == '__main__':
    obj = MyClass()
