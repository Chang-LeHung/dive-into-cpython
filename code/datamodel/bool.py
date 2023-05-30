class NonEmptyList:
    def __init__(self, items):
        self.items = items

    def __bool__(self):
        return len(self.items) > 0


my_list = NonEmptyList([1, 2, 3])

if my_list:
    print("The list is not empty.")
else:
    print("The list is empty.")


class MyList:
    def __init__(self):
        self.data = []

    def __getitem__(self, index):
        return self.data[index]


my_list = MyList()
my_list.data = [1, 2, 3]

print(my_list[1])  # 输出: 2


class MyList:
    def __init__(self):
        self.data = [0 for i in range(2)]

    def __setitem__(self, index, value):
        self.data[index] = value


my_list = MyList()

my_list[0] = 1
my_list[1] = 2

print(my_list.data)  # 输出: [1, 2]


class MyDict:

    def __init__(self):
        self.data = dict()

    def __delitem__(self, key):
        print("In __delitem__")
        del self.data[key]


obj = MyDict()
obj.data["key"] = "val"
del obj["key"] # 输出 In __delitem__

print("============================")


class MyMagicClass:
    def __init__(self):
        self.attributes = {}

    def __getattribute__(self, name):
        print(f"attribute = {name}")

    def __setattr__(self, name, value):
        super().__setattr__(name, value)

    def __delattr__(self, name):
        super().__delattr__(name)


my_obj = MyMagicClass()
my_obj.name = 'Alice'

print(my_obj.name)  # 输出: Alice

my_obj.age = 25
del my_obj.name

print(my_obj.age)  # 输出: 25

# class MyClass:
#     def __getattr__(self, name):
#         if name == 'color':
#             return 'blue'
#         else:
#             raise AttributeError(f"'MyClass' object has no attribute '{name}'")
#
# my_obj = MyClass()
# print(my_obj.color)  # 输出: blue
# print(my_obj.size)   # 引发 AttributeError: 'MyClass' object has no attribute 'size'


class MyClass:
    def __init__(self):
        self.color = 'red' # 输出：Setting attribute 'color' to 'red'

    def __setattr__(self, name, value):
        print(f"Setting attribute '{name}' to '{value}'")
        super().__setattr__(name, value)


my_obj = MyClass()
my_obj.color = 'blue'  # 输出: Setting attribute 'color' to 'blue'


print("="*100)
class CustomClass:
    def __init__(self):
        self.attribute = "Hello, world!"

    def __getattribute__(self, name):
        print(f"Accessing attribute: {name}")
        return super().__getattribute__(name)

    def __getattr__(self, name):
        print(f"Attribute {name} not found")
        return None


obj = CustomClass()
print(obj.attribute)
print(obj.nonexistent_attribute)

s = super(CustomClass, CustomClass)
print(s.__self__)
