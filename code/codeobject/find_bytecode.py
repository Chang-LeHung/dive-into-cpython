

import dis
import opcode


def add(a, b):
    return a + b


if __name__ == '__main__':
    print(list(bytearray(add.__code__.co_code)))
    dis.dis(add)

    for (key, val) in opcode.opmap.items():
        print(f"|{key}|{val}|")
