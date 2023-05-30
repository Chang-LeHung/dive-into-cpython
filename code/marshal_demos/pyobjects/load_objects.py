

import marshal


if __name__ == '__main__':
    with open("pyobjects.bin", "rb") as fp:
        print(marshal.load(fp))
        print(marshal.load(fp))
        print(marshal.load(fp))
        print(marshal.load(fp))
        print(marshal.load(fp))
        print(marshal.load(fp))
        print(marshal.load(fp))
        print(marshal.load(fp))
