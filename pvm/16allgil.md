### 2.1.3

```c
			if (interpreter_lock) {
				/* Give another thread a chance */

				if (PyThreadState_Swap(NULL) != tstate)
					Py_FatalError("ceval: tstate mix-up");
				PyThread_release_lock(interpreter_lock);

				/* Other threads may run now */

				PyThread_acquire_lock(interpreter_lock, 1);
				if (PyThreadState_Swap(tstate) != NULL)
					Py_FatalError("ceval: orphan tstate");
			}
```



### 2.2.3

```c
		if (things_to_do || --tstate->ticker < 0) {
			tstate->ticker = tstate->interp->checkinterval;
			tstate->tick_counter++;
			if (things_to_do) {
				if (Py_MakePendingCalls() < 0) {
					why = WHY_EXCEPTION;
					goto on_error;
				}
			}
#if !defined(HAVE_SIGNAL_H) || defined(macintosh)
			/* If we have true signals, the signal handler
			   will call Py_AddPendingCall() so we don't
			   have to call sigcheck().  On the Mac and
			   DOS, alas, we have to call it. */
			if (PyErr_CheckSignals()) {
				why = WHY_EXCEPTION;
				goto on_error;
			}
#endif

#ifdef WITH_THREAD
			if (interpreter_lock) {
				/* Give another thread a chance */

				if (PyThreadState_Swap(NULL) != tstate)
					Py_FatalError("ceval: tstate mix-up");
				PyThread_release_lock(interpreter_lock);

				/* Other threads may run now */

				PyThread_acquire_lock(interpreter_lock, 1);
				if (PyThreadState_Swap(tstate) != NULL)
					Py_FatalError("ceval: orphan tstate");
			}
#endif
		}
```

### 2.3.5

```c
		if (--_Py_Ticker < 0) {
                        if (*next_instr == SETUP_FINALLY) {
                                /* Make the last opcode before
                                   a try: finally: block uninterruptable. */
                                goto fast_next_opcode;
                        }
			_Py_Ticker = _Py_CheckInterval;
			tstate->tick_counter++;
			if (things_to_do) {
				if (Py_MakePendingCalls() < 0) {
					why = WHY_EXCEPTION;
					goto on_error;
				}
				if (things_to_do)
					/* MakePendingCalls() didn't succeed.
					   Force early re-execution of this
					   "periodic" code, possibly after
					   a thread switch */
					_Py_Ticker = 0;
			}
#if !defined(HAVE_SIGNAL_H) || defined(macintosh)
			/* If we have true signals, the signal handler
			   will call Py_AddPendingCall() so we don't
			   have to call PyErr_CheckSignals().  On the 
			   Mac and DOS, alas, we have to call it. */
			if (PyErr_CheckSignals()) {
				why = WHY_EXCEPTION;
				goto on_error;
			}
#endif

#ifdef WITH_THREAD
			if (interpreter_lock) {
				/* Give another thread a chance */

				if (PyThreadState_Swap(NULL) != tstate)
					Py_FatalError("ceval: tstate mix-up");
				PyThread_release_lock(interpreter_lock);

				/* Other threads may run now */

				PyThread_acquire_lock(interpreter_lock, 1);
				if (PyThreadState_Swap(tstate) != NULL)
					Py_FatalError("ceval: orphan tstate");

				/* Check for thread interrupts */

				if (tstate->async_exc != NULL) {
					x = tstate->async_exc;
					tstate->async_exc = NULL;
					PyErr_SetNone(x);
					Py_DECREF(x);
					why = WHY_EXCEPTION;
					goto on_error;
				}
			}
#endif
		}
```

### 2.4.3

```c
		if (--_Py_Ticker < 0) {
                        if (*next_instr == SETUP_FINALLY) {
                                /* Make the last opcode before
                                   a try: finally: block uninterruptable. */
                                goto fast_next_opcode;
                        }
			_Py_Ticker = _Py_CheckInterval;
			tstate->tick_counter++;
#ifdef WITH_TSC
			ticked = 1;
#endif
			if (things_to_do) {
				if (Py_MakePendingCalls() < 0) {
					why = WHY_EXCEPTION;
					goto on_error;
				}
				if (things_to_do)
					/* MakePendingCalls() didn't succeed.
					   Force early re-execution of this
					   "periodic" code, possibly after
					   a thread switch */
					_Py_Ticker = 0;
			}
#ifdef WITH_THREAD
			if (interpreter_lock) {
				/* Give another thread a chance */

				if (PyThreadState_Swap(NULL) != tstate)
					Py_FatalError("ceval: tstate mix-up");
				PyThread_release_lock(interpreter_lock);

				/* Other threads may run now */

				PyThread_acquire_lock(interpreter_lock, 1);
				if (PyThreadState_Swap(tstate) != NULL)
					Py_FatalError("ceval: orphan tstate");

				/* Check for thread interrupts */

				if (tstate->async_exc != NULL) {
					x = tstate->async_exc;
					tstate->async_exc = NULL;
					PyErr_SetNone(x);
					Py_DECREF(x);
					why = WHY_EXCEPTION;
					goto on_error;
				}
			}
#endif
		}
```

### 2.5.2

```c
		if (--_Py_Ticker < 0) {
                        if (*next_instr == SETUP_FINALLY) {
                                /* Make the last opcode before
                                   a try: finally: block uninterruptable. */
                                goto fast_next_opcode;
                        }
			_Py_Ticker = _Py_CheckInterval;
			tstate->tick_counter++;
#ifdef WITH_TSC
			ticked = 1;
#endif
			if (things_to_do) {
				if (Py_MakePendingCalls() < 0) {
					why = WHY_EXCEPTION;
					goto on_error;
				}
				if (things_to_do)
					/* MakePendingCalls() didn't succeed.
					   Force early re-execution of this
					   "periodic" code, possibly after
					   a thread switch */
					_Py_Ticker = 0;
			}
#ifdef WITH_THREAD
			if (interpreter_lock) {
				/* Give another thread a chance */

				if (PyThreadState_Swap(NULL) != tstate)
					Py_FatalError("ceval: tstate mix-up");
				PyThread_release_lock(interpreter_lock);

				/* Other threads may run now */

				PyThread_acquire_lock(interpreter_lock, 1);
				if (PyThreadState_Swap(tstate) != NULL)
					Py_FatalError("ceval: orphan tstate");

				/* Check for thread interrupts */

				if (tstate->async_exc != NULL) {
					x = tstate->async_exc;
					tstate->async_exc = NULL;
					PyErr_SetNone(x);
					Py_DECREF(x);
					why = WHY_EXCEPTION;
					goto on_error;
				}
			}
#endif
		}
```

### 2.6.9

```c
        if (--_Py_Ticker < 0) {
            if (*next_instr == SETUP_FINALLY) {
                /* Make the last opcode before
                   a try: finally: block uninterruptable. */
                goto fast_next_opcode;
            }
            _Py_Ticker = _Py_CheckInterval;
            tstate->tick_counter++;
#ifdef WITH_TSC
            ticked = 1;
#endif
            if (things_to_do) {
                if (Py_MakePendingCalls() < 0) {
                    why = WHY_EXCEPTION;
                    goto on_error;
                }
                if (things_to_do)
                    /* MakePendingCalls() didn't succeed.
                       Force early re-execution of this
                       "periodic" code, possibly after
                       a thread switch */
                    _Py_Ticker = 0;
            }
#ifdef WITH_THREAD
            if (interpreter_lock) {
                /* Give another thread a chance */

                if (PyThreadState_Swap(NULL) != tstate)
                    Py_FatalError("ceval: tstate mix-up");
                PyThread_release_lock(interpreter_lock);

                /* Other threads may run now */

                PyThread_acquire_lock(interpreter_lock, 1);
                if (PyThreadState_Swap(tstate) != NULL)
                    Py_FatalError("ceval: orphan tstate");

                /* Check for thread interrupts */

                if (tstate->async_exc != NULL) {
                    x = tstate->async_exc;
                    tstate->async_exc = NULL;
                    PyErr_SetNone(x);
                    Py_DECREF(x);
                    why = WHY_EXCEPTION;
                    goto on_error;
                }
            }
#endif
        }
```

### 2.7.6

```c
        if (--_Py_Ticker < 0) {
            if (*next_instr == SETUP_FINALLY) {
                /* Make the last opcode before
                   a try: finally: block uninterruptible. */
                goto fast_next_opcode;
            }
            _Py_Ticker = _Py_CheckInterval;
            tstate->tick_counter++;
#ifdef WITH_TSC
            ticked = 1;
#endif
            if (pendingcalls_to_do) {
                if (Py_MakePendingCalls() < 0) {
                    why = WHY_EXCEPTION;
                    goto on_error;
                }
                if (pendingcalls_to_do)
                    /* MakePendingCalls() didn't succeed.
                       Force early re-execution of this
                       "periodic" code, possibly after
                       a thread switch */
                    _Py_Ticker = 0;
            }
#ifdef WITH_THREAD
            if (interpreter_lock) {
                /* Give another thread a chance */

                if (PyThreadState_Swap(NULL) != tstate)
                    Py_FatalError("ceval: tstate mix-up");
                PyThread_release_lock(interpreter_lock);

                /* Other threads may run now */

                PyThread_acquire_lock(interpreter_lock, 1);
                if (PyThreadState_Swap(tstate) != NULL)
                    Py_FatalError("ceval: orphan tstate");

                /* Check for thread interrupts */

                if (tstate->async_exc != NULL) {
                    x = tstate->async_exc;
                    tstate->async_exc = NULL;
                    PyErr_SetNone(x);
                    Py_DECREF(x);
                    why = WHY_EXCEPTION;
                    goto on_error;
                }
            }
#endif
        }
```

### 3.0.1

```c
		if (--_Py_Ticker < 0) {
			if (*next_instr == SETUP_FINALLY) {
				/* Make the last opcode before
				   a try: finally: block uninterruptable. */
				goto fast_next_opcode;
			}
			_Py_Ticker = _Py_CheckInterval;
			tstate->tick_counter++;
#ifdef WITH_TSC
			ticked = 1;
#endif
			if (things_to_do) {
				if (Py_MakePendingCalls() < 0) {
					why = WHY_EXCEPTION;
					goto on_error;
				}
				if (things_to_do)
					/* MakePendingCalls() didn't succeed.
					   Force early re-execution of this
					   "periodic" code, possibly after
					   a thread switch */
					_Py_Ticker = 0;
			}
#ifdef WITH_THREAD
			if (interpreter_lock) {
				/* Give another thread a chance */

				if (PyThreadState_Swap(NULL) != tstate)
					Py_FatalError("ceval: tstate mix-up");
				PyThread_release_lock(interpreter_lock);

				/* Other threads may run now */

				PyThread_acquire_lock(interpreter_lock, 1);
				if (PyThreadState_Swap(tstate) != NULL)
					Py_FatalError("ceval: orphan tstate");

				/* Check for thread interrupts */

				if (tstate->async_exc != NULL) {
					x = tstate->async_exc;
					tstate->async_exc = NULL;
					PyErr_SetNone(x);
					Py_DECREF(x);
					why = WHY_EXCEPTION;
					goto on_error;
				}
			}
#endif
		}

```

### 3.1.3

```c
        if (--_Py_Ticker < 0) {
            if (*next_instr == SETUP_FINALLY) {
                /* Make the last opcode before
                   a try: finally: block uninterruptable. */
                goto fast_next_opcode;
            }
            _Py_Ticker = _Py_CheckInterval;
            tstate->tick_counter++;
#ifdef WITH_TSC
            ticked = 1;
#endif
            if (pendingcalls_to_do) {
                if (Py_MakePendingCalls() < 0) {
                    why = WHY_EXCEPTION;
                    goto on_error;
                }
                if (pendingcalls_to_do)
                    /* MakePendingCalls() didn't succeed.
                       Force early re-execution of this
                       "periodic" code, possibly after
                       a thread switch */
                    _Py_Ticker = 0;
            }
#ifdef WITH_THREAD
            if (interpreter_lock) {
                /* Give another thread a chance */

                if (PyThreadState_Swap(NULL) != tstate)
                    Py_FatalError("ceval: tstate mix-up");
                PyThread_release_lock(interpreter_lock);

                /* Other threads may run now */

                PyThread_acquire_lock(interpreter_lock, 1);
                if (PyThreadState_Swap(tstate) != NULL)
                    Py_FatalError("ceval: orphan tstate");

                /* Check for thread interrupts */

                if (tstate->async_exc != NULL) {
                    x = tstate->async_exc;
                    tstate->async_exc = NULL;
                    PyErr_SetNone(x);
                    Py_DECREF(x);
                    why = WHY_EXCEPTION;
                    goto on_error;
                }
            }
#endif
        }
```

### 3.2.3

```c
        if (_Py_atomic_load_relaxed(&eval_breaker)) {
            if (*next_instr == SETUP_FINALLY) {
                /* Make the last opcode before
                   a try: finally: block uninterruptible. */
                goto fast_next_opcode;
            }
            tstate->tick_counter++;
#ifdef WITH_TSC
            ticked = 1;
#endif
            if (_Py_atomic_load_relaxed(&pendingcalls_to_do)) {
                if (Py_MakePendingCalls() < 0) {
                    why = WHY_EXCEPTION;
                    goto on_error;
                }
            }
#ifdef WITH_THREAD
            if (_Py_atomic_load_relaxed(&gil_drop_request)) {
                /* Give another thread a chance */
                if (PyThreadState_Swap(NULL) != tstate)
                    Py_FatalError("ceval: tstate mix-up");
                drop_gil(tstate);

                /* Other threads may run now */

                take_gil(tstate);
                if (PyThreadState_Swap(tstate) != NULL)
                    Py_FatalError("ceval: orphan tstate");
            }
#endif
            /* Check for asynchronous exceptions. */
            if (tstate->async_exc != NULL) {
                x = tstate->async_exc;
                tstate->async_exc = NULL;
                UNSIGNAL_ASYNC_EXC();
                PyErr_SetNone(x);
                Py_DECREF(x);
                why = WHY_EXCEPTION;
                goto on_error;
            }
        }


static void drop_gil(PyThreadState *tstate)
{
    if (!_Py_atomic_load_relaxed(&gil_locked))
        Py_FatalError("drop_gil: GIL is not locked");
    /* tstate is allowed to be NULL (early interpreter init) */
    if (tstate != NULL) {
        /* Sub-interpreter support: threads might have been switched
           under our feet using PyThreadState_Swap(). Fix the GIL last
           holder variable so that our heuristics work. */
        _Py_atomic_store_relaxed(&gil_last_holder, tstate);
    }

    MUTEX_LOCK(gil_mutex);
    _Py_ANNOTATE_RWLOCK_RELEASED(&gil_locked, /*is_write=*/1);
    _Py_atomic_store_relaxed(&gil_locked, 0);
    COND_SIGNAL(gil_cond);
    MUTEX_UNLOCK(gil_mutex);
    
#ifdef FORCE_SWITCHING
    if (_Py_atomic_load_relaxed(&gil_drop_request) && tstate != NULL) {
        MUTEX_LOCK(switch_mutex);
        /* Not switched yet => wait */
        if (_Py_atomic_load_relaxed(&gil_last_holder) == tstate) {
	    RESET_GIL_DROP_REQUEST();
            /* NOTE: if COND_WAIT does not atomically start waiting when
               releasing the mutex, another thread can run through, take
               the GIL and drop it again, and reset the condition
               before we even had a chance to wait for it. */
            COND_WAIT(switch_cond, switch_mutex);
	}
        MUTEX_UNLOCK(switch_mutex);
    }
#endif
}

static void take_gil(PyThreadState *tstate)
{
    int err;
    if (tstate == NULL)
        Py_FatalError("take_gil: NULL tstate");

    err = errno;
    MUTEX_LOCK(gil_mutex);

    if (!_Py_atomic_load_relaxed(&gil_locked))
        goto _ready;
    
    while (_Py_atomic_load_relaxed(&gil_locked)) {
        int timed_out = 0;
        unsigned long saved_switchnum;

        saved_switchnum = gil_switch_number;
        COND_TIMED_WAIT(gil_cond, gil_mutex, INTERVAL, timed_out);
        /* If we timed out and no switch occurred in the meantime, it is time
           to ask the GIL-holding thread to drop it. */
        if (timed_out &&
            _Py_atomic_load_relaxed(&gil_locked) &&
            gil_switch_number == saved_switchnum) {
            SET_GIL_DROP_REQUEST();
        }
    }
_ready:
#ifdef FORCE_SWITCHING
    /* This mutex must be taken before modifying gil_last_holder (see drop_gil()). */
    MUTEX_LOCK(switch_mutex);
#endif
    /* We now hold the GIL */
    _Py_atomic_store_relaxed(&gil_locked, 1);
    _Py_ANNOTATE_RWLOCK_ACQUIRED(&gil_locked, /*is_write=*/1);

    if (tstate != _Py_atomic_load_relaxed(&gil_last_holder)) {
        _Py_atomic_store_relaxed(&gil_last_holder, tstate);
        ++gil_switch_number;
    }

#ifdef FORCE_SWITCHING
    COND_SIGNAL(switch_cond);
    MUTEX_UNLOCK(switch_mutex);
#endif
    if (_Py_atomic_load_relaxed(&gil_drop_request)) {
        RESET_GIL_DROP_REQUEST();
    }
    if (tstate->async_exc != NULL) {
        _PyEval_SignalAsyncExc();
    }
    
    MUTEX_UNLOCK(gil_mutex);
    errno = err;
}

```



