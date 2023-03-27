
import struct
import time
import binascii


fname = "./__pycache__/hello.cpython-310.pyc"
f = open(fname, "rb")
magic = struct.unpack('<l', f.read(4))[0]
bit_filed = f.read(4)
print(f"bit field = {binascii.hexlify(bit_filed)}")
moddate = f.read(4)
filesz = f.read(4)
modtime = time.asctime(time.localtime(struct.unpack('<l', moddate)[0]))
filesz = struct.unpack('<L', filesz)
print("magic %s" % (hex(magic)))
print("moddate (%s)" % (modtime))
print("File Size %d" % filesz)
f.close()
