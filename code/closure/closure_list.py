def outer_function(x):
	x.append(1)

	def inner_function(y):
		nonlocal x
		x.append(y)
		return x

	return inner_function


if __name__ == '__main__':
	out = outer_function([1, 2])
	print(out(1))
	print(out(2))
