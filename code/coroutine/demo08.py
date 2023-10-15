import asyncio
import random


class Demo:

	def __init__(self):
		self.data = iter([_ for _ in range(10)])

	def __aiter__(self):
		return self

	async def __anext__(self):
		try:
			val = next(self.data)
		except StopIteration:
			raise StopAsyncIteration
		return val


async def fetch_data():
	return random.randint(1, 10)


async def use():
	async for i in Demo():
		print(i)


if __name__ == '__main__':
	co = use()
	asyncio.run(co)
	# import dis

	# dis.dis(use)
