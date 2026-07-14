# Gateway Runtime Registry

v4.2 Sprint B converts existing `.ai/models/` metadata into deterministic runtime-readable registry snapshots for future routing work.

This is metadata loading and validation only:

- no provider APIs are called
- no provider credentials are read
- no HTTP server is started
- no local model engine is probed or started
- no routing preset is executed
- no fallback chain is executed
- no live pricing lookup is performed

## Source Files

The runtime registry reads the existing source-compatible files:

```text
.ai/models/providers.yaml
.ai/models/registry.yaml
.ai/models/local-models.yaml
.ai/models/routing-presets.yaml
```

The source YAML format remains compatible with existing model/provider CLI commands.

## Normalized Records

Sprint B creates normalized runtime records for:

- providers
- hosted models
- local model metadata
- routing presets

Normalized records preserve known source identifiers and aliases. Missing optional values stay as `null`, empty arrays, or documented defaults.

## Snapshot Shape

`buildGatewayRegistrySnapshot()` returns:

```text
providers
models
local_models
routing_presets
indexes
diagnostics
source_files
schema_version
```

Indexes are plain objects for deterministic, future machine-readable use:

- `providersById`
- `modelsById`
- `modelsByAlias`
- `modelsByProvider`
- `localModelsById`
- `routingPresetsById`

Snapshots do not include timestamps, environment-derived values, local absolute paths in public diagnostics, or secret values.

## Query APIs

Read-only APIs support:

- provider listing and lookup
- model listing, ID lookup, and alias lookup
- model listing by provider
- local model listing and lookup
- routing preset listing and lookup

These APIs never mutate source files and never execute routing.

## Safety Rules

Provider metadata may store credential environment variable names such as `PROVIDER_API_KEY`, but credential values are never read.

Provider URLs are parsed and validated without making requests:

- remote providers require `https:`
- embedded usernames/passwords are rejected
- unsafe protocols are rejected
- URL fragments are rejected
- localhost/private targets are rejected for non-local providers
- local endpoints must use approved local hosts

Local model metadata remains availability metadata only. Sprint B does not inspect Ollama, LM Studio, llama.cpp, vLLM, or any other local engine.

## Validation

The strict verifier checks:

- runtime registry modules exist
- runtime schemas parse
- bundled registries load
- IDs are unique
- cross references pass
- provider URLs are metadata-safe
- credential fields contain environment names only
- local endpoints are local
- snapshots contain no secret values
- registry modules contain no network operations or writes
- existing model/provider CLI commands remain functional

Sprint C is expected to build pure deterministic routing functions on top of these registry snapshots, still without provider calls.
