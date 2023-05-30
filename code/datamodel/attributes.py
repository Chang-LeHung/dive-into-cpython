
import module


def bar():
    return "bar"


if __name__ == '__main__':
    print(bar.__module__)
    print(module.foo.__defaults__)
    print(module.foo.__globals__)
    print(module.foo.__kwdefaults__)
    module.foo()
