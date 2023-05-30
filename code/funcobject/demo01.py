import dis


def bar(a: int, b: int = 0):
    """this is a demo function"""
    bar.a = 1
    return a + b


def test():
    print(bar.__annotations__)
    print(bar.__defaults__)
    print(bar.__kwdefaults__)
    print(bar.__name__)
    print(bar.__module__)
    print(bar.__doc__)
    print(bar.__dict__)
    print(bar.__qualname__)


if __name__ == '__main__':
    dis.dis(test)
    dis.dis(bar)
    print(type(bar))
    test()
    a = 1
