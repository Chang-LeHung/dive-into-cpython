
import inspect


def test():
    print(inspect.currentframe())
    for i in dir(inspect.currentframe()):
        if not i.startswith("__"):
            print(i)


if __name__ == '__main__':
    test()
