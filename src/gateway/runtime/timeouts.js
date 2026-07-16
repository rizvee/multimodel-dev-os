export function createRuntimeTimer(callback, delayMs) {
  const timer = setTimeout(callback, delayMs);
  timer.unref?.();
  return timer;
}

export function clearRuntimeTimer(timer) {
  if (timer) clearTimeout(timer);
}

export function withRuntimeTimeout(promise, { timeoutMs, requestId, createTimeoutError }) {
  let timer = null;
  return Promise.race([
    promise.finally(() => clearRuntimeTimer(timer)),
    new Promise((_, reject) => {
      timer = createRuntimeTimer(() => reject(createTimeoutError(requestId)), timeoutMs);
    }),
  ]);
}
