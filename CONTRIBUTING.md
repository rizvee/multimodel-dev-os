# Contributing to multimodel-dev-os

Thank you for your interest in contributing! This project is open to everyone.

## How to Contribute

### Reporting Issues

- Use [GitHub Issues](https://github.com/rizvee/multimodel-dev-os/issues)
- Include: what you expected, what happened, and steps to reproduce
- Label issues: `bug`, `feature`, `adapter`, `docs`

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test your changes (see below)
5. Commit with a clear message: `git commit -m "Add Windsurf adapter"`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

### What to Contribute

| Area | Examples |
|------|---------|
| **New adapters** | Support for Windsurf, Aider, Continue, etc. |
| **Example projects** | Pre-filled configs for React, Django, Rust, etc. |
| **Documentation** | Tutorials, guides, translations |
| **Templates** | New skill templates, check templates |
| **Installer improvements** | New platform support, better error handling |

### Adding an Adapter

See [Adapter Guide](docs/adapters.md) for the full process.

Quick checklist:
- [ ] Created `adapters/{tool-name}/` directory
- [ ] Added tool-native instruction file referencing `/AGENTS.md`
- [ ] Added `setup.md` with installation steps
- [ ] Tested with the actual tool
- [ ] Updated `README.md` supported tools table

## Code Style

- **Markdown:** Follow existing formatting patterns
- **YAML:** 2-space indentation
- **Shell scripts:** Use `shellcheck` for linting
- **PowerShell:** Follow PSScriptAnalyzer rules

## Commit Messages

Format: `{type}: {description}`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `adapter:` New or updated adapter
- `chore:` Maintenance

## Testing

Before submitting:
1. Verify all markdown files render correctly on GitHub
2. Run `install.sh --dry-run` to test the installer
3. If adding an adapter, test with the actual tool
4. Check for broken links in documentation

## Code of Conduct

Be respectful. Be constructive. Be inclusive. We're all here to build useful tools.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
