
import struct
from enum import Enum
from pprint import pprint
import sys


class TYPE(Enum):
    TYPE_NULL                 = ord('0')
    TYPE_NONE                 = ord('N')
    TYPE_FALSE                = ord('F')
    TYPE_TRUE                 = ord('T')
    TYPE_STOPITER             = ord('S')
    TYPE_ELLIPSIS             = ord('.')
    TYPE_INT                  = ord('i')
    TYPE_INT64                = ord('I')
    TYPE_FLOAT                = ord('f')
    TYPE_BINARY_FLOAT         = ord('g')
    TYPE_COMPLEX              = ord('x')
    TYPE_BINARY_COMPLEX       = ord('y')
    TYPE_LONG                 = ord('l')
    TYPE_STRING               = ord('s')
    TYPE_INTERNED             = ord('t')
    TYPE_REF                  = ord('r')
    TYPE_TUPLE                = ord('(')
    TYPE_LIST                 = ord('[')
    TYPE_DICT                 = ord('{')
    TYPE_CODE                 = ord('c')
    TYPE_UNICODE              = ord('u')
    TYPE_UNKNOWN              = ord('?')
    TYPE_SET                  = ord('<')
    TYPE_FROZENSET            = ord('>')
    FLAG_REF                  = 0x80
    TYPE_ASCII                = ord('a')
    TYPE_ASCII_INTERNED       = ord('A')
    TYPE_SMALL_TUPLE          = ord(')')
    TYPE_SHORT_ASCII          = ord('z')
    TYPE_SHORT_ASCII_INTERNED = ord('Z')


class ByteStreamReader(object):

    @staticmethod
    def read_int(buf: bytes):
        return struct.unpack("<i", buf)[0]

    @staticmethod
    def read_byte(buf):
        return struct.unpack("<B", buf)[0]

    @staticmethod
    def read_float(buf):
        return struct.unpack("<f", buf)[0]

    @staticmethod
    def read_double(buf):
        return struct.unpack("<d", buf)[0]

    @staticmethod
    def read_long(buf):
        return struct.unpack("<q", buf)[0]


class PyObjectLoader(object):

    def __init__(self, filename):
        self.reader = ByteStreamReader()
        self.fp = open(filename, "rb")
        self.flag = 0
        self.refs = []

    def do_parse(self):
        c = self.fp.read(1)
        assert len(c) != 0, "can not read more data from file descriptor"
        t = ByteStreamReader.read_byte(c) & (~TYPE.FLAG_REF.value)
        self.flag = ByteStreamReader.read_byte(c) & TYPE.FLAG_REF.value
        if t == TYPE.TYPE_NULL.value:
            return None
        elif t == TYPE.TYPE_NONE.value:
            return None
        elif t == TYPE.TYPE_FALSE.value:
            return False
        elif t == TYPE.TYPE_TRUE.value:
            return True
        elif t == TYPE.TYPE_STOPITER.value:
            return StopIteration
        elif t == TYPE.TYPE_ELLIPSIS.value:
            return Ellipsis
        elif t == TYPE.TYPE_INT.value:
            ret = ByteStreamReader.read_int(self.fp.read(4))
            self.refs.append(ret)
            return TYPE.TYPE_INT, ret
        elif t == TYPE.TYPE_INT64.value:
            ret = ByteStreamReader.read_long(self.fp.read(8))
            self.refs.append(ret)
            return TYPE.TYPE_INT64, ret
        elif t == TYPE.TYPE_FLOAT.value:
            raise RuntimeError("Unsupported TYPE TYPE_FLOAT")
        elif t == TYPE.TYPE_BINARY_FLOAT.value:
            ret = ByteStreamReader.read_double(self.fp.read(8))
            self.refs.append(ret)
            return TYPE.TYPE_FLOAT, ret
        elif t == TYPE.TYPE_COMPLEX.value:
            raise RuntimeError("Unsupported TYPE TYPE_COMPLEX")
        elif t == TYPE.TYPE_BINARY_COMPLEX.value:
            ret = complex(self.do_parse(), self.do_parse())
            self.refs.append(ret)
            return TYPE.TYPE_BINARY_COMPLEX, ret
        elif t == TYPE.TYPE_LONG.value:
            raise RuntimeError("Unsupported TYPE TYPE_LONG")
        elif t == TYPE.TYPE_STRING.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = self.fp.read(size)
            self.refs.append(ret)
            return TYPE.TYPE_STRING, ret
        elif t == TYPE.TYPE_INTERNED.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = self.fp.read(size).decode("utf-8")
            self.refs.append(ret)
            return TYPE.TYPE_INTERNED, ret
        elif t == TYPE.TYPE_REF.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            return TYPE.TYPE_REF, self.refs[size]
        elif t == TYPE.TYPE_TUPLE.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = []
            self.refs.append(ret)
            for i in range(size):
                ret.append(self.do_parse())
            return TYPE.TYPE_TUPLE, tuple(ret)
        elif t == TYPE.TYPE_LIST.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = []
            self.refs.append(ret)
            for i in range(size):
                ret.append(self.do_parse())
            return TYPE.TYPE_LIST, ret
        elif t == TYPE.TYPE_DICT.value:
            ret = dict()
            self.refs.append(ret)
            while True:
                key = self.do_parse()
                if key is None:
                    break
                val = self.do_parse()
                if val is None:
                    break
                ret[key] = val
            return TYPE.TYPE_DICT, ret
        elif t == TYPE.TYPE_CODE.value:
            ret = dict()
            idx = len(self.refs)
            self.refs.append(None)
            ret["argcount"] = ByteStreamReader.read_int(self.fp.read(4))
            ret["posonlyargcount"] = ByteStreamReader.read_int(self.fp.read(4))
            ret["kwonlyargcount"] = ByteStreamReader.read_int(self.fp.read(4))
            ret["nlocals"] = ByteStreamReader.read_int(self.fp.read(4))
            ret["stacksize"] = ByteStreamReader.read_int(self.fp.read(4))
            ret["flags"] = ByteStreamReader.read_int(self.fp.read(4))

            ret["code"] = self.do_parse()
            ret["consts"] = self.do_parse()
            ret["names"] = self.do_parse()
            ret["varnames"] = self.do_parse()
            ret["freevars"] = self.do_parse()
            ret["cellvars"] = self.do_parse()
            ret["filename"] = self.do_parse()
            ret["name"] = self.do_parse()
            ret["firstlineno"] = ByteStreamReader.read_int(self.fp.read(4))
            ret["lnotab"] = self.do_parse()
            self.refs[idx] = ret
            return TYPE.TYPE_CODE, ret
        elif t == TYPE.TYPE_UNICODE.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = self.fp.read(size).decode("utf-8")
            self.refs.append(ret)
            return TYPE.TYPE_INTERNED, ret
        elif t == TYPE.TYPE_UNKNOWN.value:
            raise RuntimeError("Unknown value " + str(t))
        elif t == TYPE.TYPE_SET.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = set()
            self.refs.append(ret)
            for i in range(size):
                ret.add(self.do_parse())
            return TYPE.TYPE_SET, ret
        elif t == TYPE.TYPE_FROZENSET.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = set()
            idx = len(self.refs)
            self.refs.append(None)
            for i in range(size):
                ret.add(self.do_parse())
            self.refs[idx] = ret
            return TYPE.TYPE_SET, frozenset(ret)
        elif t == TYPE.TYPE_ASCII.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = self.fp.read(size).decode("utf-8")
            self.refs.append(ret)
            return TYPE.TYPE_INTERNED, ret
        elif t == TYPE.TYPE_ASCII_INTERNED.value:
            size = ByteStreamReader.read_int(self.fp.read(4))
            ret = self.fp.read(size).decode("utf-8")
            self.refs.append(ret)
            return TYPE.TYPE_ASCII_INTERNED, ret
        elif t == TYPE.TYPE_SMALL_TUPLE.value:
            size = ByteStreamReader.read_byte(self.fp.read(1))
            ret = []
            self.refs.append(ret)
            for i in range(size):
                ret.append(self.do_parse())
            return TYPE.TYPE_SMALL_TUPLE, tuple(ret)
        elif t == TYPE.TYPE_SHORT_ASCII.value:
            size = ByteStreamReader.read_byte(self.fp.read(1))
            ret = self.fp.read(size).decode("utf-8")
            self.refs.append(ret)
            return TYPE.TYPE_SHORT_ASCII, ret
        elif t == TYPE.TYPE_SHORT_ASCII_INTERNED.value:
            size = ByteStreamReader.read_byte(self.fp.read(1))
            ret = self.fp.read(size).decode("utf-8")
            self.refs.append(ret)
            return TYPE.TYPE_SHORT_ASCII_INTERNED, ret
        else:
            raise RuntimeError("can not parse " + str(t))

    def __del_(self):
        self.fp.close()


if __name__ == '__main__':
    assert sys.version_info.major == 3 and sys.version_info.minor >= 8, "only python3.10 works"
    loader = PyObjectLoader("int.bin")
    print(loader.do_parse())
    loader = PyObjectLoader("float.bin")
    print(loader.do_parse())
    loader = PyObjectLoader("set.bin")
    print(loader.do_parse())
    loader = PyObjectLoader("dict.bin")
    print(loader.do_parse())
    loader = PyObjectLoader("tuple.bin")
    print(loader.do_parse())
    loader = PyObjectLoader("list.bin")
    print(loader.do_parse())
    loader = PyObjectLoader("string.bin")
    print(loader.do_parse())
    loader = PyObjectLoader("code.bin")
    pprint(loader.do_parse())

