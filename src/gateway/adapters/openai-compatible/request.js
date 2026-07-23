import { validateExecutionRequest } from '../../contracts/execution-request.js';

export function normalizeOpenAIExecutionRequest(executionRequest) {
  const valResult = validateExecutionRequest(executionRequest);
  if (!valResult.success) {
    return {
      success: false,
      errors: valResult.errors,
    };
  }

  const { gateway_request, capability } = executionRequest;

  if (capability) {
    if (gateway_request.stream === true && capability.sse_streaming !== true) {
      return {
        success: false,
        errors: [
          {
            code: 'unsupported_capability',
            path: 'capability.sse_streaming',
            message: 'stream requested but provider capability sse_streaming is false',
          },
        ],
      };
    }

    const hasTools = (Array.isArray(gateway_request.tools) && gateway_request.tools.length > 0) ||
      (gateway_request.tool_choice !== undefined && gateway_request.tool_choice !== null);

    if (hasTools && capability.tool_calls !== true) {
      return {
        success: false,
        errors: [
          {
            code: 'unsupported_capability',
            path: 'capability.tool_calls',
            message: 'tool calls requested but provider capability tool_calls is false',
          },
        ],
      };
    }
  }

  const payload = {
    model: gateway_request.model,
    messages: (gateway_request.messages || []).map((msg) => {
      const cleanMsg = {
        role: msg.role,
        content: msg.content ?? null,
      };
      if (msg.name !== undefined && msg.name !== null) {
        cleanMsg.name = msg.name;
      }
      if (msg.tool_call_id !== undefined && msg.tool_call_id !== null) {
        cleanMsg.tool_call_id = msg.tool_call_id;
      }
      if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        cleanMsg.tool_calls = msg.tool_calls.map((tc) => ({
          id: tc.id,
          type: tc.type || 'function',
          function: {
            name: tc.function?.name,
            arguments: tc.function?.arguments,
          },
        }));
      }
      return cleanMsg;
    }),
  };

  if (typeof gateway_request.temperature === 'number') {
    payload.temperature = gateway_request.temperature;
  }
  if (typeof gateway_request.top_p === 'number') {
    payload.top_p = gateway_request.top_p;
  }
  if (Number.isInteger(gateway_request.max_tokens)) {
    payload.max_tokens = gateway_request.max_tokens;
  }
  if (gateway_request.stop !== undefined && gateway_request.stop !== null) {
    payload.stop = gateway_request.stop;
  }
  if (gateway_request.stream === true) {
    payload.stream = true;
  }
  if (Array.isArray(gateway_request.tools) && gateway_request.tools.length > 0) {
    payload.tools = gateway_request.tools.map((t) => ({
      type: t.type || 'function',
      function: {
        name: t.function?.name,
        description: t.function?.description,
        parameters: t.function?.parameters,
      },
    }));
  }
  if (gateway_request.tool_choice !== undefined && gateway_request.tool_choice !== null) {
    payload.tool_choice = gateway_request.tool_choice;
  }
  if (typeof gateway_request.user === 'string' && gateway_request.user.length > 0) {
    payload.user = gateway_request.user;
  }

  return {
    success: true,
    payload,
  };
}
