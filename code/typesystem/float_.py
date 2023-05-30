

class MyFloat:

    def __float__(self):
        return 1.5


if __name__ == '__main__':
    a = MyFloat()
    print(2 + float(a))

