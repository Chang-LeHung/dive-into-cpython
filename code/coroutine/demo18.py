def bar():
	yield
	return "bar"


def foo():
	name = yield from bar()
	print(f"{name = }")
	return "foo"


if __name__ == '__main__':
	coroutine = foo()
	try:
		coroutine.send(None)
		coroutine.send(None)
	except StopIteration as e:
		print(f"{e.value = }")
	import dis

	dis.dis(foo)
