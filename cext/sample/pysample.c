#include "Python.h"
#include "sample.h"

/* int gcd(int, int) */
static PyObject *py_gcd(PyObject *self, PyObject *args) {
  int x, y, result;

  if (!PyArg_ParseTuple(args,"ii", &x, &y)) {
    return NULL;
  }
  result = gcd(x,y);
  return Py_BuildValue("i", result);
}

/* int in_mandel(double, double, int) */
static PyObject *py_in_mandel(PyObject *self, PyObject *args) {
  double x0, y0;
  int n;
  int result;

  if (!PyArg_ParseTuple(args, "ddi", &x0, &y0, &n)) {
    return NULL;
  }
  result = in_mandel(x0,y0,n);
  return Py_BuildValue("i", result);
}

/* int divide(int, int, int *) */
static PyObject *py_divide(PyObject *self, PyObject *args) {
  int a, b, quotient, remainder;
  if (!PyArg_ParseTuple(args, "ii", &a, &b)) {
    return NULL;
  }
  quotient = divide(a,b, &remainder);
  return Py_BuildValue("(ii)", quotient, remainder);
}

/* 测试双精度*/
static PyObject *return_float(PyObject *self, PyObject *args){

  return Py_BuildValue("d", 3.14);
}

static PyObject *test_string(PyObject *self, PyObject *args){
  char* s;
  if(!PyArg_ParseTuple(args, "s", &s)) {
    return NULL;
  }
  printf("string = %s\n", s);
  return Py_None;
}

static PyObject *test_type(PyObject *self, PyObject *args)
{
  if(!PyArg_ParseTuple(args, "O", &self))
    return NULL;
  if(PyList_Check(self))
  {
    printf("size of list = %ld\n", Py_SIZE(self));
    printf("pass data type is list\n");
  }
  else if(PyTuple_Check(self))
  {
    printf("pass data type is tuple\n");
  }
  else if(PyBool_Check(self))
  {
    printf("pass data type is bool\n");
  }
  else if(PyFloat_Check(self))
  {
    printf("pass data type is float\n");
  }
  else if(PyLong_Check(self))
  {
    printf("pass data type is long\n");
  }
  return Py_None;
}

/* Module method table */
static PyMethodDef SampleMethods[] = {
  {"gcd",  py_gcd, METH_VARARGS, "Greatest common divisor"},
  {"in_mandel", py_in_mandel, METH_VARARGS, "Mandelbrot test"},
  {"divide", py_divide, METH_VARARGS, "Integer division"},
  {"return_float", return_float, METH_VARARGS, "return_float"},
  {"test_string", test_string, METH_VARARGS, "test_string"},
  {"test_type", test_type, METH_VARARGS, "test_type"},
  { NULL, NULL, 0, NULL}
};

/* Module structure */
static struct PyModuleDef samplemodule = {
  PyModuleDef_HEAD_INIT,

  "sample",           /* name of module */
  "A sample module",  /* Doc string (may be NULL) */
  -1,                 /* Size of per-interpreter state or -1 */
  SampleMethods       /* Method table */
};

/* Module initialization function */
PyMODINIT_FUNC
PyInit_sample(void) {
  return PyModule_Create(&samplemodule);
}