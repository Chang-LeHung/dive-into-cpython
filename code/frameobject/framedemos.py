
import dis
import sys


def foo():
    a = 1
    b = 2
    return a + b


def tracer(frame, event, args):
    frame.f_trace_opcodes = True
    if event == 'opcode':
        print(frame.f_lasti)
    return tracer


if __name__ == '__main__':
    dis.dis(foo)
    sys.settrace(tracer)
    print(foo.__code__.co_stacksize)
    print(list(foo.__code__.co_code))
    foo()
