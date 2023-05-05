import logging

logging.basicConfig(level=logging.INFO)


class LoggedAgeAccess:

    def __get__(self, obj, objtype=None):
        value = obj._age
        logging.info('Accessing %r giving %r', 'age', value)
        return value

    def __set__(self, obj, value):
        logging.info('Updating %r to %r', 'age', value)
        obj._age = value


class Person:

    age = LoggedAgeAccess()             # Descriptor instance

    def __init__(self, name, age):
        self.name = name                # Regular instance attribute
        self.age = age                  # Calls __set__()

    def birthday(self):
        self.age += 1                   # Calls both __get__() and __set__()


if __name__ == '__main__':
    mary = Person('Mary M', 30)
    dave = Person('David D', 40)
    print(dave.__dict__['_age'])
    print(vars(mary))
    print(dave.age)
    print(dave._age)
