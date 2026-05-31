# Integration Fixture Strategy

To confirm that `multimodel-dev-os` behaves consistently across distinct operating systems and target directory boundaries, future automated integrations tests should utilize the fixtures detailed here.

---

## 1. Planned Fixtures Layout

1. **`tests/fixtures/pristine/`**:
   - Representing an empty repository where `init` command can execute with zero conflict.
2. **`tests/fixtures/cluttered/`**:
   - Represents a repository containing legacy rule files to test conflict resolution and `-f, --force` parameters.
3. **`tests/fixtures/broken-config/`**:
   - Formatted with syntactic invalid config configurations to verify validate catches and exits with appropriate non-zero error logs.

---

## 2. Dynamic Fixture Auditing

When writing assertions:
- Never commit active `.cursorrules` or `.gemini/` folders directly inside the templates' fixture folders to avoid index pollutions.
- Use dry-run actions (`-d, --dry-run`) to assert targeted writes without mutative writes to actual testing paths.
