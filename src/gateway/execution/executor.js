import { validateExecutionRequest } from '../contracts/execution-request.js';
import { createExecutionResult, validateExecutionResult } from '../contracts/execution-result.js';
import { createExecutionError } from '../contracts/execution-error.js';
import { evaluateExecutionGate } from './execution-gate.js';
import { validateTransport } from './transport-contract.js';
import { resolveEnvironmentCredential } from '../credentials/resolver.js';
import { redactSensitiveValue } from '../credentials/redaction.js';
import { normalizeOpenAIExecutionRequest } from '../adapters/openai-compatible/request.js';
import { normalizeOpenAIResponse } from '../adapters/openai-compatible/response.js';
import { normalizeOpenAIError } from '../adapters/openai-compatible/error.js';
import { validateGatewayResponse } from '../protocol/validation.js';
import { EXECUTION_CONTRACT_VERSION, EXECUTION_ERROR_CATEGORIES } from '../protocol/constants.js';

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isString(val) {
  return typeof val === 'string';
}

export async function executeGovernedRequest({
  execution_request = null,
  provider_adapter = null,
  transport = null,
  environment = null,
  clock = null,
  requestId = null,
  signal = null,
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
  const execId = `exec-${execReqId}`;

  function buildSafeResult({
    state = 'failed',
    attempt_count = 0,
    gateway_response = null,
    error = null,
    start_time = startTime,
    end_time = getNow(),
    usage = null,
    metadata = {},
  } = {}) {
    const endT = end_time || getNow();
    const startT = start_time || startTime;
    const duration_ms = Math.max(0, endT - startT);

    let cleanError = null;
    if (state !== 'completed') {
      if (error && isObject(error) && isString(error.contract_version)) {
        cleanError = redactSensitiveValue(error);
      } else {
        cleanError = createExecutionError({
          contract_version: EXECUTION_CONTRACT_VERSION,
          code: 'internal_execution_error',
          category: 'internal_execution_error',
          message: isString(error) ? error : 'Execution failed',
          provider_id: provId,
          request_id: execReqId,
          redacted: true,
        });
      }
    }

    const safeAttemptCount = Number.isInteger(attempt_count) ? Math.min(Math.max(0, attempt_count), 1) : 0;

    const result = {
      contract_version: EXECUTION_CONTRACT_VERSION,
      execution_id: execId,
      request_id: execReqId,
      provider_id: provId,
      model_id: modId,
      state,
      attempt_count: safeAttemptCount,
      gateway_response: state === 'completed' ? gateway_response : null,
      error: state === 'completed' ? null : cleanError,
      timing: {
        started_at: startT,
        completed_at: endT,
        duration_ms,
      },
      usage: state === 'completed' ? usage : null,
      metadata: isObject(metadata) ? metadata : {},
      redacted: true,
    };

    const validation = validateExecutionResult(result);
    if (!validation.success) {
      return {
        contract_version: EXECUTION_CONTRACT_VERSION,
        execution_id: execId,
        request_id: execReqId,
        provider_id: provId,
        model_id: modId,
        state: 'failed',
        attempt_count: safeAttemptCount,
        gateway_response: null,
        error: createExecutionError({
          contract_version: EXECUTION_CONTRACT_VERSION,
          code: 'internal_execution_error',
          category: 'internal_execution_error',
          message: 'Fail-safe result validation fallback',
          provider_id: provId,
          request_id: execReqId,
          redacted: true,
        }),
        timing: {
          started_at: startT,
          completed_at: endT,
          duration_ms,
        },
        usage: null,
        metadata: {},
        redacted: true,
      };
    }

    return result;
  }

  // 1. Basic Request Validation
  if (!execution_request || !isObject(execution_request)) {
    return buildSafeResult({
      state: 'failed',
      attempt_count: 0,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'request_invalid',
        category: 'request_invalid',
        message: 'Execution request object is required',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
    });
  }

  const reqCheck = validateExecutionRequest(execution_request);
  if (!reqCheck.success) {
    return buildSafeResult({
      state: 'failed',
      attempt_count: 0,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'request_invalid',
        category: 'request_invalid',
        message: 'Execution request contract validation failed',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
    });
  }

  // 2. Execution Gate Evaluation (Does NOT require transport if denied!)
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
    return buildSafeResult({
      state: 'failed',
      attempt_count: 0,
      error: gate.error,
    });
  }

  // 3. Cancellation Pre-Check
  if (signal?.aborted) {
    return buildSafeResult({
      state: 'cancelled',
      attempt_count: 0,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'cancelled',
        category: 'cancelled',
        message: 'Execution request pre-aborted by caller signal',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
    });
  }

  // 4. Injected Transport Validation
  const transportCheck = validateTransport(transport);
  if (!transportCheck.success) {
    return buildSafeResult({
      state: 'failed',
      attempt_count: 0,
      error: transportCheck.error,
    });
  }

  // 5. Credential Resolution
  let resolvedCredential = null;
  const approvedEnv = provider_adapter?.credential_env;
  if (approvedEnv !== null && approvedEnv !== undefined) {
    const credResolve = resolveEnvironmentCredential({
      credential_ref: execution_request.credential_ref,
      provider_id: provId,
      provider_adapter,
      environment,
    });

    if (credResolve.success !== true || !credResolve.credential) {
      return buildSafeResult({
        state: 'failed',
        attempt_count: 0,
        error: credResolve.error || createExecutionError({
          contract_version: EXECUTION_CONTRACT_VERSION,
          code: 'credential_unavailable',
          category: 'credential_unavailable',
          message: 'Failed to resolve required environment credential',
          provider_id: provId,
          request_id: execReqId,
          redacted: true,
        }),
      });
    }
    resolvedCredential = credResolve.credential;
  }

  // 6. Request Normalization and Request-Size Enforcement
  let normalizedReq = null;
  let reqByteLength = 0;
  try {
    const normResult = normalizeOpenAIExecutionRequest(execution_request);
    if (!normResult.success) {
      if (resolvedCredential) resolvedCredential.destroy();
      return buildSafeResult({
        state: 'failed',
        attempt_count: 0,
        error: normResult.error || createExecutionError({
          contract_version: EXECUTION_CONTRACT_VERSION,
          code: 'request_invalid',
          category: 'request_invalid',
          message: 'Failed to normalize execution request payload',
          provider_id: provId,
          request_id: execReqId,
          redacted: true,
        }),
      });
    }
    normalizedReq = normResult.payload;
    const jsonReqStr = JSON.stringify(normalizedReq);
    reqByteLength = Buffer.byteLength(jsonReqStr, 'utf8');
  } catch (err) {
    if (resolvedCredential) resolvedCredential.destroy();
    return buildSafeResult({
      state: 'failed',
      attempt_count: 0,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'request_invalid',
        category: 'request_invalid',
        message: `Request normalization error: ${err.message}`,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
    });
  }

  const maxReqBytes = execution_request.policy.max_request_bytes;
  if (reqByteLength > maxReqBytes) {
    if (resolvedCredential) resolvedCredential.destroy();
    return buildSafeResult({
      state: 'failed',
      attempt_count: 0,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'request_too_large',
        category: 'request_too_large',
        message: `Normalized request size (${reqByteLength} bytes) exceeds policy max_request_bytes (${maxReqBytes})`,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
    });
  }

  // 7. Exactly One Transport Invocation
  const execStart = getNow();
  let rawTransportResult = null;
  let transportError = null;
  const secretsToRedact = resolvedCredential ? [resolvedCredential] : [];

  try {
    rawTransportResult = await transport.execute({
      endpoint: execution_request.endpoint,
      payload: normalizedReq,
      credential: resolvedCredential,
      signal,
      request_timeout_ms: execution_request.policy.request_timeout_ms,
      response_timeout_ms: execution_request.policy.response_timeout_ms,
      max_request_bytes: maxReqBytes,
      max_response_bytes: execution_request.policy.max_response_bytes,
      stream: execution_request.gateway_request?.stream === true,
    });
    // 8. Secret-aware transport result sanitization BEFORE credential destruction
    rawTransportResult = redactSensitiveValue(rawTransportResult, secretsToRedact);
  } catch (err) {
    // 8. Secret-aware transport error sanitization BEFORE credential destruction
    transportError = redactSensitiveValue(err, secretsToRedact);
  } finally {
    // 9. Credential destruction in finally
    if (resolvedCredential) {
      resolvedCredential.destroy();
    }
  }

  const execEnd = getNow();

  // Handle transport throw
  if (transportError) {
    let errCode = 'upstream_server_error';
    let errState = 'failed';
    let errStatus = 502;

    if (signal?.aborted || transportError.name === 'AbortError' || transportError.code === 'cancelled') {
      errCode = 'cancelled';
      errState = 'cancelled';
      errStatus = 499;
    } else if (transportError.code === 'timeout' || transportError.name === 'TimeoutError') {
      errCode = 'timeout';
      errState = 'timed_out';
      errStatus = 504;
    } else if (transportError.code === 'request_too_large') {
      errCode = 'request_too_large';
      errStatus = 413;
    } else if (transportError.code === 'response_too_large') {
      errCode = 'response_too_large';
      errStatus = 502;
    } else if (EXECUTION_ERROR_CATEGORIES.includes(transportError.code)) {
      errCode = transportError.code;
      if (typeof transportError.status === 'number') errStatus = transportError.status;
    }

    return buildSafeResult({
      state: errState,
      attempt_count: 1,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: errCode,
        category: errCode,
        message: isString(transportError.message) ? transportError.message : 'Transport execution error',
        status: errStatus,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      start_time: execStart,
      end_time: execEnd,
    });
  }

  if (!rawTransportResult || !isObject(rawTransportResult)) {
    return buildSafeResult({
      state: 'failed',
      attempt_count: 1,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'upstream_protocol_error',
        category: 'upstream_protocol_error',
        message: 'Transport returned non-object result',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      start_time: execStart,
      end_time: execEnd,
    });
  }

  // Response Byte Limit Check
  const rawPayload = rawTransportResult.payload || rawTransportResult.response || rawTransportResult.body || rawTransportResult;
  let responseBytes = 0;
  let isCircularOrUnserializable = false;

  if (typeof rawPayload === 'string') {
    responseBytes = Buffer.byteLength(rawPayload, 'utf8');
  } else if (Buffer.isBuffer(rawPayload) || rawPayload instanceof Uint8Array) {
    responseBytes = rawPayload.byteLength || rawPayload.length;
  } else if (rawPayload && typeof rawPayload === 'object') {
    try {
      const jsonStr = JSON.stringify(rawPayload);
      if (jsonStr === undefined) isCircularOrUnserializable = true;
      else responseBytes = Buffer.byteLength(jsonStr, 'utf8');
    } catch (_) {
      isCircularOrUnserializable = true;
    }
  }

  if (isCircularOrUnserializable) {
    return buildSafeResult({
      state: 'failed',
      attempt_count: 1,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'upstream_protocol_error',
        category: 'upstream_protocol_error',
        message: 'Response payload from transport is circular or unserializable',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      start_time: execStart,
      end_time: execEnd,
    });
  }

  const maxRespBytes = execution_request.policy.max_response_bytes;
  if (responseBytes > maxRespBytes) {
    return buildSafeResult({
      state: 'failed',
      attempt_count: 1,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'response_too_large',
        category: 'response_too_large',
        message: `Response size (${responseBytes} bytes) exceeds policy max_response_bytes (${maxRespBytes})`,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      start_time: execStart,
      end_time: execEnd,
    });
  }

  if (rawTransportResult.success === false || rawTransportResult.error || (rawTransportResult.status && rawTransportResult.status >= 400)) {
    const rawErr = rawTransportResult.error || rawTransportResult;
    const normErr = normalizeOpenAIError(rawErr);
    return buildSafeResult({
      state: 'failed',
      attempt_count: 1,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: normErr.code || 'upstream_server_error',
        category: normErr.category || normErr.code || 'upstream_server_error',
        message: isString(normErr.message) ? normErr.message : 'Upstream provider returned error',
        status: normErr.status || rawTransportResult.status || 500,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      start_time: execStart,
      end_time: execEnd,
    });
  }

  // 10. Response Normalization with Complete Safe Context
  const normResp = normalizeOpenAIResponse(rawPayload, {
    request_id: execReqId,
    provider_id: provId,
    model_id: modId,
    capability: execution_request.capability,
    created: execEnd,
  });

  if (!normResp.success || !normResp.gateway_response) {
    return buildSafeResult({
      state: 'failed',
      attempt_count: 1,
      error: normResp.error || createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'upstream_protocol_error',
        category: 'upstream_protocol_error',
        message: 'Failed to normalize provider response payload',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      start_time: execStart,
      end_time: execEnd,
    });
  }

  const validRespCheck = validateGatewayResponse(normResp.gateway_response);
  if (!validRespCheck.success) {
    return buildSafeResult({
      state: 'failed',
      attempt_count: 1,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'upstream_protocol_error',
        category: 'upstream_protocol_error',
        message: 'Normalized gateway response failed schema contract validation',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      start_time: execStart,
      end_time: execEnd,
    });
  }

  // 11. Validated ExecutionResult
  return buildSafeResult({
    state: 'completed',
    attempt_count: 1,
    gateway_response: normResp.gateway_response,
    usage: normResp.gateway_response.usage || null,
    start_time: execStart,
    end_time: execEnd,
  });
}
