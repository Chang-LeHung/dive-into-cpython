

import dis
import inspect
import asyncio


def gen():
    yield 1


def loop_gen():
    for i in range(10):
        yield i


async def demo():

    await asyncio.sleep(1)

if __name__ == '__main__':
    t = demo()
    print(inspect.iscoroutine(t))

    print(inspect.isgenerator(gen()))

    loop = loop_gen()
    print(inspect.isgenerator(loop))
    print(hex(inspect.CO_ITERABLE_COROUTINE))
    asyncio.run(t)
