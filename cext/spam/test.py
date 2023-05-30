
import spam

try:
   a = spam.system("sl")
   print(f"{a = }")
except Exception as e:
   print(e, "in exception")
   print(type(e))
