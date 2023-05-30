
import dis


def iterate():
    for i in range(10):
        print("hello")

    iterator = iter([1, 2, 3])
    print(iterator.__next__())


if __name__ == '__main__':
    dis.dis(iterate)
    iterate()
    print(isinstance(type, object))
    dis.dis('a = int("1")')
