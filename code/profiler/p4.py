import threading

data = 0


def increment():
	global data
	data += 1


def add_data(n):
	for i in range(n):
		increment()


if __name__ == '__main__':
	ts = [threading.Thread(target=add_data, args=(100000,)) for _ in range(20)]
	for t in ts:
		t.start()
	for t in ts:
		t.join()

	print(data)
