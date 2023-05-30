
import sys

file = sys.argv[1]
with open(file, "r+") as fp:
    code = fp.read()
lines = code.split("\n")


def do_line(frame, event, arg):
    print("debugging line:", lines[frame.f_lineno - 1])
    return debug


def debug(frame, event, arg):
    if event == "line":
        while True:
            _ = input("(Pdb)")
            if _ == 'n':
                return do_line(frame, event, arg)
            elif _.startswith('p'):
                _, v = _.split()
                v = eval(v, frame.f_globals, frame.f_locals)
                print(v)
            elif _ == 'q':
                sys.exit(0)
    return debug


if __name__ == '__main__':
    sys.settrace(debug)
    exec(code, None, None)
    sys.settrace(None)
