def generator():
	yield 1
	yield 2
	yield 3


if __name__ == '__main__':
	g = generator()
	print(g.send(None))
	g.close()
