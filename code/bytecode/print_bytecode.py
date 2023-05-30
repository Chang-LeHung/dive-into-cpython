

import dis


class Demo:

    def hello(self):
        print(self)


if __name__ == '__main__':
    a = Demo()
    m = a.hello
    print(m)
    print(m.__self__)
