class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    def celsius1(self):
        return self._celsius

    celsius = property(celsius1)

    def celsius2(self, value):
        self._celsius = value

    celsius = celsius.setter(celsius2)

    def fahrenheit(self):
        return (self._celsius * 9 / 5) + 32

    fahrenheit = property(fahrenheit)


if __name__ == '__main__':
    t = Temperature(10)
    print(t.celsius)
    t.celsius = 100
    print(t.celsius)
    print(t.fahrenheit)

