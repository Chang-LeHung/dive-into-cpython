import dis


def generator_a():
	yield 1
	yield 2


def generator_b(gen):
	yield from gen


if __name__ == '__main__':
	gen = generator_b(generator_a())
	print(gen.send(None))
	print(gen.send(None))
	try:
		gen.send(None)
	except StopIteration:
		print("generator exit")
