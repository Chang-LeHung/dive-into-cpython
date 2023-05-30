import sys

def my_audit_hook(event, object, arg, result):
    print(f'Audit event: {event}, Object: {object}, Argument: {arg}, Result: {result}')

# 设置环境变量
import os
os.environ['PYTHONAUDITHOOK'] = '1'

# 调用 sys.audit 函数
sys.audit(my_audit_hook)

def my_function(x):
    return x * 2

result = my_function(10)
