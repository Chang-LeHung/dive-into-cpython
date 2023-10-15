import asyncio


async def gen():
	await asyncio.sleep(0.1)
	v = yield 42
	print(v)
	await asyncio.sleep(0.2)


async def main():
	try:
		g = gen()

		v = await g.asend(None)  # Will return 42 after sleeping
		print(f"{v = }")
		# for 0.1 seconds.

		await g.asend('hello')  # Will print 'hello' and
	except StopAsyncIteration:
		pass


# raise StopAsyncIteration
# (after sleeping for 0.2 seconds.)


if __name__ == '__main__':
	asyncio.run(main())
