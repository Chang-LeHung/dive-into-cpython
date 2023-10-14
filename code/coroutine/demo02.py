import inspect


async def hello():
	return 0


print(inspect.iscoroutinefunction(hello))
