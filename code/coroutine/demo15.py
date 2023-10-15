import asyncio


async def gen():
	await asyncio.sleep(0.1)
	v = yield 42
	print(v)
	await asyncio.sleep(0.2)


async def main():
	g = gen()

	v = await g.asend(None)  # Will return 42 after sleeping
	print(f"{v = }")
	# for 0.1 seconds.

	try:
		await g.asend('hello')
	except StopAsyncIteration:
		pass


if __name__ == '__main__':
	asyncio.run(main())
