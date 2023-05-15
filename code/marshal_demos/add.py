
import marshal


def add(a, b):
    return a+b


if __name__ == '__main__':
    with open("add.pyc", "wb") as fp:
        marshal.dump(add.__code__, fp)
