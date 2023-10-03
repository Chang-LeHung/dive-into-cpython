import dis


def hello():
	yield 1
	yield 2


if __name__ == '__main__':
	dis.dis(hello)
