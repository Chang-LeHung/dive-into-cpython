import dis


def add(a, b):
    return a + b


if __name__ == '__main__':
    print(add.__code__.co_code)
    print("bytecode: ", list(bytearray(add.__code__.co_code)))
    dis.dis(add)

    print(dis.HAVE_ARGUMENT)
