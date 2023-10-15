import inspect


def hello():
	for i in range(2):
		yield i


if __name__ == '__main__':
	for i in hello():
		print(i)
	print(inspect.isgeneratorfunction(hello))
	print(inspect.isgenerator(hello))
	print(inspect.isfunction(hello))
	print(inspect.isgenerator(hello()))
	print(inspect.isfunction(hello()))
