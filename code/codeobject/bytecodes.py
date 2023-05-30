import dis


def example01():
    a = 1
    b = 2
    c = a + b
    return c


g = 1


def example02():
    global g
    a = g + 1
    g = a
    return a


def example03():
    a = [1, 2, 3]
    b = {1, 2, 3}
    c = {
        1: 1,
        2: 2
    }
    d = (1, 2, 3)
    e = [1, 2]


def example04():
    a = 1
    if a == 1:
        b = "Hello"
    elif a == 2:
        b = "World"
    elif a > 100:
        b = "Hello World"
    elif a < 50:
        b = "a < 50"
    elif a != 0:
        b = "a != 0"
    else:
        b = "else"


def example05():
    a = 1
    if a >= 0:
        b = a
    else:
        b = -a


def example06():
    for i in range(3):
        print(i)


def example07():
    try:
        a = 1 / 0
    except ZeroDivisionError:
        print("Error")
    finally:
        print("in finally")

    a = 1
    b = 2
    return a + b


def example08():
    for i in range(10):
        if i == 5:
            break


if __name__ == '__main__':
    # dis.dis(example01)
    # dis.dis(example02)
    # dis.dis(example03)
    # dis.dis(example04)
    # dis.dis(example05)
    # dis.dis(example06)
    # print(list(example07.__code__.co_code))
    dis.dis(example07)
    # dis.dis(example08)
