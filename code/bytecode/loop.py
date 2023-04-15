
import dis
import random
import sys


def test_loop():
    for i in range(10):
        print(i)


def test_continue():
    for i in range(10):
        data = random.randint(0, 10)
        if data < 5:
            continue


def test_break():
    for i in range(10):
        data = random.randint(0, 10)
        if data < 5:
            break

    return "BREAK"


def test_while():

    while True:
        data = random.randint(0, 10)
        if data < 5:
            break


def test_exception():
    for i in range(4):
        try:
            break
        finally:
            print("Exiting loop")


def test_list():

    for i in list(range(10)):
        print(i)


def test_excep():
    try:
        a = 1 / 0
    except ZeroDivisionError:
        print("ZeroDivisionError")
    finally:
        print("Finally Done")


def unpack():
    l = [1, 2, 3]
    a, b, c = l


if __name__ == '__main__':
    print("test_loop:")
    dis.dis(test_loop)
    print("test_continue:")
    dis.dis(test_continue)
    print("test_break:")
    dis.dis(test_break)
    print("test_while:")
    dis.dis(test_while)
    print("test_exception:")
    dis.dis(test_exception)
    print("test_list:")
    dis.dis(test_list)
    print("test_excep:")
    dis.dis(test_excep)
    print("unpack")
    dis.dis(unpack)
    print(sys.version)

    try:
        a = 1 / 0
    except ZeroDivisionError as e:
        print(e)
        print(dir(e.__traceback__))
