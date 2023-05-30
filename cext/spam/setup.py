from distutils.core import setup, Extension

setup(name='demo',
      ext_modules=[
        Extension('spam',
                  ["spam.c"],
                  include_dirs = ["/usr/include/"],
                  library_dirs = ['/usr/local/lib', "/usr/lib"],
                  # libraries = ['sample']
                  )
        ]
)