def generator():
	print("start")
	yield 1
	yield 2
	print("end")


if __name__ == '__main__':
	g = generator()
	print(g.send(None))
	print(g.send(None))
	print(g.send(None))
