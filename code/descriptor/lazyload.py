class LazyLoad:
    def __init__(self, func):
        print(f"{func = } {type(func) = }")
        self._func = func

    def __get__(self, instance, owner):
        if instance is None:
            return self
        value = self._func(instance)
        setattr(instance, self._func.__name__, value)
        return value


class MyClass:
    def __init__(self):
        self._expensive_data = None

    @LazyLoad
    def expensive_data(self):
        print("Calculating expensive data...")
        self._expensive_data = [i ** 2 for i in range(10)]
        return self._expensive_data


my_obj = MyClass()
print(my_obj.expensive_data)  # Calculating expensive data... [0, 1, 4, ..., 998001]
print(my_obj.expensive_data)  # [0, 1, 4, ..., 998001] (no recalculation)
