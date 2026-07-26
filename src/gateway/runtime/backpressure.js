export function waitForDrain(response, signal, session = null) {
  if (!response || response.writableEnded || response.destroyed) {
    return Promise.reject(new Error('Response closed before drain'));
  }
  if (signal?.aborted) {
    return Promise.reject(signal.reason || new Error('Aborted while waiting for drain'));
  }
  return new Promise((resolve, reject) => {
    let cleanedUp = false;
    let unsubscribeFinalization = null;
    let settled = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      response.removeListener('drain', onDrain);
      response.removeListener('close', onClose);
      response.removeListener('error', onClose);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      if (typeof unsubscribeFinalization === 'function') {
        const unsubscribe = unsubscribeFinalization;
        unsubscribeFinalization = null;
        try {
          unsubscribe();
        } catch (_) {}
      }
    };

    const safeResolve = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const safeReject = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const onDrain = () => {
      safeResolve();
    };

    const onClose = () => {
      safeReject(new Error('Premature close while waiting for drain'));
    };

    const onAbort = () => {
      safeReject(signal.reason || new Error('Aborted while waiting for drain'));
    };

    const handleSummary = (summary) => {
      if (summary?.state === 'cancelled' || summary?.state === 'timed_out' || summary?.state === 'failed') {
        safeReject(summary.safe_error || new Error(`Stream session ${summary.state}`));
      }
    };

    response.once('drain', onDrain);
    response.once('close', onClose);
    response.once('error', onClose);
    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    if (typeof session?.subscribeFinalization === 'function') {
      unsubscribeFinalization = session.subscribeFinalization(handleSummary);
    } else if (session?.completion && typeof session.completion.then === 'function') {
      session.completion.then(handleSummary).catch(() => {});
    }

    if (session?.getSummary) {
      try {
        const currentSummary = session.getSummary();
        if (currentSummary?.state === 'cancelled' || currentSummary?.state === 'timed_out' || currentSummary?.state === 'failed') {
          safeReject(currentSummary.safe_error || new Error(`Stream session ${currentSummary.state}`));
        }
      } catch (_) {}
    }
  });
}
