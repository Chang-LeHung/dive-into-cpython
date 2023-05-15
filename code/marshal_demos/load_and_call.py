
import marshal


def name():
    pass


if __name__ == '__main__':
    with open("add.bin", "rb+") as fp:
        code = marshal.load(fp)
    name.__code__ = code
    print(name(1, 2))
