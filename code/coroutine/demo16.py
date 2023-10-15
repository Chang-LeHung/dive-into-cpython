import dis


async def bar():
	return "bar"


async def foo():
	name = await bar()
	print(f"{name = }")
	return "foo"


if __name__ == '__main__':
	coroutine = foo()
	try:
		coroutine.send(None)
	except StopIteration as e:
		print(f"{e.value = }")
	dis.dis(foo)
