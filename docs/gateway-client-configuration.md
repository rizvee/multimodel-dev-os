# Gateway Client Configuration

Sprint F configuration generation is preview-only.

Programmatic example:

```js
import { generateGatewayClientConfig } from 'multimodel-dev-os/src/gateway';

const plan = generateGatewayClientConfig({
  clientId: 'generic-openai',
  endpoint: { base_url: 'http://127.0.0.1:8787/v1' },
  model: 'mock-chat'
});

console.log(plan.writes_performed); // false
```

## Endpoint Defaults

- Base URL: `http://127.0.0.1:8787/v1`
- Health URL: `http://127.0.0.1:8787/health`
- Executable models: `mock-chat`, `mock-tools`, `mock-stream`
- Auth mode: `none-localhost-only`

Bearer-token examples use an environment placeholder such as `${MMDO_GATEWAY_TOKEN}`. Raw token values are never generated.

## Safety Rules

- No global editor settings are changed.
- No shell profiles are edited.
- No third-party client is installed or executed.
- No provider credentials are read.
- No external provider endpoint is contacted.
