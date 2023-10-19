import dis


def demo():
	try:
		a = 1 / 0
	except ZeroDivisionError:
		print("Hello World")


if __name__ == '__main__':
	dis.dis(demo)
