

import marshal


if __name__ == '__main__':
    a = (100, 'aaa', 'ccc')
    with open("tuple.bin", "wb") as fp:
        marshal.dump(a, fp)
