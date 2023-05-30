class MyDict:
    def __init__(self):
        self.items = {}

    def __getitem__(self, key):
        print(f"__getitem__ called with key: {key}")
        return self.items[key]

    def __setitem__(self, key, value):
        print(f"__setitem__ called with key: {key}, value: {value}")
        self.items[key] = value

    def __delitem__(self, key):
        print(f"__delitem__ called with key: {key}")
        del self.items[key]

    def __contains__(self, item):
        print(f"__contains__ called with item: {item}")
        return item in self.items

    def __missing__(self, key):
        print(f"__missing__ called with key: {key}")
        return f"Key '{key}' is missing"

    def __length_hint__(self):
        print("__length_hint__ called")
        return len(self.items)

    def __iter__(self):
        print("__iter__ called")
        return iter(self.items)

    def __reversed__(self):
        print("__reversed__ called")
        return reversed(self.items)


if __name__ == '__main__':
    my_dict = MyDict()
    my_dict['name'] = 'Alice'
    my_dict['age'] = 25

    print(my_dict['name'])  # 输出: Alice

    del my_dict['age']

    print('name' in my_dict)  # 输出: True
    print('age' in my_dict)  # 输出: False


    class MyDict(dict):
        def __missing__(self, key):
            return f"Key '{key}' is missing"


    my_dict = MyDict()
    my_dict['name'] = 'Alice'

    print(my_dict['name'])  # 输出: Alice
    print(my_dict['age'])  # 输出: Key 'age' is missing
