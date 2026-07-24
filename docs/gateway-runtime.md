# Gateway Runtime & Governed Integration (v4.3 Sprint E1)

The Gateway runtime provides a local HTTP gateway server (`src/gateway/runtime/`) that supports mock execution and opt-in governed external model dispatching.

---

## Architectural Principles & Scope

1. **Mock Provider Default**: The local mock provider (`mock-chat`, `mock-model`) remains the default executable route and fallback is never executed automatically.
2. **Governed External Execution (Sprint E1)**: Opt-in governed execution routes non-stream chat completion requests to configured external providers using an explicitly injected transport object.
3. **Disabled by Default**: Governed external execution is disabled by default (`governed_execution.enabled === false`).
4. **No Built-in Outbound HTTP Transport**: The runtime does not include built-in `fetch` or HTTP transport primitives. An injected transport contract (`transport.execute(...)`) is required.
5. **No External Streaming in E1**: Streaming (`stream: true`) for external governed models is explicitly deferred to Sprint E2 and returns HTTP 400 `unsupported_capability` with 0 transport calls.
6. **No Retries or Fallback**: External provider failures do not automatically retry or fall back to mock or other providers.
7. **SSRF Guard**: Trusted endpoint binding validates HTTPS, hostname, and path-segment descendants. DNS-level SSRF protection remains deferred.

---

## Runtime Configuration API

```js
import { createGatewayServer, createExecutionPolicy, createProviderEndpoint, createProviderExecutionCapability } from 'multimodel-dev-os/src/gateway';

const gateway = createGatewayServer({
  config: {
    host: '127.0.0.1',
    port: 0
  },
  governed_execution: {
    enabled: true,
    transport: {
      async execute({ payload, credential }) {
        // Injected test transport
        return { ... };
      }
    },
    environment: process.env,
    providers: {
      openai: {
        provider_adapter: openAIAdapter,
        endpoint: createProviderEndpoint({ url: 'https://api.openai.com/v1/chat/completions' }),
        policy: createExecutionPolicy({ enabled: true, allowed_provider_ids: ['openai'] }),
        capability: createProviderExecutionCapability({ chat_completions: true, non_streaming: true }),
        credential_ref: { env_var: 'OPENAI_API_KEY' },
      }
    },
    model_routes: {
      'gpt-4o': { provider_id: 'openai', model_id: 'gpt-4o' }
    }
  }
});

const address = await gateway.start();
await gateway.stop();
```

---

## Lifecycle States

- `created`
- `starting`
- `running`
- `stopping`
- `stopped`
- `failed`

The server does not start on import and does not create daemon or background processes.

---

## Endpoint Behavior

- `POST /v1/chat/completions`: Handles mock non-stream/stream requests and governed external non-stream requests. External stream requests return HTTP 400.
- `GET /v1/models`: Returns mock models and valid configured external models (metadata only; no transport probes or credential resolution).
- `GET /health`: Returns runtime health metadata including `governed_execution: { enabled: boolean }`.
