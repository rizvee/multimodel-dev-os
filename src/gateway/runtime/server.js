import { createServer } from 'node:http';
import { createGatewayApp } from './app.js';
import { createRuntimeError } from './errors.js';
import { createMockGatewayProvider } from './mock-provider.js';
import { normalizeGatewayRuntimeConfig, validateGatewayRuntimeConfig } from './limits.js';
import { createGatewayObservabilityCollector } from '../observability/collector.js';

function serverAddress(server) {
  const address = server.address();
  if (!address || typeof address === 'string') return null;
  return { host: address.address, port: address.port, family: address.family };
}

export function createGatewayServer({
  config = {},
  provider = null,
  logger = null,
  observability = null,
} = {}) {
  const configResult = validateGatewayRuntimeConfig(config);
  const runtimeConfig = normalizeGatewayRuntimeConfig(config);
  const runtimeProvider = provider || createMockGatewayProvider({ delayMs: runtimeConfig.mock_delay_ms });
  const runtimeObservability = observability || (
    runtimeConfig.observability.enabled
      ? createGatewayObservabilityCollector({ config: runtimeConfig.observability })
      : null
  );
  const connections = new Set();
  let stateValue = 'created';
  let httpServer = null;
  let startTime = 0;

  function state() {
    return stateValue;
  }

  function address() {
    return httpServer ? serverAddress(httpServer) : null;
  }

  async function start() {
    if (stateValue === 'running' || stateValue === 'starting') {
      throw createRuntimeError({ code: 'configuration_error', message: 'Gateway server is already started', cause: 'double_start' });
    }
    if (!configResult.success) {
      stateValue = 'failed';
      throw createRuntimeError({
        code: configResult.errors[0]?.code || 'configuration_error',
        message: configResult.errors.map((error) => error.message).join('; '),
        details: { errors: configResult.errors },
        cause: 'invalid_runtime_config',
      });
    }
    stateValue = 'starting';
    startTime = Date.now();
    const app = createGatewayApp({
      config: runtimeConfig,
      provider: runtimeProvider,
      state,
      startTime,
      requestIdFactory: runtimeConfig.request_id_factory,
      observability: runtimeObservability,
    });
    httpServer = createServer(app);
    httpServer.on('connection', (socket) => {
      connections.add(socket);
      socket.on('close', () => connections.delete(socket));
    });
    httpServer.on('clientError', (error, socket) => {
      logger?.warn?.('gateway client error', { message: error.message });
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    await new Promise((resolve, reject) => {
      httpServer.once('error', (error) => {
        stateValue = 'failed';
        reject(error);
      });
      httpServer.listen(runtimeConfig.port, runtimeConfig.host, () => {
        stateValue = 'running';
        resolve();
      });
    });
    return address();
  }

  async function stop() {
    if (!httpServer || stateValue === 'stopped' || stateValue === 'created') {
      stateValue = 'stopped';
      return { stopped: true };
    }
    if (stateValue === 'stopping') return { stopped: true };
    stateValue = 'stopping';
    const serverToClose = httpServer;
    await new Promise((resolve) => {
      const shutdownTimer = setTimeout(() => {
        for (const socket of connections) socket.destroy();
        resolve();
      }, runtimeConfig.shutdown_timeout_ms);
      shutdownTimer.unref?.();
      serverToClose.close(() => {
        clearTimeout(shutdownTimer);
        resolve();
      });
    });
    connections.clear();
    httpServer = null;
    stateValue = 'stopped';
    return { stopped: true };
  }

  return {
    get server() {
      return httpServer;
    },
    start,
    stop,
    address,
    state,
    observability: () => runtimeObservability,
  };
}
