# Gateway Runtime

v4.2 Sprint E introduces the first real local HTTP gateway runtime.

Current scope:

- localhost-only by default
- mock provider only
- minimal OpenAI-compatible endpoint subset
- non-streaming chat completions
- deterministic mock SSE streaming
- model listing
- health endpoint
- bounded request limits and timeouts
- normalized errors
- clean lifecycle start/stop

The runtime does not call external model providers, load provider credentials, execute retry/fallback chains, persist logs, persist circuit-breaker state, or enforce Skill OS permissions globally.

## Runtime API

```js
import { createGatewayServer } from 'multimodel-dev-os/src/gateway';

const gateway = createGatewayServer({
  config: {
    host: '127.0.0.1',
    port: 0
  }
});

const address = await gateway.start();
await gateway.stop();
```

`port: 0` is useful for tests because the operating system assigns an ephemeral local port.

## Lifecycle States

- `created`
- `starting`
- `running`
- `stopping`
- `stopped`
- `failed`

The server does not start on import and does not create a daemon or background process.

## CLI Boundary

Sprint E does not add gateway CLI startup commands. The runtime is exposed through the JavaScript API and test/docs examples only. This keeps existing CLI behavior unchanged while the security boundary is validated.
