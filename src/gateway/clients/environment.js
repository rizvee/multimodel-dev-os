export function createGatewayClientEnvironment({ endpoint, auth = {} } = {}) {
  const variables = {};
  const tokenEnv = auth.token_env || endpoint?.token_env || null;
  if (tokenEnv) {
    variables[tokenEnv] = `\${${tokenEnv}}`;
  }
  return {
    variables,
    placeholders: Object.keys(variables),
    contains_secrets: false,
  };
}

export function tokenPlaceholder(tokenEnv = 'MMDO_GATEWAY_TOKEN') {
  return `\${${tokenEnv}}`;
}
