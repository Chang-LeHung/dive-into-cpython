import threading
import time


# 定义一个继承自 threading.Thread 的守护线程类
class DaemonThread(threading.Thread):
    def __init__(self):
        super().__init__()
        # 将线程设置为守护线程
        self.daemon = True

    def run(self):
        while True:
            # 守护线程的具体操作
            print("守护线程正在运行...")
            time.sleep(1)


# 创建守护线程对象并启动
daemon_thread = DaemonThread()
daemon_thread.start()

# 主线程的操作
print("主线程开始执行...")
time.sleep(5)
print("主线程执行完毕。")

print(dir(daemon_thread))
print(vars(daemon_thread))
