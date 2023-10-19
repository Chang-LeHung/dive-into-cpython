import threading


def func():
	print("Hello World")


if __name__ == '__main__':
	t = threading.Thread(target=func)
	t.start()
	t.join()