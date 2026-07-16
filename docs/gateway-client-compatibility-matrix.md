# Gateway Client Compatibility Matrix

Sprint F and Sprint H keep client integrations conservative. Profiles describe localhost mock gateway setup paths and compatibility evidence; they do not install or execute third-party clients.

| Client | Profile status | Tested surface | Untested surface | Setup mode | Known limitations |
|:---|:---|:---|:---|:---|:---|
| Codex | needs manual review | Generated preview shape only | Current Codex configuration behavior | Manual guidance | No official gateway compatibility claim. |
| Claude Code | needs manual review | Documentation guidance only | Direct OpenAI-compatible gateway targeting | Manual guidance | Direct support is not asserted. |
| Cursor | example only | Preview generation | Real Cursor extension behavior | Workspace-safe example | No user-global settings are written. |
| Cline | example only | Preview generation | Real extension behavior | Provider-profile example | Extension is not installed or executed. |
| Continue | example only | Preview generation | Real extension behavior | Provider-profile example | No package installation or global config. |
| Roo Code | example only | Preview generation | Real extension behavior | Provider-profile example | Extension is not installed or executed. |
| Aider | example only | Preview generation | Real Aider execution | Command guidance | Commands are not executed; raw tokens are not placed on command lines. |
| Antigravity | adapter ready | Bundled adapter guidance | External account or credential behavior | Adapter guidance | No external credentials are changed. |
| Gemini CLI | needs manual review | Documentation guidance only | OpenAI-compatible proxy behavior | Manual guidance | Gateway targeting is not asserted. |
| MCP-based clients | example only | HTTP-resource style preview | Native MCP gateway behavior | Example only | The gateway is not an MCP server. |
| Generic OpenAI-compatible | validated local | Local mock health, models, chat, stream | External provider execution | Preview config | Validated only against the mock gateway. |
| Custom Node.js client | validated local | Node built-in local HTTP requests | Third-party SDK behavior | Preview config | Validated only against the mock gateway. |

## Compatibility Definitions

- **validated local**: tested against the bundled localhost mock runtime.
- **protocol compatible**: the protocol shape is compatible, but the named client was not executed.
- **configuration example**: safe setup guidance exists, but compatibility must be reviewed by the user.
- **manual review**: direct support is not asserted.
- **unsupported**: no supported setup path is currently claimed.

Generated configuration plans are preview-only and report `writes_performed: false`.
