
import dis


def generator():

    yield 1
    yield 1


def test():
    g = generator()
    print(next(g))
    print(next(g))


if __name__ == '__main__':
    dis.dis(test)
