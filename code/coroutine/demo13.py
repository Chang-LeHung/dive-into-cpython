import asyncio
import inspect


async def ticker(delay, to):
	print("start execution")
	for i in range(to):
		yield i


async def demo():
	async for i in ticker(1, 10):
		print(i)


if __name__ == '__main__':
	o = ticker(1, 10)
	print(ticker(1, 10))
	print(type(ticker(1, 10)))
	print(inspect.isasyncgen(o))
	print(inspect.isasyncgenfunction(ticker))
	ret = o.asend(None)
	print(f"{inspect.isawaitable(ret) = }")
	print(ret)
	print(type(ret))
	asyncio.run(demo())
	import dis

	dis.dis(demo)
