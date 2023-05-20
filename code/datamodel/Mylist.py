
import inspect


class MyList:
    def __init__(self):
        self.items = []

    def __len__(self):
        return len(self.items)

    def __getitem__(self, index):
        print(f"{index = }")
        if isinstance(index, slice):
            return self.items[index.start:index.stop:index.step or 1]
        return self.items[index]

    def __setitem__(self, key, value):
        print(f"{key = } {value = }")
        if isinstance(key, slice):
            start, stop, step = key.start, key.stop, key.step
            if step is None:
                print(f"{self.items = }")
                self.items[start:stop] = [value] * (stop - start)
            else:
                indices = list(range(start or 0, stop or len(self.items), step))
                for i, item in zip(indices, value):
                    self.items[i] = item
        else:
            self.items[key] = value

    def __delitem__(self, index):
        del self.items[index]

    def __iter__(self):
        return iter(self.items)

    def __contains__(self, item):
        return item in self.items

    def __repr__(self):
        return self.items.__repr__()

    def append(self, item):
        self.items.append(item)


if __name__ == '__main__':
    my_list = MyList()
    my_list.append(1)
    my_list.append(2)
    my_list.append(3)
    my_list.append(4)
    my_list.append(5)
    my_list.append(6)

    print(len(my_list))  # 输出: 3

    print(my_list[0])  # 输出: 1

    my_list[1] = 99
    print(my_list[1])  # 输出: 4

    del my_list[2]
    print(len(my_list))  # 输出: 2

    for item in my_list:
        print(item)  # 输出: 1 4

    print(2 in my_list)  # 输出: False
    print(f"{my_list = }")
    print(my_list[0:3])
    my_list[1:3] = 100
    print(my_list)
