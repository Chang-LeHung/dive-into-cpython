class A:
	pass


class B(A):
	pass


class C(A):
	pass


class D(B, C):
	pass


if __name__ == '__main__':
	su = super(D, D())
	print(super(D, D()))
	print(D.__mro__)
