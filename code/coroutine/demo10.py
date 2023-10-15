import asyncio


async def ticker(delay, to):
	for i in range(to):
		yield i
		await asyncio.sleep(delay)


async def run():
	async for i in ticker(1, 10):
		print(i)


loop = asyncio.get_event_loop()
try:
	loop.run_until_complete(run())
finally:
	loop.close()
