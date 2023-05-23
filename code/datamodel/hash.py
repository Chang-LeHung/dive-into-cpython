

import random


class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    # def __eq__(self, other):
    #     return self.name == other.name and self.age == other.age

    def __hash__(self):
        return hash((self.name, self.age)) # + random.randint(0, 1024)

    def __repr__(self):
        return f"[name={self.name}, age={self.age}]"


person1 = Person("Alice", 25)
person2 = Person("Alice", 25)


print(hash(person1))  
print(hash(person2))  


container = set()
container.add(person1)
container.add(person2)
print(container)
