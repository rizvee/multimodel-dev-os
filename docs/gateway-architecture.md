# Gateway Architecture

v4.2 Sprint A defines gateway architecture contracts only. MultiModel Dev OS does not start an HTTP server, call providers, load credentials, execute routing decisions, or run fallback chains in this sprint.

The gateway foundation is split into four planes:

## Control Plane

Skill OS remains the governance layer:

- RACE+ prompt templates
- skill registry metadata
- workflow metadata
- declarative permission classes
- advisory guardrails
- memory and context files
- validation checks

The control plane is declarative. It describes policy and intent, but it does not execute provider calls or enforce runtime permissions yet.

## Routing Plane

The routing plane is planned to choose a provider and model for a request. Sprint A only defines routing request and route decision contracts.

Planned routing inputs include:

- requested provider or model
- required and preferred capabilities
- estimated input tokens
- required context window
- privacy policy
- cost and latency preference
- excluded providers or models
- fallback allowance

Route decisions are designed to be explainable through selected provider/model, strategy, score, reasons, rejected candidates, fallback chain, warnings, request ID, and timestamp.

## Gateway Plane

The future gateway plane is expected to expose a local OpenAI-compatible subset. Sprint A only defines protocol shapes and validation helpers.

Planned gateway responsibilities:

- request normalization
- response normalization
- normalized error taxonomy
- provider adapter invocation
- streaming abstraction
- usage metadata
- security boundaries
- health metadata

No gateway server exists yet.

## Client Plane

Future clients may include Codex, Claude Code, Cursor, Cline, Aider, Antigravity, MCP tools, and custom agents. Sprint A does not add client configuration or compatibility guarantees.

## Source Layout

Sprint A adds pure contract modules under:

```text
src/gateway/
  protocol/
  contracts/
```

The modules are deterministic and dependency-free. They do not read credentials, mutate the environment, write files, open sockets, or make network calls.

## Runtime Registry Layer

v4.2 Sprint B adds a runtime-readable registry layer for existing `.ai/models/` metadata. It loads and validates providers, hosted models, local model metadata, and routing presets into deterministic snapshots.

This layer still does not execute providers, read credential values, start local engines, score routes, or run fallback chains. It only prepares safe metadata for future routing code.

## Safety Boundary

Gateway architecture work must preserve:

- zero runtime dependencies
- localhost-first defaults
- prompt redaction by default
- no committed provider credentials
- no hidden provider execution
- no runtime permission enforcement until explicitly implemented and documented
