import inspect


def bar():
	print("before yield")
	res = yield 1
	print(f"{res = }")
	print("after yield")
	return "Return Value"


def foo():
	a = 1
	b = 2
	c = 3
	d = 4
	yield
	print(a, b, c, d)


if __name__ == '__main__':
	generator = bar()
	print(generator)
	print(bar)
	# next(generator)
	generator.send(None)
	try:
		generator.send("None")
	except StopIteration as e:
		print(f"{e.value = }")
	print(inspect.isgeneratorfunction(bar))
	print(oct(bar.__code__.co_flags))
	print(bar.__code__.co_flags & 0x0020)

	generator = foo()
	next(generator)
	generator.gi_frame.f_locals['d'] = 6
	try:
		next(generator)
	except StopIteration:
		pass
