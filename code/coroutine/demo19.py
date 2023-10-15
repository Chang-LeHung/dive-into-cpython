def bar():
	yield 1
	return "Hello World"


class Demo:

	def __iter__(self):
		return bar()


def foo():
	name = yield from Demo()
	print(f"{name = }")
	return "foo"


if __name__ == '__main__':
	coroutine = foo()
	try:
		coroutine.send(None)
		coroutine.send(None)
	except StopIteration as e:
		print(f"{e.value = }")
