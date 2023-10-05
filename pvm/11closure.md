# 深入理解 python 虚拟机：原来虚拟机是这么实现闭包的

在本篇文章当中主要从虚拟机层面讨论函数闭包是如何实现的，当能够从设计者的层面去理解闭包就再也不用死记硬背一些闭包的概念了，因为如果你理解闭包的设计原理之后，这些都是非常自然的。

根据 wiki 的描述，a closure is a record storing a function together with an environment。所谓闭包就是将函数和环境存储在一起的记录。这里有三个重点一个是函数，一个是环境（简单说来就是程序当中变量），最后一个需要将两者组合在一起所形成的东西，才叫做闭包。

## Python 中的闭包

我们现在用一种更加直观的方式描述一下闭包：闭包是指在函数内部定义的函数，它可以访问外部函数的局部变量，并且可以在外部函数执行完后继续使用这些变量。这是因为闭包在创建时会捕获其所在作用域的变量，然后保持对这些变量的引用。下面是一个详细的Python闭包示例：

```python
def outer_function(x):
    # 外部函数定义了一个局部变量 x

    def inner_function(y):
        # 内部函数可以访问外部函数的局部变量 x
        return x + y

    # 外部函数返回内部函数的引用，形成闭包
    return inner_function

# 创建两个闭包实例，分别使用不同的 x 值
closure1 = outer_function(10)
closure2 = outer_function(20)

# 调用闭包，它们仍然可以访问其所在外部函数的 x 变量
result1 = closure1(5)  # 计算 10 + 5，结果是 15
result2 = closure2(5)  # 计算 20 + 5，结果是 25

print(result1)
print(result2)
```

在上面的示例中，`outer_function` 是外部函数，它接受一个参数 `x`，然后定义了一个内部函数 `inner_function`，它接受另一个参数 `y`，并返回 `x + y` 的结果。当我们调用 `outer_function` 时，它返回了一个对 `inner_function` 的引用，形成了一个闭包。这个闭包可以保持对 `x` 的引用，即使 `outer_function` 已经执行完毕。