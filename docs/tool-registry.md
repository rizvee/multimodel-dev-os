# Tool & Protocol Registry

The **Tool Registry** governs connection protocols, interfaces, and file associations for developer environments and AI agents.

---

## 1. Tool Mappings

Tools configured in `.ai/registries/tools.yaml` are mapped by:
*   **Interface Type**: `editor` (IDE plugins), `terminal` (CLI clients), or `assistant` (chat helpers).
*   **Protocols**: Connection formats such as `stdin-stdout`, `mcp-jsonrpc` (Model Context Protocol), or custom config parameters.
*   **Registry Keys**: Associated configuration files (e.g. `.cursorrules` for Cursor, `CLAUDE.md` for Claude Code).

---

## 2. Model Context Protocol (MCP) Integration

MultiModel Dev OS leverages MCP to expose local resources to models:
1.  **Server Bindings**: Developers declare local MCP servers (e.g. gcloud SDK MCP, Chrome DevTools MCP) under the tools registry.
2.  **Capability Matching**: The Capability Registry checks if the selected model has `mcp-compliance: 1.0` before attempting native bindings.
3.  **Unified Tool Access**: Exposes filesystem, browser automation, and deployment commands directly to agent execution loops securely.
