import dis

code = """
x=1
y=2
""" \
+ "\n" * 500 + \
"""
z=x+y
"""

code = compile(code, '<string>', 'exec')
print(list(bytearray(code.co_lnotab)))
print(code.co_firstlineno)
dis.dis(code)
