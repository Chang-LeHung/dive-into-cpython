import asyncio
import datetime
import time


async def hello():
	print("start a coroutine", datetime.datetime.now())
	yield 3
	print("wait for 3s", datetime.datetime.now())


if __name__ == '__main__':
	coroutine = hello()
	import inspect

	print(inspect.isasyncgen(coroutine))
	print(inspect.isawaitable(coroutine))
	print(coroutine.ag_code.co_flags & 0x0100)
	print(coroutine.ag_code.co_flags & 0x0200)
	coroutine.aclose()
