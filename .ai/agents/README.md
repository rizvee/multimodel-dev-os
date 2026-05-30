# Agents

> Agent role definitions and orchestration configuration.

## Purpose

This directory defines:
- Agent roles and their file scopes
- Orchestration mode (sequential, parallel, supervised)
- Handoff protocol between agents

## Files

| File | Purpose |
|------|---------|
| `orchestrator.md` | Multi-agent coordination protocol |
| `{role-name}.md` | Custom role definitions (optional) |

## Quick Reference

Define agents in root `.ai/config.yaml`, then detail their coordination here.

See `orchestrator.md` for the full protocol spec.
