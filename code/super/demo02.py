class A:

	def __init__(self):
		super().__init__()

	def method(self):
		print("In method of A")


class B(A):

	def __init__(self):
		super().__init__()

	def method(self):
		print("In method of B")


class C(B):

	def __init__(self):
		super().__init__()

	def method(self):
		print("In method of C")


if __name__ == '__main__':
	print(C.__mro__)
	obj = C()
	s = super(C, obj)
	s.method()
	s = super(B, obj)
	s.method()
