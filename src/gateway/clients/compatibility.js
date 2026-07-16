export function summarizeClientCompatibility(result) {
  return {
    compatible: result.compatible,
    level: result.level,
    supported_features: [...result.supported_features],
    unsupported_features: [...result.unsupported_features],
    warnings: [...result.warnings],
  };
}
