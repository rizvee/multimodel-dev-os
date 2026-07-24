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
import { EXECUTION_CONTRACT_VERSION, EXECUTION_ERROR_CATEGORIES } from '../protocol/constants.js';

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
  const execReqId = requestId || execution_request?.request_id || 'req-default';
  const execId = `exec-${execReqId}`;
  const provId = execution_request?.provider_id || null;
  const modId = execution_request?.model_id || null;

  function buildFailedResult({ error, attempt_count = 1, duration_ms = 0 } = {}) {
    const endT = getNow();
    const cleanError = redactSensitiveValue(error);
    const result = createExecutionResult({
      contract_version: EXECUTION_CONTRACT_VERSION,
      execution_id: execId,
      request_id: execReqId,
      provider_id: provId,
      model_id: modId,
      state: 'failed',
      attempt_count,
      gateway_response: null,
      error: cleanError,
      timing: {
        start_time: startTime,
        end_time: endT,
        duration_ms: Math.max(0, duration_ms),
      },
      usage: null,
      metadata: {
        contract_version: EXECUTION_CONTRACT_VERSION,
        execution_id: execId,
      },
      redacted: true,
    });
    validateExecutionResult(result);
    return result;
  }

  const transportCheck = validateTransport(transport);
  if (!transportCheck.success) {
    return buildFailedResult({
      error: transportCheck.error,
      attempt_count: 1,
    });
  }

  if (!execution_request || typeof execution_request !== 'object') {
    return buildFailedResult({
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'request_invalid',
        category: 'request_invalid',
        message: 'Execution request object is required',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      attempt_count: 1,
    });
  }

  const reqCheck = validateExecutionRequest(execution_request);
  if (!reqCheck.success) {
    return buildFailedResult({
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'request_invalid',
        category: 'request_invalid',
        message: 'Execution request contract validation failed',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      attempt_count: 1,
    });
  }

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
    return buildFailedResult({
      error: gate.error,
      attempt_count: 1,
    });
  }

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
      return buildFailedResult({
        error: credResolve.error || createExecutionError({
          contract_version: EXECUTION_CONTRACT_VERSION,
          code: 'credential_unavailable',
          category: 'credential_unavailable',
          message: 'Failed to resolve required environment credential',
          provider_id: provId,
          request_id: execReqId,
          redacted: true,
        }),
        attempt_count: 1,
      });
    }
    resolvedCredential = credResolve.credential;
  }

  let normalizedReq = null;
  try {
    const normResult = normalizeOpenAIExecutionRequest(execution_request);
    if (!normResult.success) {
      if (resolvedCredential) resolvedCredential.destroy();
      return buildFailedResult({
        error: normResult.error || createExecutionError({
          contract_version: EXECUTION_CONTRACT_VERSION,
          code: 'request_invalid',
          category: 'request_invalid',
          message: 'Failed to normalize execution request payload',
          provider_id: provId,
          request_id: execReqId,
          redacted: true,
        }),
        attempt_count: 1,
      });
    }
    normalizedReq = normResult.payload;
  } catch (err) {
    if (resolvedCredential) resolvedCredential.destroy();
    return buildFailedResult({
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'request_invalid',
        category: 'request_invalid',
        message: `Request normalization threw an error: ${err.message}`,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      attempt_count: 1,
    });
  }

  const execStart = getNow();
  let transportResult = null;
  let transportError = null;

  try {
    transportResult = await transport.execute({
      endpoint: execution_request.endpoint,
      payload: normalizedReq,
      credential: resolvedCredential,
      signal,
      request_timeout_ms: execution_request.policy.request_timeout_ms,
      response_timeout_ms: execution_request.policy.response_timeout_ms,
      max_request_bytes: execution_request.policy.max_request_bytes,
      max_response_bytes: execution_request.policy.max_response_bytes,
      stream: execution_request.gateway_request?.stream === true,
    });
  } catch (err) {
    transportError = err;
  } finally {
    if (resolvedCredential) {
      resolvedCredential.destroy();
    }
  }

  const execEnd = getNow();
  const durationMs = Math.max(0, execEnd - execStart);

  if (transportError) {
    let errCode = 'upstream_server_error';
    if (transportError.code === 'timeout' || transportError.name === 'TimeoutError') {
      errCode = 'timeout';
    } else if (transportError.code === 'cancelled' || transportError.name === 'AbortError') {
      errCode = 'cancelled';
    } else if (transportError.code === 'request_too_large') {
      errCode = 'request_too_large';
    } else if (transportError.code === 'response_too_large') {
      errCode = 'response_too_large';
    } else if (EXECUTION_ERROR_CATEGORIES.includes(transportError.code)) {
      errCode = transportError.code;
    }

    return buildFailedResult({
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: errCode,
        category: errCode,
        message: redactSensitiveValue(transportError.message || 'Transport execution threw an exception'),
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      attempt_count: 1,
      duration_ms: durationMs,
    });
  }

  if (!transportResult || typeof transportResult !== 'object') {
    return buildFailedResult({
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'upstream_protocol_error',
        category: 'upstream_protocol_error',
        message: 'Transport returned non-object response',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      attempt_count: 1,
      duration_ms: durationMs,
    });
  }

  if (transportResult.success === false || transportResult.error || (transportResult.status && transportResult.status >= 400)) {
    const rawErr = transportResult.error || transportResult;
    const normErr = normalizeOpenAIError(rawErr);
    return buildFailedResult({
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: normErr.code || 'upstream_server_error',
        category: normErr.category || normErr.code || 'upstream_server_error',
        message: redactSensitiveValue(normErr.message || 'Upstream provider returned an error'),
        status: normErr.status || transportResult.status || 500,
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      attempt_count: 1,
      duration_ms: durationMs,
    });
  }

  const rawResponsePayload = transportResult.payload || transportResult.response || transportResult.body || transportResult;
  const normResp = normalizeOpenAIResponse(rawResponsePayload, { request_id: execReqId });

  if (!normResp.success) {
    return buildFailedResult({
      error: normResp.error || createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'upstream_protocol_error',
        category: 'upstream_protocol_error',
        message: 'Failed to normalize provider response payload',
        provider_id: provId,
        request_id: execReqId,
        redacted: true,
      }),
      attempt_count: 1,
      duration_ms: durationMs,
    });
  }

  const successResult = createExecutionResult({
    contract_version: EXECUTION_CONTRACT_VERSION,
    execution_id: execId,
    request_id: execReqId,
    provider_id: provId,
    model_id: modId,
    state: 'completed',
    attempt_count: 1,
    gateway_response: normResp.gateway_response,
    error: null,
    timing: {
      start_time: execStart,
      end_time: execEnd,
      duration_ms: durationMs,
    },
    usage: normResp.gateway_response.usage || null,
    metadata: {
      contract_version: EXECUTION_CONTRACT_VERSION,
      execution_id: execId,
    },
    redacted: true,
  });

  validateExecutionResult(successResult);
  return successResult;
}
