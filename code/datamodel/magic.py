
import dis


def exist(a, b):
    """runtime check"""
    return a in b


if __name__ == '__main__':
    dis.dis(exist)
