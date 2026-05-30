# multimodel-dev-os installer for Windows (PowerShell)
# Usage: irm https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1 | iex
# Flags: -Caveman  (use minimal-token templates)
#        -All      (install all adapters)
#        -DryRun   (show what would be created without creating)

param(
  [switch]$Caveman,
  [switch]$All,
  [switch]$DryRun,
  [switch]$Help
)

$Version = "0.1.0"
$RepoUrl = "https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main"

if ($Help) {
  Write-Host "multimodel-dev-os installer v$Version" -ForegroundColor Blue
  Write-Host ""
  Write-Host "Usage: irm .../install.ps1 | iex"
  Write-Host ""
  Write-Host "Options:"
  Write-Host "  -Caveman   Use minimal-token templates (~79% fewer tokens)"
  Write-Host "  -All       Install all adapters"
  Write-Host "  -DryRun    Show what would be created without creating"
  Write-Host "  -Help      Show this help message"
  return
}

Write-Host "multimodel-dev-os installer v$Version" -ForegroundColor Blue
Write-Host ""

# --- Helper Functions ---

function New-ProjectFile {
  param(
    [string]$Path,
    [string]$Url
  )

  if (Test-Path $Path) {
    Write-Host "  SKIP $Path (already exists)" -ForegroundColor Yellow
    return
  }

  if ($DryRun) {
    Write-Host "  WOULD CREATE $Path" -ForegroundColor Blue
    return
  }

  $dir = Split-Path -Parent $Path
  if ($dir -and !(Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  try {
    Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing -ErrorAction Stop
    Write-Host "  CREATE $Path" -ForegroundColor Green
  }
  catch {
    Write-Host "  FAIL $Path (download failed)" -ForegroundColor Red
  }
}

function New-ProjectDir {
  param([string]$Path)

  if (Test-Path $Path) {
    Write-Host "  SKIP $Path/ (already exists)" -ForegroundColor Yellow
    return
  }

  if ($DryRun) {
    Write-Host "  WOULD CREATE $Path/" -ForegroundColor Blue
    return
  }

  New-Item -ItemType Directory -Path $Path -Force | Out-Null
  Write-Host "  CREATE $Path/" -ForegroundColor Green
}

# --- Phase 1: Core Files ---

Write-Host "Creating core files..." -ForegroundColor Blue

if ($Caveman) {
  New-ProjectFile "AGENTS.md" "$RepoUrl/.ai/templates/AGENTS.caveman.md"
  New-ProjectFile "MEMORY.md" "$RepoUrl/.ai/templates/MEMORY.caveman.md"
  New-ProjectFile "TASKS.md" "$RepoUrl/.ai/templates/TASKS.caveman.md"
  New-ProjectFile "RUNBOOK.md" "$RepoUrl/.ai/templates/RUNBOOK.caveman.md"
}
else {
  New-ProjectFile "AGENTS.md" "$RepoUrl/AGENTS.md"
  New-ProjectFile "MEMORY.md" "$RepoUrl/MEMORY.md"
  New-ProjectFile "TASKS.md" "$RepoUrl/TASKS.md"
  New-ProjectFile "RUNBOOK.md" "$RepoUrl/RUNBOOK.md"
}
New-ProjectFile ".gitattributes" "$RepoUrl/.gitattributes"
New-ProjectFile "bin/multimodel-dev-os.js" "$RepoUrl/bin/multimodel-dev-os.js"

# --- Phase 2: .ai/ Directory ---

Write-Host ""
Write-Host "Creating .ai/ directory..." -ForegroundColor Blue

New-ProjectFile ".ai/config.yaml" "$RepoUrl/.ai/config.yaml"
New-ProjectDir ".ai/context"
New-ProjectFile ".ai/context/README.md" "$RepoUrl/.ai/context/README.md"
New-ProjectDir ".ai/agents"
New-ProjectFile ".ai/agents/README.md" "$RepoUrl/.ai/agents/README.md"
New-ProjectFile ".ai/agents/multimodel-orchestrator.md" "$RepoUrl/.ai/agents/multimodel-orchestrator.md"
New-ProjectDir ".ai/skills"
New-ProjectFile ".ai/skills/README.md" "$RepoUrl/.ai/skills/README.md"
New-ProjectFile ".ai/skills/example-skill.md" "$RepoUrl/.ai/skills/example-skill.md"
New-ProjectDir ".ai/prompts"
New-ProjectFile ".ai/prompts/README.md" "$RepoUrl/.ai/prompts/README.md"
New-ProjectDir ".ai/checks"
New-ProjectFile ".ai/checks/README.md" "$RepoUrl/.ai/checks/README.md"
New-ProjectFile ".ai/checks/pre-commit.md" "$RepoUrl/.ai/checks/pre-commit.md"
New-ProjectDir ".ai/session-logs"
New-ProjectFile ".ai/session-logs/README.md" "$RepoUrl/.ai/session-logs/README.md"
New-ProjectDir ".ai/templates"
New-ProjectFile ".ai/templates/AGENTS.caveman.md" "$RepoUrl/.ai/templates/AGENTS.caveman.md"
New-ProjectFile ".ai/templates/MEMORY.caveman.md" "$RepoUrl/.ai/templates/MEMORY.caveman.md"
New-ProjectFile ".ai/templates/TASKS.caveman.md" "$RepoUrl/.ai/templates/TASKS.caveman.md"
New-ProjectFile ".ai/templates/RUNBOOK.caveman.md" "$RepoUrl/.ai/templates/RUNBOOK.caveman.md"

# --- Phase 3: Adapters ---

Write-Host ""

function Install-Adapter {
  param([string]$Name)

  Write-Host "Installing $Name adapter..." -ForegroundColor Blue

  switch ($Name) {
    "codex" {
      New-ProjectFile "adapters/codex/AGENTS.md" "$RepoUrl/adapters/codex/AGENTS.md"
      New-ProjectFile "adapters/codex/setup.md" "$RepoUrl/adapters/codex/setup.md"
    }
    "antigravity" {
      New-ProjectFile "adapters/antigravity/AGENTS.md" "$RepoUrl/adapters/antigravity/AGENTS.md"
      New-ProjectFile "adapters/antigravity/.gemini/settings.json" "$RepoUrl/adapters/antigravity/.gemini/settings.json"
      New-ProjectFile "adapters/antigravity/setup.md" "$RepoUrl/adapters/antigravity/setup.md"
    }
    "cursor" {
      New-ProjectFile "adapters/cursor/.cursorrules" "$RepoUrl/adapters/cursor/.cursorrules"
      New-ProjectFile "adapters/cursor/setup.md" "$RepoUrl/adapters/cursor/setup.md"
    }
    "claude" {
      New-ProjectFile "adapters/claude/CLAUDE.md" "$RepoUrl/adapters/claude/CLAUDE.md"
      New-ProjectFile "adapters/claude/setup.md" "$RepoUrl/adapters/claude/setup.md"
    }
    "gemini" {
      New-ProjectFile "adapters/gemini/GEMINI.md" "$RepoUrl/adapters/gemini/GEMINI.md"
      New-ProjectFile "adapters/gemini/setup.md" "$RepoUrl/adapters/gemini/setup.md"
    }
    "vscode" {
      New-ProjectFile "adapters/vscode/.vscode/settings.json" "$RepoUrl/adapters/vscode/.vscode/settings.json"
      New-ProjectFile "adapters/vscode/setup.md" "$RepoUrl/adapters/vscode/setup.md"
    }
  }
}

if ($All) {
  foreach ($adapter in @("codex", "antigravity", "cursor", "claude", "gemini", "vscode")) {
    Install-Adapter $adapter
  }
}
else {
  Write-Host "Which adapters do you want to install?" -ForegroundColor Yellow
  Write-Host "  1) all"
  Write-Host "  2) codex"
  Write-Host "  3) antigravity"
  Write-Host "  4) cursor"
  Write-Host "  5) claude"
  Write-Host "  6) gemini"
  Write-Host "  7) vscode"
  Write-Host "  8) none"
  Write-Host ""
  $choices = Read-Host "Enter choices (comma-separated, e.g., 2,4,5)"

  if ([string]::IsNullOrWhiteSpace($choices) -or $choices -eq "8") {
    Write-Host "Skipping adapters." -ForegroundColor Yellow
  }
  elseif ($choices -eq "1") {
    foreach ($adapter in @("codex", "antigravity", "cursor", "claude", "gemini", "vscode")) {
      Install-Adapter $adapter
    }
  }
  else {
    $selected = $choices -split "," | ForEach-Object { $_.Trim() }
    foreach ($choice in $selected) {
      switch ($choice) {
        "2" { Install-Adapter "codex" }
        "3" { Install-Adapter "antigravity" }
        "4" { Install-Adapter "cursor" }
        "5" { Install-Adapter "claude" }
        "6" { Install-Adapter "gemini" }
        "7" { Install-Adapter "vscode" }
        default { Write-Host "Unknown choice: $choice" -ForegroundColor Red }
      }
    }
  }
}

# --- Summary ---

Write-Host ""
Write-Host "multimodel-dev-os installed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Edit AGENTS.md with your project details"
Write-Host "  2. Edit .ai/config.yaml to enable your adapters"
Write-Host "  3. Copy adapter files to your project root as needed:"
Write-Host "     - Cursor: Copy-Item adapters/cursor/.cursorrules .cursorrules"
Write-Host "     - Claude: Copy-Item adapters/claude/CLAUDE.md CLAUDE.md"
Write-Host "     - VS Code: Copy-Item -Recurse adapters/vscode/.vscode/ .vscode/"
Write-Host ""
Write-Host "  Docs: https://github.com/rizvee/multimodel-dev-os"
Write-Host ""

if ($Caveman) {
  Write-Host "  Caveman Mode active - minimal-token templates installed" -ForegroundColor Yellow
}

if ($DryRun) {
  Write-Host "  Dry run - no files were created" -ForegroundColor Blue
}
