
import dis


def test01(a, b):
    print(a, b)


def test02(a, b, c, d):
    print(a, b)


if __name__ == '__main__':
    dis.dis(test01)
    print()
    dis.dis("test02(1, 2, c = 3, d = 4)")
