
import dis


def test_control01():
    a = 1

    if a > 1:
        print("a > 1")
    elif a < 1:
        print("a < 1")
    else:
        print("a == 1")


def test_control02():

    a = 1
    while a < 10:
        print("a < 10")


if __name__ == '__main__':
    dis.dis(test_control01)
    # dis.dis(test_control02)
