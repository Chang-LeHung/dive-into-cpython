async def hello():
	return 0


if __name__ == '__main__':
	coroutine = hello()
	print(coroutine)
	try:
		coroutine.send(None)
	except StopIteration:
		print("coroutine finished")
