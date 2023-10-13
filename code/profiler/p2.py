import dis

data = 0


def add_data(n):
	global data
	for i in range(n):
		data += 1


if __name__ == '__main__':
	dis.dis(add_data)
