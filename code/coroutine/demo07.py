import asyncio


class Demo:

	def __init__(self):
		self.data = iter([i for i in range(10)])

	def __aiter__(self):
		return self

	async def __anext__(self):
		try:
			val = next(self.data)
		except StopIteration:
			raise StopAsyncIteration
		return val


async def use():
	async for i in Demo():
		print(i)


if __name__ == '__main__':
	co = use()
	asyncio.run(co)
	import inspect

	print(inspect.isawaitable(co))
	print(inspect.isasyncgen(co))
	print(hex(co.cr_code.co_flags))
	print(co.cr_code.co_flags & 0x0080)
	for i in range(10):
		print("i")
	else:
		print("j")
