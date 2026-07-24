import { validateExecutionRequest } from '../../contracts/execution-request.js';

function deepCloneJSON(val) {
  if (val === null || val === undefined || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => deepCloneJSON(item));
  }
  const copy = {};
  for (const key of Object.keys(val)) {
    const v = val[key];
    if (v !== undefined) {
      copy[key] = deepCloneJSON(v);
    }
  }
  return copy;
}

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
        content: deepCloneJSON(msg.content ?? null),
      };
      if (msg.name !== undefined && msg.name !== null) {
        cleanMsg.name = msg.name;
      }
      if (msg.tool_call_id !== undefined && msg.tool_call_id !== null) {
        cleanMsg.tool_call_id = msg.tool_call_id;
      }
      if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        cleanMsg.tool_calls = msg.tool_calls.map((tc) => {
          const item = {
            id: tc.id,
            type: tc.type || 'function',
            function: {
              name: tc.function?.name,
            },
          };
          if (tc.function?.arguments !== undefined && tc.function?.arguments !== null) {
            item.function.arguments = deepCloneJSON(tc.function.arguments);
          }
          return item;
        });
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
    payload.stop = deepCloneJSON(gateway_request.stop);
  }
  if (gateway_request.stream === true) {
    payload.stream = true;
  }
  if (Array.isArray(gateway_request.tools) && gateway_request.tools.length > 0) {
    payload.tools = gateway_request.tools.map((t) => {
      const fnObj = {
        name: t.function?.name,
      };
      if (t.function?.description !== undefined && t.function?.description !== null) {
        fnObj.description = t.function.description;
      }
      if (t.function?.parameters !== undefined && t.function?.parameters !== null) {
        fnObj.parameters = deepCloneJSON(t.function.parameters);
      }
      return {
        type: t.type || 'function',
        function: fnObj,
      };
    });
  }
  if (gateway_request.tool_choice !== undefined && gateway_request.tool_choice !== null) {
    payload.tool_choice = deepCloneJSON(gateway_request.tool_choice);
  }
  if (typeof gateway_request.user === 'string' && gateway_request.user.length > 0) {
    payload.user = gateway_request.user;
  }

  return {
    success: true,
    payload,
  };
}
