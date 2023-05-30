

class A:
    def __init__(self):
        self.a = 1

    def __getattr__(self, name):
        print(f"{name = }")
        return None


if __name__ == '__main__':
    a = A()
    print(a.a)
    print(a.b)
    import threading
    threading.local()
