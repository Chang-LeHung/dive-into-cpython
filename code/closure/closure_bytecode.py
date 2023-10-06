def outer_function(x):
	def inner_function(y):
		nonlocal x
		x += 1
		return x + y

	print(inner_function.__code__.co_freevars)  # ('x',)
	print(inner_function.__code__.co_cellvars)  # （）
	return inner_function


if __name__ == '__main__':
	out = outer_function(1)
	print(outer_function.__code__.co_freevars)  # （）
	print(outer_function.__code__.co_cellvars)  # （'x', ）
