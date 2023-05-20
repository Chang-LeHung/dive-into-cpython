
import dis


class Demo:

    def __contains__(self, item):
        if item == 1:
            return True
        return False

    def __init__(self):
        self.data = [1, 2, 3]
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


def exist(a, b):
    """runtime check"""
    return a in b


if __name__ == '__main__':
    demo = Demo()
    print(1 in demo)
    print(5 in demo)
    dis.dis(exist)
    print("====split line====")
    dis.dis(Demo)
    for i in demo:
        print(i)
    print(locals())
