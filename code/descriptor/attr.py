from typing import Any
from types import MethodType


class A(object):

    def __getattr__(self, name: str) -> Any:
        print(f"in __getattr__ {name = }")

    def __getattribute__(self, item: str) -> Any:
        print(f"in __getattribute__ {item = }")
        return super().__getattribute__(item)


if __name__ == '__main__':
    a = A()
    print(a.name)
