import re
import sys
import os


def add_back_slash(cmd):
    chars = []
    for (idx, c) in enumerate(cmd):
        if c == '\"':
            chars.append("\\")
        chars.append(c)
    return "".join(chars)


if len(sys.argv) != 3:
    print("please pass build directory as a argument & path to compile log filename")
    print("python command_extractor build_dir compile_log.log")
    sys.exit(0)


sys.stdout = open("compile_commands.json", "w+")

with open(sys.argv[2], 'r+') as fp:
    text = fp.read()
compile_commands = re.findall("(gcc.+?)\n", text)
compile_commands = [cmd for cmd in compile_commands if '.c' in cmd]

print("[")

for (idx, cmd) in enumerate(compile_commands):
    filename = re.findall(r"\s([^\s]+\.c)", cmd)[0]
    print("\t{")
    print('\t\t"directory":', "\"" + os.path.abspath(sys.argv[1]) + "\",")
    print('\t\t"command": "' + add_back_slash(cmd) + '",')
    print('\t\t"file": "' + filename + '"')
    if idx == len(compile_commands) - 1:
        print("\t}")
    else:
        print("\t},")

print("]")
