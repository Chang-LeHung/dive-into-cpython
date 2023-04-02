
import dis


def num_to_byte(n):
    return n.to_bytes(1, "little")


def nums_to_bytes(data):
    ans = b"".join([num_to_byte(n) for n in data])
    return ans


if __name__ == '__main__':
    # extended_arg extended_num opcode oparg for python_version > 3.5
    bytecode = nums_to_bytes([144, 1, 144, 2, 100, 65])
    print(bytecode)
    dis.dis(bytecode)

    bytecode = nums_to_bytes([100, 65])
    print(bytecode)
    dis.dis(bytecode)

    dis.dis(nums_to_bytes.__code__)

    print(nums_to_bytes.__code__.co_lnotab)
