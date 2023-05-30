

import sys
import dis


def print_demo():
    print(1, 2, 3, 4, 5, 5, 5, 5, file=sys.stdout)


def hello(a, b):
    print(a, b)


def call_hello():
    hello(1, b=2)


def sub(a, b, /, c, d, *, h=1, w=2):
    """hello world"""
    pass


def strdemo():
    s = "hello"
    print(s.encode("utf-8"))


if __name__ == '__main__':
    dis.dis(call_hello)
    print("="*10)
    dis.dis(hello)
    print(sub.__doc__)
    dis.dis(strdemo)
    print(__name__)
    print(type(__name__))
