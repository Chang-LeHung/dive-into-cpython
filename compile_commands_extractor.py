

import re
import sys

if len(sys.argv) != 2:
    print("please pass build directory as a argument")
    print("python command_extractor build_dir")
    sys.exit(0)


sys.stdout = open("compile_commands.json", "w+")

with open("makeout", 'r+') as fp:
    text = fp.read()
compile_commands = re.findall("(gcc.+?)\n", text)
compile_commands = [cmd for cmd in compile_commands if '.c' in cmd]

print("[")

for (idx, cmd) in enumerate(compile_commands):
    filename = re.findall(r"\s([^\s]+\.c)", cmd)[0]
    print("\t{")
    print('\t\t"directory":', sys.argv[1] + ",")
    print('\t\t"command": "' + cmd + '",')
    print('\t\t"file": "' + filename + '"')
    if idx == len(compile_commands) - 1:
        print("\t}")
    else:
        print("\t},")

print("]")

