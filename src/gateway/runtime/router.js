export function matchGatewayRoute(method, pathname) {
  if (pathname === '/health') return { name: 'health', allowed: ['GET'], matched: method === 'GET' };
  if (pathname === '/v1/models') return { name: 'models', allowed: ['GET'], matched: method === 'GET' };
  if (pathname === '/v1/chat/completions') return { name: 'chat', allowed: ['POST'], matched: method === 'POST' };
  return { name: 'not-found', allowed: [], matched: false };
}
