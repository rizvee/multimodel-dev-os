# Multimodel Orchestrator Protocol — v0.1

> Specification for coordinating multiple AI coding agents on a single project.
> v0.1 is a **protocol document** — runtime implementation comes in v0.2+.

## Purpose

When multiple AI tools work on the same codebase, they need:
1. **Role clarity** — who does what
2. **File boundaries** — who touches which files
3. **Session logging** — how to pass context between agents
4. **Conflict prevention** — avoid stepping on each other's changes

## Agent Roles

Define agents in `.ai/config.yaml`:

```yaml
orchestrator:
  agents:
    - name: "architect"
      tool: "claude"
      role: "Design and plan architecture"
      files: ["docs/**", "AGENTS.md", "MEMORY.md"]
      permissions: "read+write"

    - name: "implementer"
      tool: "cursor"
      role: "Write implementation code"
      files: ["src/**", "lib/**", "tests/**"]
      permissions: "read+write"

    - name: "reviewer"
      tool: "codex"
      role: "Review code and suggest fixes"
      files: ["**"]
      permissions: "read-only"
```

## Execution Modes

| Mode | Behavior |
|------|----------|
| `sequential` | One agent at a time. Session log required between each. |
| `parallel` | Multiple agents work simultaneously on different file scopes. |
| `supervised` | Human reviews each agent's output before the next agent starts. |

## Session Log Protocol

When an agent finishes a task, it writes a session log to `.ai/session-logs/`:

### Session Log Format

```markdown
# Session: {agent_name} → {next_agent}

**Timestamp:** {ISO 8601}
**Agent:** {tool_name} ({role_name})
**Mode:** {execution_mode}

## Action Summary
{What was done in 2-3 sentences}

## Files Changed
- {path} ({created|modified|deleted})

## Next Steps
1. {Concrete next action}
2. {Another action}

## Blockers
- {Any blockers, or "None"}

## Context for Next Agent
{Any important context the next agent needs}
```

### Naming Convention

```
.ai/session-logs/{YYYY-MM-DD}-{agent}-{summary}.md
```

Example: `.ai/session-logs/2026-05-30-architect-auth-design.md`

## Conflict Prevention Rules

1. **File scoping:** Agents should only modify files in their defined `files` glob
2. **Lock files:** If an agent is working on a file, other agents should skip it
3. **Pull before push:** Always check for changes before committing
4. **Atomic tasks:** Each agent should complete a coherent unit of work

## Current Limitations (v0.1)

- No runtime enforcement — this is a convention, not a system
- No automatic conflict detection
- No agent-to-agent messaging (use session logs)
- No parallel execution safeguards

## Roadmap

- **v0.2:** CLI that reads config and routes tasks
- **v0.3:** Automatic session log generation
- **v0.4:** Conflict detection and resolution
- **v0.5:** Real-time agent coordination
