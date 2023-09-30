def bar():
	print("before yield")
	res = yield 1
	print(f"{res = }")
	print("after yield")
	return "Return Value"


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
