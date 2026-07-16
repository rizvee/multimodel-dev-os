export function matchGatewayRoute(method, pathname) {
  if (pathname === '/health') return { name: 'health', allowed: ['GET'], matched: method === 'GET' };
  if (pathname === '/v1/models') return { name: 'models', allowed: ['GET'], matched: method === 'GET' };
  if (pathname === '/v1/chat/completions') return { name: 'chat', allowed: ['POST'], matched: method === 'POST' };
  if (pathname === '/v1/gateway/metrics') return { name: 'observability-metrics', allowed: ['GET'], matched: method === 'GET' };
  if (pathname === '/v1/gateway/health/providers') return { name: 'observability-provider-health', allowed: ['GET'], matched: method === 'GET' };
  if (pathname === '/v1/gateway/traces') return { name: 'observability-traces', allowed: ['GET'], matched: method === 'GET' };
  return { name: 'not-found', allowed: [], matched: false };
}
