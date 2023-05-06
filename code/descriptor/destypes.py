

class Descriptor(object):

    def __set_name__(self, obj_type, attr_name):
        print(f"__set_name__ : {obj_type } {attr_name = }")

    def __get__(self, obj, obj_type):
        print(f"__get__ : {obj = } { obj_type = }")
        return getattr(obj, "value", None)

    def __set__(self, instance, value):
        print(f"__set__ : {instance = } {value = }")
        self.value = value

    def __delete__(self, obj):
        print(f"__delete__ : {obj = }")


class MyClass(object):

    des = Descriptor()


if __name__ == '__main__':
    a = MyClass()
    print(a.des)
    print(MyClass.des)
    a.des = "hello"
    del a.des
