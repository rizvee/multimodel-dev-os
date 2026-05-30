#!/usr/bin/env bash
set -euo pipefail

# multimodel-dev-os strict release verification script
# Checks that all required files exist in their exact locations

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_file() {
  local path="$1"
  local required="${2:-true}"

  if [ -f "$path" ]; then
    echo -e "  ${GREEN}✓${NC} $path"
    PASS=$((PASS + 1))
  elif [ "$required" = "true" ]; then
    echo -e "  ${RED}✗${NC} $path (missing)"
    FAIL=$((FAIL + 1))
  else
    echo -e "  ${YELLOW}?${NC} $path (optional, not found)"
    WARN=$((WARN + 1))
  fi
}

check_dir() {
  local path="$1"

  if [ -d "$path" ]; then
    echo -e "  ${GREEN}✓${NC} $path/"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $path/ (missing)"
    FAIL=$((FAIL + 1))
  fi
}

echo "multimodel-dev-os - Strict Release Audit Verification"
echo "====================================================="
echo ""

# --- Root Files ---
echo "Root files:"
check_file "AGENTS.md"
check_file "MEMORY.md"
check_file "TASKS.md"
check_file "RUNBOOK.md"
check_file "README.md"
check_file "LICENSE"
check_file "CONTRIBUTING.md"
check_file "CODE_OF_CONDUCT.md"
check_file "SECURITY.md"
check_file "CHANGELOG.md"
check_file "package.json"
check_file ".gitignore"
check_file ".gitattributes"
check_file ".editorconfig" "false"

# --- .ai/ Core Directory & YAML ---
echo ""
echo ".ai/ directory & config:"
check_dir ".ai"
check_file ".ai/config.yaml"

# --- .ai/context/ ---
echo ""
echo ".ai/context/ files:"
check_file ".ai/context/project-brief.md"
check_file ".ai/context/architecture.md"
check_file ".ai/context/business-rules.md"
check_file ".ai/context/seo-rules.md"
check_file ".ai/context/deployment-rules.md"
check_file ".ai/context/model-map.md"
check_file ".ai/context/context-budget.md"

# --- .ai/agents/ ---
echo ""
echo ".ai/agents/ files:"
check_file ".ai/agents/multimodel-orchestrator.md"
check_file ".ai/agents/planner.md"
check_file ".ai/agents/coder.md"
check_file ".ai/agents/reviewer.md"
check_file ".ai/agents/qa-tester.md"
check_file ".ai/agents/security-auditor.md"
check_file ".ai/agents/seo-auditor.md"
check_file ".ai/agents/devops.md"

# --- .ai/skills/ ---
echo ""
echo ".ai/skills/ files:"
check_file ".ai/skills/model-routing.md"
check_file ".ai/skills/context-routing.md"
check_file ".ai/skills/nextjs-feature-build.md"
check_file ".ai/skills/bug-fix.md"
check_file ".ai/skills/refactor.md"
check_file ".ai/skills/seo-implementation.md"
check_file ".ai/skills/landing-page-optimization.md"
check_file ".ai/skills/cpanel-deploy.md"
check_file ".ai/skills/caveman-bug-fix.md"
check_file ".ai/skills/caveman-feature-build.md"
check_file ".ai/skills/caveman-context-handoff.md"

# --- .ai/prompts/ ---
echo ""
echo ".ai/prompts/ files:"
check_file ".ai/prompts/plan-first.md"
check_file ".ai/prompts/implement-safely.md"
check_file ".ai/prompts/review-diff.md"
check_file ".ai/prompts/generate-tests.md"
check_file ".ai/prompts/summarize-session.md"
check_file ".ai/prompts/handoff-to-next-model.md"

# --- .ai/checks/ ---
echo ""
echo ".ai/checks/ files:"
check_file ".ai/checks/pre-implementation.md"
check_file ".ai/checks/pre-commit.md"
check_file ".ai/checks/pre-deploy.md"
check_file ".ai/checks/regression-checklist.md"
check_file ".ai/checks/context-budget.md"

# --- .ai/templates/ ---
echo ""
echo ".ai/templates/ files:"
check_file ".ai/templates/task-template.md"
check_file ".ai/templates/feature-spec-template.md"
check_file ".ai/templates/bug-report-template.md"
check_file ".ai/templates/session-log-template.md"
check_file ".ai/templates/project-memory-template.md"

# --- Adapters ---
echo ""
echo "Adapters:"
check_file "adapters/codex/AGENTS.md"
check_file "adapters/codex/setup.md"
check_file "adapters/antigravity/AGENTS.md"
check_file "adapters/antigravity/.gemini/settings.json"
check_file "adapters/antigravity/setup.md"
check_file "adapters/cursor/.cursorrules"
check_file "adapters/cursor/setup.md"
check_file "adapters/claude/CLAUDE.md"
check_file "adapters/claude/setup.md"
check_file "adapters/gemini/GEMINI.md"
check_file "adapters/gemini/setup.md"
check_file "adapters/vscode/.vscode/settings.json"
check_file "adapters/vscode/setup.md"

# --- Examples ---
echo ""
echo "Examples:"
check_file "examples/nextjs-saas/AGENTS.md"
check_file "examples/nextjs-saas/MEMORY.md"
check_file "examples/wordpress-site/AGENTS.md"
check_file "examples/wordpress-site/MEMORY.md"
check_file "examples/ecommerce-store/AGENTS.md"
check_file "examples/ecommerce-store/MEMORY.md"
check_file "examples/seo-landing-page/AGENTS.md"
check_file "examples/seo-landing-page/MEMORY.md"
check_file "examples/general-app/AGENTS.md"
check_file "examples/general-app/MEMORY.md"

# --- Scripts & bin ---
echo ""
echo "Scripts & Executables:"
check_file "scripts/install.sh"
check_file "scripts/install.ps1"
check_file "scripts/verify.sh"
check_file "scripts/pack-template.sh"
check_file "bin/multimodel-dev-os.js"

# --- GitHub Integration ---
echo ""
echo "GitHub Workflows:"
check_file ".github/workflows/verify.yml"

# --- Documentation ---
echo ""
echo "Extended Documentation:"
check_file "docs/quickstart.md"
check_file "docs/architecture.md"
check_file "docs/multimodel-workflow.md"
check_file "docs/caveman-mode.md"
check_file "docs/adapters.md"
check_file "docs/installers.md"
check_file "docs/cli-roadmap.md"
check_file "docs/faq.md"
check_file "docs/testing-v0.2.md"

# --- Summary ---
echo ""
echo "====================================================="
TOTAL=$((PASS + FAIL + WARN))
echo -e "  ${GREEN}Pass: $PASS${NC}  ${RED}Fail: $FAIL${NC}  ${YELLOW}Warn: $WARN${NC}  Total: $TOTAL"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n${RED}Verification failed. Fix missing files listed above.${NC}"
  exit 1
else
  echo -e "\n${GREEN}Verification passed successfully.${NC}"
  exit 0
fi
