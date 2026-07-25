import { validateExecutionRequest } from '../contracts/execution-request.js';
import { createExecutionError, validateExecutionError } from '../contracts/execution-error.js';
import { evaluateExecutionGate } from './execution-gate.js';
import { validateTransport } from './transport-contract.js';
import { resolveEnvironmentCredential } from '../credentials/resolver.js';
import { redactSensitiveValue } from '../credentials/redaction.js';
import { normalizeOpenAIExecutionRequest } from '../adapters/openai-compatible/request.js';
import { createOpenAISSEParser } from '../adapters/openai-compatible/sse.js';
import { validateGatewayResponse } from '../protocol/validation.js';
import { EXECUTION_CONTRACT_VERSION, EXECUTION_ERROR_CATEGORIES } from '../protocol/constants.js';

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isString(val) {
  return typeof val === 'string';
}

function isAsyncIterable(val) {
  return val !== null && typeof val === 'object' && typeof val[Symbol.asyncIterator] === 'function';
}

function isRawSocketOrStream(val) {
  if (!val || typeof val !== 'object') return false;
  if (typeof val.pipe === 'function' || typeof val.read === 'function' || typeof val.addListener === 'function') {
    return true;
  }
  if (val._readableState !== undefined || val.socket !== undefined || val.net !== undefined) {
    return true;
  }
  return false;
}

export async function executeGovernedStream({
  execution_request = null,
  provider_adapter = null,
  transport = null,
  environment = null,
  clock = null,
  requestId = null,
  signal = null,
  runtime_timeout_ms = null,
  idle_timeout_ms = null,
} = {}) {
  const getNow = typeof clock === 'function' ? clock : (typeof clock?.now === 'function' ? () => clock.now() : () => 1800000000);
  const startTime = getNow();
  const execReqId = isString(requestId) && requestId.length > 0
    ? requestId
    : (isString(execution_request?.request_id) && execution_request.request_id.length > 0 ? execution_request.request_id : 'req-default');
  const provId = isString(execution_request?.provider_id) && execution_request.provider_id.length > 0
    ? execution_request.provider_id
    : 'unknown-provider';
  const modId = isString(execution_request?.model_id) && execution_request.model_id.length > 0
    ? execution_request.model_id
    : 'unknown-model';

  let secretsToRedact = [];

  function sanitizeMsg(msg) {
    if (!isString(msg)) return 'Stream execution error';
    return redactSensitiveValue(msg, secretsToRedact);
  }

  function buildPreflightError(code, message, status = 400, category = null) {
    const safeCategory = EXECUTION_ERROR_CATEGORIES.includes(category || code) ? (category || code) : 'internal_execution_error';
    const cleanMsg = sanitizeMsg(message);
    const err = createExecutionError({
      contract_version: EXECUTION_CONTRACT_VERSION,
      code,
      category: safeCategory,
      message: cleanMsg,
      status,
      provider_id: provId,
      request_id: execReqId,
      redacted: true,
    });
    return {
      success: false,
      error: err,
    };
  }

  // 1. Basic Request Validation
  if (!execution_request || !isObject(execution_request)) {
    return buildPreflightError('request_invalid', 'Execution request object is required', 400, 'request_invalid');
  }

  const reqCheck = validateExecutionRequest(execution_request);
  if (!reqCheck.success) {
    const firstErr = reqCheck.errors?.[0];
    const code = firstErr?.code || 'request_invalid';
    return buildPreflightError(code, firstErr?.message || 'Execution request contract validation failed', 400, code);
  }

  // 2. Stream Capability Pre-check
  if (execution_request.gateway_request?.stream !== true) {
    return buildPreflightError('request_invalid', 'Gateway request stream parameter must be true for executeGovernedStream', 400, 'request_invalid');
  }

  if (execution_request.capability?.sse_streaming !== true) {
    return buildPreflightError('unsupported_capability', 'Provider capability sse_streaming must be true', 400, 'unsupported_capability');
  }

  // 3. Execution Gate Evaluation
  const gate = evaluateExecutionGate({
    policy: execution_request.policy,
    provider_id: provId,
    provider_adapter,
    request: execution_request,
    endpoint: execution_request.endpoint,
    capability: execution_request.capability,
    credential_ref: execution_request.credential_ref,
  });

  if (gate.allowed !== true) {
    return {
      success: false,
      error: gate.error,
    };
  }

  // 4. Transport Validation
  const transportVal = validateTransport(transport, { requiresStream: true, requiresExecute: false });
  if (!transportVal.success) {
    return {
      success: false,
      error: transportVal.error,
    };
  }

  // 5. Cancellation Pre-check
  if (signal?.aborted) {
    const abortReason = signal.reason;
    const abortCode = abortReason?.gatewayError?.error?.code || abortReason?.code || 'cancelled';
    const isTimeout = abortCode === 'timeout';
    const errCode = isTimeout ? 'timeout' : 'cancelled';
    const errStatus = isTimeout ? 504 : 499;

    return buildPreflightError(errCode, isTimeout ? 'Governed stream timed out before invocation' : 'Governed stream cancelled before invocation', errStatus, errCode);
  }

  // 6. Credential Resolution
  let resolvedCredential = null;
  if (execution_request.credential_ref) {
    const credResolution = resolveEnvironmentCredential({
      credential_ref: execution_request.credential_ref,
      provider_id: provId,
      provider_adapter,
      environment,
    });

    if (!credResolution.success || !credResolution.credential) {
      return buildPreflightError(
        'credential_unavailable',
        credResolution.error?.message || 'Required environment credential is unavailable for execution',
        503,
        'credential_unavailable'
      );
    }
    resolvedCredential = credResolution.credential;
    if (resolvedCredential && isString(resolvedCredential.secret)) {
      secretsToRedact.push(resolvedCredential.secret);
    }
  }

  let credentialDestroyed = false;
  const destroyCredOnce = () => {
    if (!credentialDestroyed) {
      credentialDestroyed = true;
      if (resolvedCredential) {
        resolvedCredential.destroy();
      }
    }
  };

  // 7. Request Normalization & Byte Limit Check
  let normalizedReq = null;
  try {
    const normResult = normalizeOpenAIExecutionRequest(execution_request);
    if (!normResult.success) {
      destroyCredOnce();
      return buildPreflightError('request_invalid', 'Failed to normalize execution request payload', 400, 'request_invalid');
    }
    normalizedReq = normResult.payload;
    const reqBytes = Buffer.byteLength(JSON.stringify(normalizedReq), 'utf8');
    if (reqBytes > execution_request.policy.max_request_bytes) {
      destroyCredOnce();
      return buildPreflightError('request_too_large', `Normalized request size (${reqBytes} bytes) exceeds policy max_request_bytes`, 413, 'request_too_large');
    }
  } catch (err) {
    destroyCredOnce();
    return buildPreflightError('request_invalid', `Request normalization error: ${err.message}`, 400, 'request_invalid');
  }

  // 8. Session Abort & Timeout Lifecycle
  const sessionController = new AbortController();

  let onCallerAbort = null;
  if (signal) {
    onCallerAbort = () => {
      if (!sessionController.signal.aborted) {
        sessionController.abort(signal.reason || new Error('Caller aborted stream'));
      }
    };
    if (signal.aborted) {
      onCallerAbort();
    } else {
      signal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  const policyTimeout = execution_request.policy.request_timeout_ms || 30000;
  const runtimeCap = runtime_timeout_ms || Infinity;
  const effectiveTimeoutMs = Math.min(policyTimeout, runtimeCap);
  const effectiveIdleTimeoutMs = idle_timeout_ms || execution_request.policy.response_timeout_ms || 30000;

  let totalTimeoutTimer = setTimeout(() => {
    if (!sessionController.signal.aborted) {
      const err = createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'timeout',
        category: 'timeout',
        message: `Governed stream execution timed out after ${effectiveTimeoutMs}ms`,
        status: 504,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      });
      sessionController.abort(err);
    }
  }, effectiveTimeoutMs);
  if (totalTimeoutTimer.unref) totalTimeoutTimer.unref();

  // 9. Stream Acquisition
  if (sessionController.signal.aborted) {
    destroyCredOnce();
    if (totalTimeoutTimer) clearTimeout(totalTimeoutTimer);
    if (signal && onCallerAbort) signal.removeEventListener('abort', onCallerAbort);
    const reason = sessionController.signal.reason;
    const isTimeout = reason?.code === 'timeout' || reason?.category === 'timeout';
    return buildPreflightError(isTimeout ? 'timeout' : 'cancelled', isTimeout ? 'Governed stream timed out' : 'Governed stream cancelled', isTimeout ? 504 : 499, isTimeout ? 'timeout' : 'cancelled');
  }

  let rawStreamResult = null;
  let acquisitionError = null;

  const streamPromise = Promise.resolve().then(() => transport.stream({
    endpoint: execution_request.endpoint,
    payload: normalizedReq,
    credential: resolvedCredential,
    signal: sessionController.signal,
    request_timeout_ms: effectiveTimeoutMs,
    response_timeout_ms: effectiveIdleTimeoutMs,
    max_request_bytes: execution_request.policy.max_request_bytes,
    max_response_bytes: execution_request.policy.max_response_bytes,
    stream: true,
  }));
  streamPromise.catch(() => {});

  const acqSignalPromise = new Promise((_, reject) => {
    if (sessionController.signal.aborted) {
      reject(sessionController.signal.reason);
      return;
    }
    const onAcqAbort = () => reject(sessionController.signal.reason);
    sessionController.signal.addEventListener('abort', onAcqAbort, { once: true });
  });
  acqSignalPromise.catch(() => {});

  try {
    rawStreamResult = await Promise.race([streamPromise, acqSignalPromise]);
  } catch (err) {
    acquisitionError = err;
  }

  if (acquisitionError) {
    destroyCredOnce();
    if (totalTimeoutTimer) clearTimeout(totalTimeoutTimer);
    if (signal && onCallerAbort) signal.removeEventListener('abort', onCallerAbort);

    const isTimeout = acquisitionError.code === 'timeout' || acquisitionError.category === 'timeout' || acquisitionError.name === 'TimeoutError';
    const isCancel = acquisitionError.code === 'cancelled' || acquisitionError.category === 'cancelled' || acquisitionError.name === 'AbortError' || sessionController.signal.aborted;
    const errCode = isTimeout ? 'timeout' : (isCancel ? 'cancelled' : 'stream_error');
    const errStatus = isTimeout ? 504 : (isCancel ? 499 : 502);

    return buildPreflightError(errCode, acquisitionError.message || 'Stream acquisition failed', errStatus, errCode);
  }

  if (!rawStreamResult || typeof rawStreamResult !== 'object' || typeof rawStreamResult.status !== 'number' || !Number.isInteger(rawStreamResult.status) || rawStreamResult.status < 100 || rawStreamResult.status > 599) {
    destroyCredOnce();
    if (totalTimeoutTimer) clearTimeout(totalTimeoutTimer);
    if (signal && onCallerAbort) signal.removeEventListener('abort', onCallerAbort);
    return buildPreflightError('stream_error', 'Invalid transport stream result status code', 502, 'stream_error');
  }

  if (rawStreamResult.status >= 400) {
    destroyCredOnce();
    if (totalTimeoutTimer) clearTimeout(totalTimeoutTimer);
    if (signal && onCallerAbort) signal.removeEventListener('abort', onCallerAbort);

    const rawError = rawStreamResult.error || { message: `Upstream HTTP ${rawStreamResult.status}` };
    const normErr = provider_adapter.classifyError ? provider_adapter.classifyError(rawError) : { code: 'upstream_server_error' };
    const errCode = EXECUTION_ERROR_CATEGORIES.includes(normErr.code) ? normErr.code : 'upstream_server_error';

    return buildPreflightError(errCode, isString(rawError.message) ? rawError.message : `Upstream HTTP ${rawStreamResult.status}`, rawStreamResult.status, errCode);
  }

  if (!isAsyncIterable(rawStreamResult.body) || isRawSocketOrStream(rawStreamResult.body)) {
    destroyCredOnce();
    if (totalTimeoutTimer) clearTimeout(totalTimeoutTimer);
    if (signal && onCallerAbort) signal.removeEventListener('abort', onCallerAbort);
    return buildPreflightError('stream_error', 'Transport stream body must be an AsyncIterable and not a raw socket/stream', 502, 'stream_error');
  }

  const rawIterator = rawStreamResult.body[Symbol.asyncIterator]();
  if (!rawIterator || typeof rawIterator !== 'object' || typeof rawIterator.next !== 'function') {
    destroyCredOnce();
    if (totalTimeoutTimer) clearTimeout(totalTimeoutTimer);
    if (signal && onCallerAbort) signal.removeEventListener('abort', onCallerAbort);
    return buildPreflightError('stream_error', 'Transport stream body iterator is missing next() function', 502, 'stream_error');
  }

  // 10. Session Summary & Incremental Consumption Generator
  let sessionState = 'active'; // 'completed' | 'failed' | 'cancelled'
  let attemptCount = 1;
  let chunkCount = 0;
  let cumulativeBytes = 0;
  let terminalDoneReceived = false;
  let finalFinishReason = null;
  let capturedUsage = null;
  let sessionError = null;
  const startedAt = startTime;
  let completedAt = null;

  const maxResponseBytes = execution_request.policy.max_response_bytes || 5242880;
  const sseParser = createOpenAISSEParser({
    max_buffer_size: maxResponseBytes,
    max_event_size: maxResponseBytes,
    context: {
      request_id: execReqId,
      provider_id: provId,
      model_id: modId,
      capability: execution_request.capability,
      created: startTime,
    },
  });

  const cancelSession = (reason) => {
    if (sessionState === 'active') {
      sessionState = 'cancelled';
      completedAt = getNow();
    }
    destroyCredOnce();
    if (!sessionController.signal.aborted) {
      const err = reason || createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'cancelled',
        category: 'cancelled',
        message: 'Governed stream cancelled by client',
        status: 499,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      });
      sessionController.abort(err);
    }
    if (rawIterator && typeof rawIterator.return === 'function') {
      try {
        const retP = rawIterator.return();
        if (retP && typeof retP.catch === 'function') retP.catch(() => {});
      } catch (_) {}
    }
  };

  async function* safeEventGenerator() {
    try {
      while (!terminalDoneReceived) {
        if (sessionController.signal.aborted) {
          const reason = sessionController.signal.reason;
          const isTimeout = reason?.code === 'timeout' || reason?.category === 'timeout';
          const err = createExecutionError({
            contract_version: EXECUTION_CONTRACT_VERSION,
            code: isTimeout ? 'timeout' : 'cancelled',
            category: isTimeout ? 'timeout' : 'cancelled',
            message: isTimeout ? 'Governed stream execution timed out during iteration' : 'Governed stream cancelled by client',
            status: isTimeout ? 504 : 499,
            provider_id: provId,
            request_id: execReqId,
            redacted: true,
          });
          throw err;
        }

        let idleTimer = null;
        const idlePromise = new Promise((_, reject) => {
          idleTimer = setTimeout(() => {
            reject(createExecutionError({
              contract_version: EXECUTION_CONTRACT_VERSION,
              code: 'timeout',
              category: 'timeout',
              message: `Governed stream idle timeout after ${effectiveIdleTimeoutMs}ms`,
              status: 504,
              provider_id: provId,
              request_id: execReqId,
              redacted: true,
            }));
          }, effectiveIdleTimeoutMs);
          if (idleTimer.unref) idleTimer.unref();
        });
        idlePromise.catch(() => {});

        const iterSignalPromise = new Promise((_, reject) => {
          if (sessionController.signal.aborted) {
            reject(sessionController.signal.reason);
            return;
          }
          const onIterAbort = () => reject(sessionController.signal.reason);
          sessionController.signal.addEventListener('abort', onIterAbort, { once: true });
        });
        iterSignalPromise.catch(() => {});

        const iterPromise = Promise.resolve().then(() => rawIterator.next());
        iterPromise.catch(() => {});

        let nextResult;
        try {
          nextResult = await Promise.race([iterPromise, idlePromise, iterSignalPromise]);
        } finally {
          if (idleTimer) clearTimeout(idleTimer);
        }

        if (!nextResult || typeof nextResult !== 'object') {
          throw createExecutionError({
            contract_version: EXECUTION_CONTRACT_VERSION,
            code: 'stream_error',
            category: 'stream_error',
            message: 'Malformed iterator next() result object',
            status: 502,
            provider_id: provId,
            request_id: execReqId,
            redacted: true,
          });
        }

        if (nextResult.done) {
          if (!terminalDoneReceived) {
            const flushedEvents = sseParser.flush();
            for (const ev of flushedEvents) {
              if (ev.type === 'done') {
                terminalDoneReceived = true;
              }
            }
          }
          if (!terminalDoneReceived) {
            throw createExecutionError({
              contract_version: EXECUTION_CONTRACT_VERSION,
              code: 'stream_error',
              category: 'stream_error',
              message: 'Upstream SSE stream terminated prematurely before [DONE]',
              status: 502,
              provider_id: provId,
              request_id: execReqId,
              redacted: true,
            });
          }
          break;
        }

        const chunkValue = nextResult.value;
        let fragmentBytes = 0;

        if (typeof chunkValue === 'string') {
          fragmentBytes = Buffer.byteLength(chunkValue, 'utf8');
        } else if (Buffer.isBuffer(chunkValue) || chunkValue instanceof Uint8Array) {
          fragmentBytes = chunkValue.byteLength;
        } else {
          throw createExecutionError({
            contract_version: EXECUTION_CONTRACT_VERSION,
            code: 'stream_error',
            category: 'stream_error',
            message: 'Invalid stream chunk type (must be string, Buffer, or Uint8Array)',
            status: 502,
            provider_id: provId,
            request_id: execReqId,
            redacted: true,
          });
        }

        cumulativeBytes += fragmentBytes;
        if (cumulativeBytes > maxResponseBytes) {
          throw createExecutionError({
            contract_version: EXECUTION_CONTRACT_VERSION,
            code: 'response_too_large',
            category: 'response_too_large',
            message: `Governed stream response bytes (${cumulativeBytes}) exceeded policy max_response_bytes (${maxResponseBytes})`,
            status: 502,
            provider_id: provId,
            request_id: execReqId,
            redacted: true,
          });
        }

        const events = sseParser.feed(chunkValue);
        for (const ev of events) {
          if (ev.type === 'done') {
            terminalDoneReceived = true;
          } else if (ev.type === 'error') {
            throw createExecutionError({
              contract_version: EXECUTION_CONTRACT_VERSION,
              code: ev.error?.code || 'stream_error',
              category: EXECUTION_ERROR_CATEGORIES.includes(ev.error?.category || ev.error?.code) ? (ev.error?.category || ev.error?.code) : 'stream_error',
              message: sanitizeMsg(ev.error?.message || 'Upstream SSE parse error'),
              status: ev.error?.status || 502,
              provider_id: provId,
              request_id: execReqId,
              redacted: true,
            });
          } else if (ev.type === 'usage') {
            capturedUsage = ev.data;
          } else if (ev.type === 'chunk') {
            if (terminalDoneReceived) {
              throw createExecutionError({
                contract_version: EXECUTION_CONTRACT_VERSION,
                code: 'stream_error',
                category: 'stream_error',
                message: 'Received stream chunk data after terminal [DONE]',
                status: 502,
                provider_id: provId,
                request_id: execReqId,
                redacted: true,
              });
            }

            const normalizedChunk = ev.data;
            const val = validateGatewayResponse(normalizedChunk);
            if (!val.success) {
              throw createExecutionError({
                contract_version: EXECUTION_CONTRACT_VERSION,
                code: 'stream_error',
                category: 'stream_error',
                message: 'Failed to normalize stream chunk payload',
                status: 502,
                provider_id: provId,
                request_id: execReqId,
                redacted: true,
              });
            }

            if (normalizedChunk.choices?.[0]?.finish_reason) {
              finalFinishReason = normalizedChunk.choices[0].finish_reason;
            }

            chunkCount++;
            yield {
              type: 'chunk',
              gateway_response: normalizedChunk,
            };
          }
        }
      }

      sessionState = 'completed';
      completedAt = getNow();
    } catch (err) {
      if (sessionState === 'active') {
        const isTimeout = err?.code === 'timeout' || err?.category === 'timeout';
        sessionState = isTimeout ? 'failed' : (err?.code === 'cancelled' || err?.category === 'cancelled' ? 'cancelled' : 'failed');
        completedAt = getNow();
      }
      const safeCategory = EXECUTION_ERROR_CATEGORIES.includes(err?.category || err?.code) ? (err.category || err.code) : 'stream_error';
      const safeErr = createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: err?.code || 'stream_error',
        category: safeCategory,
        message: sanitizeMsg(err?.message || 'Stream processing failed'),
        status: err?.status || 502,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      });
      sessionError = safeErr;
      throw safeErr;
    } finally {
      if (totalTimeoutTimer) {
        clearTimeout(totalTimeoutTimer);
        totalTimeoutTimer = null;
      }
      if (signal && onCallerAbort) {
        signal.removeEventListener('abort', onCallerAbort);
      }
      destroyCredOnce();
      if (rawIterator && typeof rawIterator.return === 'function') {
        try {
          const retP = rawIterator.return();
          if (retP && typeof retP.catch === 'function') retP.catch(() => {});
        } catch (_) {}
      }
    }
  }

  const sessionObj = Object.freeze({
    event_stream: safeEventGenerator(),
    request_id: execReqId,
    provider_id: provId,
    model_id: modId,
    cancel: cancelSession,
    getSummary: () => Object.freeze({
      state: sessionState,
      attempt_count: attemptCount,
      chunk_count: chunkCount,
      upstream_byte_count: cumulativeBytes,
      timing: {
        started_at: startedAt,
        completed_at: completedAt || getNow(),
        duration_ms: (completedAt || getNow()) - startedAt,
      },
      usage: capturedUsage,
      finish_reason: finalFinishReason,
      safe_error: sessionError ? validateExecutionError(sessionError).value : null,
    }),
  });

  return {
    success: true,
    session: sessionObj,
  };
}
