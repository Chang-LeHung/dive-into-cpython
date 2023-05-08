

import dis


if __name__ == '__main__':
    i = 0
    items = list(dis.opmap.items())
    while i < len(items):
        key, val = items[i]
        s = "\\_".join(key.split("_"))
        print(f"{s} & {val} &", end="")
        i += 1

        if i < len(items) - 1:
            s = "\\_".join(key.split("_"))
            print(f"{s} & {val} \\\\ \\hline")
            i += 1
