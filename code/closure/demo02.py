def outer_function(x):
	def inner_function(y):
		nonlocal x
		x += 1
		return x + y

	return inner_function


closure1 = outer_function(10)
closure2 = outer_function(20)

result1 = closure1(5)
print(result1)
result1 = closure1(5)
print(result1)
result2 = closure2(5)
print(result2)
