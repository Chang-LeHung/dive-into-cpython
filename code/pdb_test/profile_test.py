
import cProfile


def m99():
    for i in range(1, 10):
        for j in range(1, i + 1):
            print(f"{i}x{j}={i*j}", end='\t')
        print()


if __name__ == '__main__':
    cProfile.run("m99()")
