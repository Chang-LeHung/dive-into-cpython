

import marshal


if __name__ == '__main__':
    with open("tuple.bin", "rb") as fp:
        print(marshal.load(fp))

