class A:

	def method(self):
		print("In method of A")


class B(A):

	def method(self):
		print("In method of B")


class C(B):

	def method(self):
		print("In method of C")


if __name__ == '__main__':
	obj = C()
	s = super(C, obj)
	s.method()
	s = super(B, obj)
	s.method()
