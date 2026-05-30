# Caveman Mode

> Cut ~79% of tokens from your AI context without losing functionality.

## Why Caveman Mode?

AI agents consume tokens for every file they read. In large projects, context windows fill up fast. Caveman Mode provides stripped-down templates that preserve structure but eliminate:

- Comments and explanations
- Examples and sample data
- Verbose headers
- Decorative whitespace

## Token Budget

| File | Standard | Caveman | Savings |
|------|----------|---------|---------|
| `AGENTS.md` | ~500 tokens | ~120 tokens | 76% |
| `MEMORY.md` | ~400 tokens | ~80 tokens | 80% |
| `TASKS.md` | ~300 tokens | ~60 tokens | 80% |
| `RUNBOOK.md` | ~400 tokens | ~80 tokens | 80% |
| **Total** | **~1,600** | **~340** | **~79%** |

### Fresh Install

**Via npx (Recommended):**
```bash
npx multimodel-dev-os@latest init --caveman
```

**Via shell script installer:**
```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash -s -- --caveman
```

### Convert Existing Project

Replace root files with caveman variants:
```bash
cp .ai/templates/AGENTS.caveman.md AGENTS.md
cp .ai/templates/MEMORY.caveman.md MEMORY.md
cp .ai/templates/TASKS.caveman.md TASKS.md
cp .ai/templates/RUNBOOK.caveman.md RUNBOOK.md
```

Update config:
```yaml
# .ai/config.yaml
mode: "caveman"
```

### Switch Back to Standard

```bash
# Re-download standard templates
curl -fsSL .../AGENTS.md -o AGENTS.md
# Or restore from git
git checkout -- AGENTS.md MEMORY.md TASKS.md RUNBOOK.md
```

## Caveman Writing Rules

If you're writing your own caveman-style files:

1. No comments — every token must be actionable
2. No examples — agents know common patterns
3. No headers longer than 3 words
4. No blank lines between sections
5. Use abbreviations: `dev`, `deps`, `cfg`, `env`
6. Use `null` for missing values
7. Tables over prose — always

## When NOT to Use Caveman Mode

- New projects where you need detailed templates as guides
- Teams where multiple humans need to read the files
- When you have plenty of context window budget
- When onboarding new team members who need explanations
