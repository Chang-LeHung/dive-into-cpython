from distutils.core import setup, Extension

setup(name='demo',
      ext_modules=[
        Extension('demo',
                  ['pysample.c', "sample.c"],
                  include_dirs = ["/usr/include/"],
                  define_macros = [('FOO','1')],
                  undef_macros = ['BAR'],
                  library_dirs = ['/usr/local/lib', "/usr/lib"],
                  # libraries = ['sample']
                  )
        ]
)