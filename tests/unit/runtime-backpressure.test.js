import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { waitForDrain } from '../../src/gateway/runtime/backpressure.js';

describe('Runtime Backpressure Helper (waitForDrain)', () => {
  function createFakeResponse() {
    const res = new EventEmitter();
    res.writableEnded = false;
    res.destroyed = false;
    return res;
  }

  function createFakeSession(initialState = null, safeError = null) {
    const listeners = new Set();
    return {
      getSummary() {
        if (!initialState) return null;
        return { state: initialState, safe_error: safeError || new Error(`Session ${initialState}`) };
      },
      subscribeFinalization(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      emitFinalization(summary) {
        for (const cb of listeners) cb(summary);
      },
      listenerCount() {
        return listeners.size;
      },
    };
  }

  it('rejects immediately if response is ended, destroyed, or null', async () => {
    await expect(waitForDrain(null)).rejects.toThrow('Response closed before drain');

    const resEnded = createFakeResponse();
    resEnded.writableEnded = true;
    await expect(waitForDrain(resEnded)).rejects.toThrow('Response closed before drain');

    const resDestroyed = createFakeResponse();
    resDestroyed.destroyed = true;
    await expect(waitForDrain(resDestroyed)).rejects.toThrow('Response closed before drain');
  });

  it('rejects immediately if signal is already aborted', async () => {
    const res = createFakeResponse();
    const controller = new AbortController();
    controller.abort(new Error('User aborted'));
    await expect(waitForDrain(res, controller.signal)).rejects.toThrow('User aborted');
  });

  it('rejects immediately if session is already in a finalized failed state', async () => {
    const res = createFakeResponse();
    const err = new Error('Pre-failed session');
    const session = createFakeSession('failed', err);
    await expect(waitForDrain(res, null, session)).rejects.toThrow('Pre-failed session');
  });

  it('rejects if session finalization occurs synchronously or later during wait', async () => {
    const res = createFakeResponse();
    const session = createFakeSession();

    const drainPromise = waitForDrain(res, null, session);
    session.emitFinalization({ state: 'cancelled', safe_error: new Error('Cancelled by user') });

    await expect(drainPromise).rejects.toThrow('Cancelled by user');
  });

  it('resolves on drain event and unsubscribes all listeners', async () => {
    const res = createFakeResponse();
    const session = createFakeSession();

    const drainPromise = waitForDrain(res, null, session);
    expect(res.listenerCount('drain')).toBe(1);
    expect(res.listenerCount('close')).toBe(1);
    expect(res.listenerCount('error')).toBe(1);
    expect(session.listenerCount()).toBe(1);

    res.emit('drain');
    await drainPromise;

    expect(res.listenerCount('drain')).toBe(0);
    expect(res.listenerCount('close')).toBe(0);
    expect(res.listenerCount('error')).toBe(0);
    expect(session.listenerCount()).toBe(0);
  });

  it('does not reject if session finalizes after drain has already resolved', async () => {
    const res = createFakeResponse();
    const session = createFakeSession();

    const drainPromise = waitForDrain(res, null, session);
    res.emit('drain');
    await drainPromise;

    session.emitFinalization({ state: 'failed', safe_error: new Error('Late failure') });
    // Promise remains resolved without unhandled rejection
  });

  it('rejects on response close, error, or signal abort', async () => {
    // Response close
    const resClose = createFakeResponse();
    const closePromise = waitForDrain(resClose);
    resClose.emit('close');
    await expect(closePromise).rejects.toThrow('Premature close');

    // Response error
    const resErr = createFakeResponse();
    const errPromise = waitForDrain(resErr);
    resErr.emit('error', new Error('Socket error'));
    await expect(errPromise).rejects.toThrow('Premature close');

    // Signal abort
    const resAbort = createFakeResponse();
    const controller = new AbortController();
    const abortPromise = waitForDrain(resAbort, controller.signal);
    controller.abort(new Error('Abort signal triggered'));
    await expect(abortPromise).rejects.toThrow('Abort signal triggered');
  });

  it('guarantees settlement happens exactly once even with duplicate events', async () => {
    const res = createFakeResponse();
    const session = createFakeSession();

    const drainPromise = waitForDrain(res, null, session);
    res.emit('drain');
    res.emit('close');
    session.emitFinalization({ state: 'failed', safe_error: new Error('Duplicate failure') });

    await drainPromise; // successfully resolved
  });
});
