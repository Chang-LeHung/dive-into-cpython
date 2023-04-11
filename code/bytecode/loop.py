
import dis
import random


def test_loop():
    for i in range(10):
        data = random.randint(0, 10)
        if data < 5:
            continue
        else:
            break


if __name__ == '__main__':
    dis.dis(test_loop)