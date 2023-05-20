class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __lt__(self, other):
        return self.x < other.x and self.y
        return self.y < other.y

    def __le__(self, other):
        return self.x <= other.x and self.y <= other.y

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __ne__(self, other):
        return not self.__eq__(other)

    def __gt__(self, other):
        return self.x > other.x and self.y > other.y

    def __ge__(self, other):
        return self.x >= other.x and self.y >= other.y


p1 = Point(1, 2)
p2 = Point(3, 4)

print(p1 < p2)
print(p1 <= p2)
print(p1 == p2)
print(p1 != p2)
print(p1 > p2)
print(p1 >= p2)
