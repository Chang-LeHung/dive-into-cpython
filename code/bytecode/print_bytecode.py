

import dis


if __name__ == '__main__':
    for (key, val) in dis.opmap.items():
        s = "\\_".join(key.split("_"))
        print(f"{s} & {val} \\\\ \\hline")
