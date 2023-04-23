import pdb
import sys
import dis


def f(x):
    print(1 / x)


def g(x):
    for i in range(10):
        print(x)


def my_tracer_(frame, event, arg=None):
    # extracts frame code
    if frame.f_code.co_name == "f":
        if event == "opcode":
            code = frame.f_code
            print(f"In : {dis.opname[code.co_code[frame.f_lasti]]}")
    return my_tracer


# local trace function which returns itself
def my_tracer(frame, event, arg=None):
    if frame.f_code.co_name == "f":
        frame.f_trace_opcodes = True
    if event == "opcode":
        return my_tracer_(frame, event, arg)
    return my_tracer


if __name__ == '__main__':
    # sys.settrace(my_tracer)
    # f(2)
    pdb.run("f(2)")
    # dis.dis(f)
