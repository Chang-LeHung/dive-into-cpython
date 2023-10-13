

import threading

data = 0


def add_data(n):
	global data
	for i in range(n):
		data += 1


if __name__ == '__main__':
	ts = [threading.Thread(target=add_data, args=(100000,)) for _ in range(20)]
	for t in ts:
		t.start()
	for t in ts:
		t.join()

	print(data)

