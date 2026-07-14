export function createDiagnostics() {
  return {
    errors: [],
    warnings: [],
  };
}

export function addError(diagnostics, code, path, message) {
  diagnostics.errors.push({
    code,
    path,
    message,
  });
}

export function addWarning(diagnostics, code, path, message) {
  diagnostics.warnings.push({
    code,
    path,
    message,
  });
}

export function hasErrors(diagnostics) {
  return diagnostics.errors.length > 0;
}

export function createRegistryResult(value, diagnostics) {
  return {
    success: !hasErrors(diagnostics),
    diagnostics,
    value,
  };
}
