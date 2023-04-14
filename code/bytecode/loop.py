
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


if __name__ == '__main__':
    dis.dis(test_loop)
    print("==========================")
    dis.dis(test_continue)
    print("==========================")
    dis.dis(test_break)
    print("==========================")
    dis.dis(test_while)
    print("==========================")
    dis.dis(test_exception)
    print("==========================")
    dis.dis(test_list)
    print("==========================")
    dis.dis(test_excep)
    print(sys.version)

    try:
        a = 1 / 0
    except ZeroDivisionError as e:
        print(e)
        print(dir(e.__traceback__))
