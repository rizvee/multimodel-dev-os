# Trusted Registries

MultiModel Dev OS enforces a strict priority trust chain for catalogs:
1. **Bundled**: Built-in registries packaged within the CLI.
2. **Local**: Cached registries under `.ai/registries/cache/`.
3. **Remote**: Opt-in only remote catalog URLs.

Remote catalogs must provide a valid cryptographic provenance checksum.
