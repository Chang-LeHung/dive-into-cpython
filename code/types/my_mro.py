from typing import Iterable


class A:
    pass


class B(A):

    pass


class C(A):
    pass


class D(B, C):
    pass


def mro(_type: type):
    bases = _type.__bases__
    lin_bases = []
    for base in bases:
        lin_bases.append(mro(base))
    lin_bases.append(list(bases))
    return [_type] + merge(lin_bases)


def merge(types: Iterable[Iterable[type]]):
    res = []
    seqs = types
    while True:
        seqs = [s for s in seqs if s]
        if not seqs:
            # if seqs is empty
            return res
        for seq in seqs:
            head = seq[0]
            if not [s for s in seqs if head in s[1:]]:
                break
        else:
            # 如果遍历完所有的类还是找不到一个合法的类 则说明 mro 算法失败 这个继承关系不满足 C3 算法的要求
            raise Exception('can not find mro sequence')
        res.append(head)
        for s in seqs:
            if s[0] == head:
                del s[0]


if __name__ == '__main__':
    print(D.mro())
    print(mro(D))
    assert D.mro() == mro(D)
    a = 1