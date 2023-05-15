
import marshal


def add(a, b):
    print("Hello World")
    return a+b


if __name__ == '__main__':
    with open("add.bin", "wb") as fp:
        marshal.dump(add.__code__, fp)
    print(dir(add))

