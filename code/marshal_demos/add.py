
import marshal


def add(a, b):
    print("Hello World")
    return a+b


if __name__ == '__main__':
    with open("add.bin", "wb") as fp:
        marshal.dump(add.__code__, fp)

    with open("int.bin", "wb") as fp:
        marshal.dump(1, fp)
    with open("float.bin", "wb") as fp:
        marshal.dump(1.5, fp)
    with open("tuple.bin", "wb") as fp:
        marshal.dump((1, 2, 3), fp)
    with open("set.bin", "wb") as fp:
        marshal.dump({1, 2, 3}, fp)
    with open("list.bin", "wb") as fp:
        marshal.dump([1, 2, 3], fp)
    with open("dict.bin", "wb") as fp:
        marshal.dump({1: 2, 3: 4}, fp)
    with open("code.bin", "wb") as fp:
        marshal.dump(add.__code__, fp)

    with open("string.bin", "wb") as fp:
        marshal.dump("Hello World", fp)
