class MyContainer:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def __iter__(self):
        # 返回一个迭代器对象
        return self

    def __next__(self):
        if self.index < len(self.data):
            # 获取当前索引处的元素
            item = self.data[self.index]
            self.index += 1
            return item
        else:
            # 迭代结束，引发 StopIteration 异常
            raise StopIteration

# 创建迭代容器对象
my_container = iter(MyContainer([1, 2, 3, 4, 5]))

# 使用迭代器遍历元素
for item in my_container:
    print(item)

