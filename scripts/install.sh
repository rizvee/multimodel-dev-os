#!/usr/bin/env bash
set -euo pipefail

# multimodel-dev-os installer for macOS / Linux / WSL
# Usage: curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash
# Flags: --caveman  (use minimal-token templates)
#        --all      (install all adapters)
#        --dry-run  (show what would be created without creating)

VERSION="2.8.1"
REPO_URL="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main"
CAVEMAN=false
DRY_RUN=false
INSTALL_ALL=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
for arg in "$@"; do
  case $arg in
    --caveman) CAVEMAN=true ;;
    --dry-run) DRY_RUN=true ;;
    --all) INSTALL_ALL=true ;;
    --help)
      echo "multimodel-dev-os installer v${VERSION}"
      echo ""
      echo "Usage: curl -fsSL .../install.sh | bash [-s -- OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --caveman   Use minimal-token templates (~79% fewer tokens)"
      echo "  --all       Install all adapters"
      echo "  --dry-run   Show what would be created without creating"
      echo "  --help      Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}multimodel-dev-os installer v${VERSION}${NC}"
echo ""

# --- Helper Functions ---

create_file() {
  local path="$1"
  local url="$2"

  if [ -f "$path" ]; then
    echo -e "  ${YELLOW}SKIP${NC} $path (already exists)"
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${BLUE}WOULD CREATE${NC} $path"
    return
  fi

  mkdir -p "$(dirname "$path")"
  if curl -fsSL "$url" -o "$path" 2>/dev/null; then
    echo -e "  ${GREEN}CREATE${NC} $path"
  else
    echo -e "  ${RED}FAIL${NC} $path (download failed)"
  fi
}

create_dir() {
  local path="$1"

  if [ -d "$path" ]; then
    echo -e "  ${YELLOW}SKIP${NC} $path/ (already exists)"
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${BLUE}WOULD CREATE${NC} $path/"
    return
  fi

  mkdir -p "$path"
  echo -e "  ${GREEN}CREATE${NC} $path/"
}

# --- Phase 1: Core Files ---

echo -e "${BLUE}Creating core files...${NC}"

if [ "$CAVEMAN" = true ]; then
  create_file "AGENTS.md" "${REPO_URL}/.ai/templates/AGENTS.caveman.md"
  create_file "MEMORY.md" "${REPO_URL}/.ai/templates/MEMORY.caveman.md"
  create_file "TASKS.md" "${REPO_URL}/.ai/templates/TASKS.caveman.md"
  create_file "RUNBOOK.md" "${REPO_URL}/.ai/templates/RUNBOOK.caveman.md"
else
  create_file "AGENTS.md" "${REPO_URL}/AGENTS.md"
  create_file "MEMORY.md" "${REPO_URL}/MEMORY.md"
  create_file "TASKS.md" "${REPO_URL}/TASKS.md"
  create_file "RUNBOOK.md" "${REPO_URL}/RUNBOOK.md"
fi
create_file ".gitattributes" "${REPO_URL}/.gitattributes"
create_file "bin/multimodel-dev-os.js" "${REPO_URL}/bin/multimodel-dev-os.js"

# --- Phase 2: .ai/ Directory ---

echo ""
echo -e "${BLUE}Creating .ai/ directory...${NC}"

create_file ".ai/config.yaml" "${REPO_URL}/.ai/config.yaml"
create_dir ".ai/context"
create_file ".ai/context/README.md" "${REPO_URL}/.ai/context/README.md"
create_dir ".ai/agents"
create_file ".ai/agents/README.md" "${REPO_URL}/.ai/agents/README.md"
create_file ".ai/agents/multimodel-orchestrator.md" "${REPO_URL}/.ai/agents/multimodel-orchestrator.md"
create_dir ".ai/skills"
create_file ".ai/skills/README.md" "${REPO_URL}/.ai/skills/README.md"
create_file ".ai/skills/example-skill.md" "${REPO_URL}/.ai/skills/example-skill.md"
create_dir ".ai/prompts"
create_file ".ai/prompts/README.md" "${REPO_URL}/.ai/prompts/README.md"
create_dir ".ai/checks"
create_file ".ai/checks/README.md" "${REPO_URL}/.ai/checks/README.md"
create_file ".ai/checks/pre-commit.md" "${REPO_URL}/.ai/checks/pre-commit.md"
create_dir ".ai/session-logs"
create_file ".ai/session-logs/README.md" "${REPO_URL}/.ai/session-logs/README.md"
create_dir ".ai/templates"
create_file ".ai/templates/AGENTS.caveman.md" "${REPO_URL}/.ai/templates/AGENTS.caveman.md"
create_file ".ai/templates/MEMORY.caveman.md" "${REPO_URL}/.ai/templates/MEMORY.caveman.md"
create_file ".ai/templates/TASKS.caveman.md" "${REPO_URL}/.ai/templates/TASKS.caveman.md"
create_file ".ai/templates/RUNBOOK.caveman.md" "${REPO_URL}/.ai/templates/RUNBOOK.caveman.md"

# --- Phase 3: Adapters ---

echo ""

install_adapter() {
  local name="$1"
  echo -e "${BLUE}Installing $name adapter...${NC}"

  case $name in
    codex)
      create_file "adapters/codex/AGENTS.md" "${REPO_URL}/adapters/codex/AGENTS.md"
      create_file "adapters/codex/setup.md" "${REPO_URL}/adapters/codex/setup.md"
      ;;
    antigravity)
      create_file "adapters/antigravity/AGENTS.md" "${REPO_URL}/adapters/antigravity/AGENTS.md"
      create_file "adapters/antigravity/.gemini/settings.json" "${REPO_URL}/adapters/antigravity/.gemini/settings.json"
      create_file "adapters/antigravity/setup.md" "${REPO_URL}/adapters/antigravity/setup.md"
      ;;
    cursor)
      create_file "adapters/cursor/.cursorrules" "${REPO_URL}/adapters/cursor/.cursorrules"
      create_file "adapters/cursor/setup.md" "${REPO_URL}/adapters/cursor/setup.md"
      ;;
    claude)
      create_file "adapters/claude/CLAUDE.md" "${REPO_URL}/adapters/claude/CLAUDE.md"
      create_file "adapters/claude/setup.md" "${REPO_URL}/adapters/claude/setup.md"
      ;;
    gemini)
      create_file "adapters/gemini/GEMINI.md" "${REPO_URL}/adapters/gemini/GEMINI.md"
      create_file "adapters/gemini/setup.md" "${REPO_URL}/adapters/gemini/setup.md"
      ;;
    vscode)
      create_file "adapters/vscode/.vscode/settings.json" "${REPO_URL}/adapters/vscode/.vscode/settings.json"
      create_file "adapters/vscode/setup.md" "${REPO_URL}/adapters/vscode/setup.md"
      ;;
  esac
}

if [ "$INSTALL_ALL" = true ]; then
  for adapter in codex antigravity cursor claude gemini vscode; do
    install_adapter "$adapter"
  done
else
  echo -e "${YELLOW}Which adapters do you want to install?${NC}"
  echo "  1) all"
  echo "  2) codex"
  echo "  3) antigravity"
  echo "  4) cursor"
  echo "  5) claude"
  echo "  6) gemini"
  echo "  7) vscode"
  echo "  8) none"
  echo ""
  echo -n "Enter choices (comma-separated, e.g., 2,4,5): "
  read -r choices

  if [ -z "$choices" ] || [ "$choices" = "8" ]; then
    echo -e "${YELLOW}Skipping adapters.${NC}"
  elif [ "$choices" = "1" ]; then
    for adapter in codex antigravity cursor claude gemini vscode; do
      install_adapter "$adapter"
    done
  else
    IFS=',' read -ra selected <<< "$choices"
    for choice in "${selected[@]}"; do
      choice=$(echo "$choice" | tr -d ' ')
      case $choice in
        2) install_adapter "codex" ;;
        3) install_adapter "antigravity" ;;
        4) install_adapter "cursor" ;;
        5) install_adapter "claude" ;;
        6) install_adapter "gemini" ;;
        7) install_adapter "vscode" ;;
        *) echo -e "${RED}Unknown choice: $choice${NC}" ;;
      esac
    done
  fi
fi

# --- Summary ---

echo ""
echo -e "${GREEN}✅ multimodel-dev-os installed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit AGENTS.md with your project details"
echo "  2. Edit .ai/config.yaml to enable your adapters"
echo "  3. Copy adapter files to your project root as needed:"
echo "     - Cursor: cp adapters/cursor/.cursorrules .cursorrules"
echo "     - Claude: cp adapters/claude/CLAUDE.md CLAUDE.md"
echo "     - VS Code: cp -r adapters/vscode/.vscode/ .vscode/"
echo ""
echo "  Docs: https://github.com/rizvee/multimodel-dev-os"
echo ""

if [ "$CAVEMAN" = true ]; then
  echo -e "  ${YELLOW}🦴 Caveman Mode active — minimal-token templates installed${NC}"
fi

if [ "$DRY_RUN" = true ]; then
  echo -e "  ${BLUE}🔍 Dry run — no files were created${NC}"
fi
