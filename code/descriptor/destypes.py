

class Descriptor(object):

    def __set_name__(self, obj_type, attr_name):
        print(f"__set_name__ : {obj_type } {attr_name = }")
        return "__set_name__"

    def __get__(self, obj, obj_type):
        print(f"__get__ : {obj = } { obj_type = }")
        return "__get__"

    def __set__(self, instance, value):
        print(f"__set__ : {instance = } {value = }")
        return "__set__"

    def __delete__(self, obj):
        print(f"__delete__ : {obj = }")
        return "__delete__"


class MyClass(object):

    des = Descriptor()


if __name__ == '__main__':
    a = MyClass()
    _ = MyClass.des
    _ = a.des
    a.des = "hello"
    del a.des
