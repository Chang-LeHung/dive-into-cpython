

import marshal


if __name__ == '__main__':
    with open("pyobjects.bin", "wb") as fp:
        marshal.dump(1, fp)
        marshal.dump(1.5, fp)
        marshal.dump("Hello World", fp)
        marshal.dump((1, 2, 3), fp)
        marshal.dump([1, 2, 3], fp)
        marshal.dump({1, 2, 3}, fp)
        marshal.dump(1+1j, fp)
        marshal.dump({1: 2, 3: 4}, fp)
