

import sys
import dis


def test_lasti():
    frame = sys._getframe()

    a = 1
    print(frame.f_lasti)
    a = 1
    print(frame.f_lasti)
    a = 1
    print(frame.f_lasti)
    a = 1
    print(frame.f_lasti)
    a = 1
    print(frame.f_lasti)


if __name__ == '__main__':

    dis.dis(test_lasti)
    test_lasti()
