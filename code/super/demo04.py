class Demo:

	def __init__(self):
		print(super().__init__)


if __name__ == '__main__':
	Demo()
	print(Demo.__init__)
