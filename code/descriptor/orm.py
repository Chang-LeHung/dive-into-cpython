
conn = dict()


class Field:

    def __set_name__(self, owner, name):
        self.fetch = f'SELECT {name} FROM {owner.table} WHERE {owner.key}=?;'
        print(f"{self.fetch = }")
        self.store = f'UPDATE {owner.table} SET {name}=? WHERE {owner.key}=?;'
        print(f"{self.store = }")

    def __get__(self, obj, objtype=None):
        return conn.execute(self.fetch, [obj.key]).fetchone()[0]

    def __set__(self, obj, value):
        conn.execute(self.store, [value, obj.key])
        conn.commit()


class User:
    table = 'User'                    # Table name
    key = 'id'                       # Primary key
    name = Field()
    age = Field()

    def __init__(self, key):
        self.key = key


if __name__ == '__main__':
    u = User("Bob")
