import asyncio
import datetime
import time


async def sleep(t):
	time.sleep(t)


async def hello():
	print("start a coroutine", datetime.datetime.now())
	await sleep(3)
	print("wait for 3s", datetime.datetime.now())


if __name__ == '__main__':
	coroutine = hello()
	try:
		coroutine.send(None)
	except StopIteration:
		print("coroutine finished")
