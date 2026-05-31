# Support Policy

This document defines the lifecycle, support channels, and bug-triaging guidelines for the MultiModel Dev OS.

---

## 1. Support Lifecycle

We are committed to maintaining a stable experience for developers:
- **Long-Term Support (LTS)**: The frozen `v1.0.0` protocol and CLI will receive security updates and critical bug fixes for at least 12 months post-release.
- **Backward Compatibility Guarantee**: All `1.x` minor releases will remain fully backward compatible with configurations created under `v1.0.0`.

---

## 2. Issue Triage and Bug Reports

If you encounter issues with the scaffolding or validation commands:
1. Run `multimodel-dev-os doctor` to run advisory diagnostics.
2. Ensure your local folder structure complies with the specifications defined in `docs/stable-protocol.md`.
3. Submit bug reports using our GitHub Issue templates under the `.github/ISSUE_TEMPLATE/` directory.

---

## 3. Security Vulnerability Disclosures

Please do not open public issues for security bugs. Report vulnerabilities directly to the maintainers as described in the `SECURITY.md` file in the repository root.
