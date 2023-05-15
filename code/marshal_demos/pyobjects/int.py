

import marshal


if __name__ == '__main__':
    a = 100
    with open("int.bin", "wb") as fp:
        marshal.dump(a, fp)
        marshal.dump({1, 2, 3}, fp)

