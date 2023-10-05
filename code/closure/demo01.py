import inspect


def outer_function(x):
	# 外部函数定义了一个局部变量 x

	def inner_function(y):
		# 内部函数可以访问外部函数的局部变量 x
		return x + y

	# 外部函数返回内部函数的引用，形成闭包
	return inner_function


# 创建两个闭包实例，分别使用不同的 x 值
closure1 = outer_function(10)
closure2 = outer_function(20)

# 调用闭包，它们仍然可以访问其所在外部函数的 x 变量
result1 = closure1(5)  # 计算 10 + 5，结果是 15
result2 = closure2(5)  # 计算 20 + 5，结果是 25

print(result1)
print(result2)
print(closure1)
print(closure2)

print(inspect.isfunction(closure1))
print(inspect.isfunction(closure2))
