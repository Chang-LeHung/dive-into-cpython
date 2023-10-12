import inspect


class A(object):

	def __init__(self):
		super().__init__()
		print(inspect.currentframe().f_locals)

	def bar(self):
		pass

	def foo(self):
		pass


class Demo(A):

	def __init__(self):
		super().__init__()
		print(inspect.currentframe().f_locals)

	def bar(self):
		super().bar()
		print(inspect.currentframe().f_locals)

	def foo(self):
		print(inspect.currentframe().f_locals)


if __name__ == '__main__':
	demo = Demo()
	demo.bar()
	demo.foo()
