
import marshal


def add(a, b):
    pass


if __name__ == '__main__':
    with open("add.bin", "rb+") as fp:
        code = marshal.load(fp)
    add.__code__ = code
    print(add(1, 2))
