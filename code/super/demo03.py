class Demo:

	def __init__(self):
		super().__init__()
		self.a = 100


if __name__ == '__main__':
	print(Demo.__init__.__code__.co_freevars)
	print(Demo.__init__.__code__.co_cellvars)
	import dis

	dis.dis("[[i for i in range(10)] for j in range(10)]")
