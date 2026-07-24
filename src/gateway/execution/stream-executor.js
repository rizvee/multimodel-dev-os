import { validateExecutionRequest } from '../contracts/execution-request.js';
import { createExecutionResult, validateExecutionResult } from '../contracts/execution-result.js';
import { createExecutionError } from '../contracts/execution-error.js';
import { evaluateExecutionGate } from './execution-gate.js';
import { validateTransport } from './transport-contract.js';
import { resolveEnvironmentCredential } from '../credentials/resolver.js';
import { redactSensitiveValue } from '../credentials/redaction.js';
import { normalizeOpenAIExecutionRequest } from '../adapters/openai-compatible/request.js';
import { normalizeOpenAIResponse } from '../adapters/openai-compatible/response.js';
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
  const getNow = typeof clock === 'function' ? clock : () => 1800000000;
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

  function buildPreflightError(code, message, status = 400, category = null) {
    const safeCategory = EXECUTION_ERROR_CATEGORIES.includes(category || code) ? (category || code) : 'internal_execution_error';
    return {
      success: false,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code,
        category: safeCategory,
        message,
        status,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
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
  if (!transport || typeof transport !== 'object' || typeof transport.stream !== 'function') {
    return buildPreflightError('internal_execution_error', 'Injected transport stream contract validation failed', 500, 'internal_execution_error');
  }

  // 5. Cancellation Pre-check
  if (signal?.aborted) {
    const abortCode = signal.reason?.gatewayError?.error?.code || signal.reason?.code || 'cancelled';
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
  }

  // 7. Request Normalization & Byte Limit
  let normalizedReq = null;
  try {
    const normResult = normalizeOpenAIExecutionRequest(execution_request);
    if (!normResult.success) {
      if (resolvedCredential) resolvedCredential.destroy();
      return buildPreflightError('request_invalid', 'Failed to normalize execution request payload', 400, 'request_invalid');
    }
    normalizedReq = normResult.payload;
    const reqBytes = Buffer.byteLength(JSON.stringify(normalizedReq), 'utf8');
    if (reqBytes > execution_request.policy.max_request_bytes) {
      if (resolvedCredential) resolvedCredential.destroy();
      return buildPreflightError('request_too_large', `Normalized request size (${reqBytes} bytes) exceeds policy max_request_bytes`, 413, 'request_too_large');
    }
  } catch (err) {
    if (resolvedCredential) resolvedCredential.destroy();
    return buildPreflightError('request_invalid', `Request normalization error: ${err.message}`, 400, 'request_invalid');
  }

  // 8. Stream Acquisition (Race transport.stream against signal abort & timeout)
  const policyTimeout = execution_request.policy.request_timeout_ms || 30000;
  const runtimeCap = runtime_timeout_ms || Infinity;
  const effectiveTimeoutMs = Math.min(policyTimeout, runtimeCap);
  const effectiveIdleTimeoutMs = idle_timeout_ms || execution_request.policy.response_timeout_ms || 30000;

  let rawStreamResult = null;
  let acquisitionError = null;

  const streamPromise = Promise.resolve().then(() => transport.stream({
    endpoint: execution_request.endpoint,
    payload: normalizedReq,
    credential: resolvedCredential,
    signal,
    request_timeout_ms: effectiveTimeoutMs,
    response_timeout_ms: effectiveIdleTimeoutMs,
    max_request_bytes: execution_request.policy.max_request_bytes,
    max_response_bytes: execution_request.policy.max_response_bytes,
    stream: true,
  }));

  let signalListener = null;
  const signalPromise = new Promise((_, reject) => {
    if (signal) {
      if (signal.aborted) {
        const abortCode = signal.reason?.gatewayError?.error?.code || signal.reason?.code || 'cancelled';
        const isTimeout = abortCode === 'timeout';
        const err = new Error(isTimeout ? 'Governed stream acquisition timed out' : 'Governed stream acquisition cancelled');
        err.code = isTimeout ? 'timeout' : 'cancelled';
        reject(err);
        return;
      }
      signalListener = () => {
        const abortCode = signal.reason?.gatewayError?.error?.code || signal.reason?.code || 'cancelled';
        const isTimeout = abortCode === 'timeout';
        const err = new Error(isTimeout ? 'Governed stream acquisition timed out' : 'Governed stream acquisition cancelled');
        err.code = isTimeout ? 'timeout' : 'cancelled';
        reject(err);
      };
      signal.addEventListener('abort', signalListener, { once: true });
    }
  });

  try {
    rawStreamResult = await Promise.race([streamPromise, signalPromise]);
  } catch (err) {
    acquisitionError = err;
  } finally {
    if (signal && signalListener) {
      signal.removeEventListener('abort', signalListener);
    }
    streamPromise.catch(() => {});
  }

  if (acquisitionError) {
    if (resolvedCredential) resolvedCredential.destroy();
    const isTimeout = acquisitionError.code === 'timeout' || acquisitionError.name === 'TimeoutError';
    const isCancel = acquisitionError.code === 'cancelled' || acquisitionError.name === 'AbortError' || signal?.aborted;
    const errCode = isTimeout ? 'timeout' : (isCancel ? 'cancelled' : 'stream_error');
    const errStatus = isTimeout ? 504 : (isCancel ? 499 : 502);

    return buildPreflightError(errCode, acquisitionError.message || 'Stream acquisition failed', errStatus, errCode);
  }

  if (!rawStreamResult || typeof rawStreamResult !== 'object' || typeof rawStreamResult.status !== 'number') {
    if (resolvedCredential) resolvedCredential.destroy();
    return buildPreflightError('stream_error', 'Invalid transport stream result object', 502, 'stream_error');
  }

  if (rawStreamResult.status >= 400) {
    if (resolvedCredential) resolvedCredential.destroy();
    const rawError = rawStreamResult.error || { message: `Upstream HTTP ${rawStreamResult.status}` };
    const normErr = provider_adapter.classifyError ? provider_adapter.classifyError(rawError) : { code: 'upstream_server_error' };
    const errCode = EXECUTION_ERROR_CATEGORIES.includes(normErr.code) ? normErr.code : 'upstream_server_error';

    return buildPreflightError(errCode, isString(rawError.message) ? rawError.message : `Upstream HTTP ${rawStreamResult.status}`, rawStreamResult.status, errCode);
  }

  if (!isAsyncIterable(rawStreamResult.body)) {
    if (resolvedCredential) resolvedCredential.destroy();
    return buildPreflightError('stream_error', 'Transport stream body must be an AsyncIterable', 502, 'stream_error');
  }

  // 9. Incremental Consumption Stream Generator & Encapsulated Session
  let credentialDestroyed = false;
  const destroyCredOnce = () => {
    if (!credentialDestroyed) {
      credentialDestroyed = true;
      if (resolvedCredential) {
        resolvedCredential.destroy();
      }
    }
  };

  const maxResponseBytes = execution_request.policy.max_response_bytes || 5242880;
  const sseParser = createOpenAISSEParser({
    max_buffer_size: maxResponseBytes,
    max_event_size: maxResponseBytes,
    context: {
      request_id: execReqId,
      provider_id: provId,
      model_id: modId,
    },
  });

  let cumulativeBytes = 0;
  let chunkCount = 0;
  let terminalDoneReceived = false;

  const rawIterator = rawStreamResult.body[Symbol.asyncIterator]();

  const cancelSession = () => {
    destroyCredOnce();
    if (typeof rawIterator.return === 'function') {
      rawIterator.return().catch(() => {});
    }
  };

  async function* safeEventGenerator() {
    try {
      while (!terminalDoneReceived) {
        if (signal?.aborted) {
          const abortCode = signal.reason?.gatewayError?.error?.code || signal.reason?.code || 'cancelled';
          const isTimeout = abortCode === 'timeout';
          const err = createExecutionError({
            contract_version: EXECUTION_CONTRACT_VERSION,
            code: isTimeout ? 'timeout' : 'cancelled',
            category: isTimeout ? 'timeout' : 'cancelled',
            message: isTimeout ? 'Governed stream timed out during iteration' : 'Governed stream cancelled by client',
            status: isTimeout ? 504 : 499,
            provider_id: provId,
            request_id: execReqId,
            redacted: true,
          });
          throw err;
        }

        // Race iterator.next() against signal abort and idle timeout
        let nextResult;
        let idleTimer = null;
        const idlePromise = new Promise((_, reject) => {
          idleTimer = setTimeout(() => {
            const err = createExecutionError({
              contract_version: EXECUTION_CONTRACT_VERSION,
              code: 'timeout',
              category: 'timeout',
              message: `Governed stream idle timeout after ${effectiveIdleTimeoutMs}ms`,
              status: 504,
              provider_id: provId,
              request_id: execReqId,
              redacted: true,
            });
            reject(err);
          }, effectiveIdleTimeoutMs);
          if (idleTimer.unref) idleTimer.unref();
        });

        const iterPromise = rawIterator.next();
        iterPromise.catch(() => {});

        try {
          nextResult = await Promise.race([iterPromise, idlePromise]);
        } finally {
          if (idleTimer) clearTimeout(idleTimer);
        }

        if (nextResult.done) {
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
              code: 'stream_error',
              category: 'stream_error',
              message: ev.error?.message || 'Upstream SSE parse error',
              status: 502,
              provider_id: provId,
              request_id: execReqId,
              redacted: true,
            });
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

            let normalizedChunk = ev.data;
            if (typeof provider_adapter.stream === 'function') {
              const streamRes = provider_adapter.stream(ev.data);
              if (streamRes && streamRes.type === 'chunk' && streamRes.gateway_response) {
                normalizedChunk = streamRes.gateway_response;
              } else if (streamRes && streamRes.success === false) {
                normalizedChunk = null;
              }
            }

            if (!normalizedChunk) {
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

            chunkCount++;
            yield {
              type: 'chunk',
              gateway_response: normalizedChunk,
            };
          }
        }
      }
    } finally {
      destroyCredOnce();
      if (typeof rawIterator.return === 'function') {
        rawIterator.return().catch(() => {});
      }
    }
  }

  return {
    success: true,
    session: {
      event_stream: safeEventGenerator(),
      request_id: execReqId,
      provider_id: provId,
      model_id: modId,
      cancel: cancelSession,
    },
  };
}
