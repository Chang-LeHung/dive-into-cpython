
import os


def scan(dir):
    for file in os.listdir(dir):
        filename = os.path.join(dir, file)
        if os.path.isdir(filename):
            scan(filename)
        else:
            if filename.endswith("md") and "readme" not in filename.lower():
                rel_path = os.path.relpath(qrcode, os.path.dirname(filename))
                with open(filename, "r+") as fp:
                    lines = fp.readlines()
                    if "qrcode" not in lines[-1]:
                        lines.append(f"![]({rel_path})")


if __name__ == '__main__':
    qrcode = "./qrcode2.jpg"
    scan("./")
