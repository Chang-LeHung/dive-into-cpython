
import dis


def add(a, b):
    a += 1
    b += 2
    return a + b


if __name__ == '__main__':
    dis.dis(add.__code__)
    print(f"{list(bytearray(add.__code__.co_lnotab)) = }")
    print(f"{add.__code__.co_firstlineno = }")
