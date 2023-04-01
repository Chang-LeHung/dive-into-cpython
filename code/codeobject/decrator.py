import numba


@numba.jit
def f(func):
    func.new_attr = "hello world"
    return func


@f
def g():
    return 0


if __name__ == '__main__':
    g()
