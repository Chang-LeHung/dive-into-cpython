def bar():
	try:
		yield 1
		yield 2
	except ZeroDivisionError:
		print("received a ZeroDivisionError")
	yield


if __name__ == '__main__':
	g = bar()
	print(g.send(None))
	g.throw(ZeroDivisionError)
	g.close()
