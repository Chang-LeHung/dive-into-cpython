import asyncio
import inspect


class Ticker:
	"""Yield numbers from 0 to `to` every `delay` seconds."""

	def __init__(self, delay, to):
		self.delay = delay
		self.i = 0
		self.to = to

	def __aiter__(self):
		return self

	async def __anext__(self):
		i = self.i
		if i >= self.to:
			raise StopAsyncIteration
		self.i += 1
		if i:
			await asyncio.sleep(self.delay)
		return i


if __name__ == '__main__':
	ticker = Ticker(1, 10)
	print(inspect.isawaitable(ticker))
	print(inspect.isasyncgen(ticker))
