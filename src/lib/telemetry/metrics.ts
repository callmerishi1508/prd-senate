import client from 'prom-client';

// Ensure we only register metrics once in development (Next.js HMR workaround)
const globalRegistry = global as unknown as { promRegistry?: client.Registry };

let registry = globalRegistry.promRegistry;

if (!registry) {
  registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });
  globalRegistry.promRegistry = registry;
}

export const metricsRegistry = registry;

export const generationDuration = new client.Histogram({
  name: 'prd_senate_generation_duration_seconds',
  help: 'Duration of AI generation steps in seconds',
  labelNames: ['project', 'model', 'stage'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
  registers: [metricsRegistry]
});

export const aiCorrectionsTotal = new client.Counter({
  name: 'prd_senate_ai_corrections_total',
  help: 'Total number of AI self-healing corrections',
  labelNames: ['project', 'model', 'stage', 'correction_type'],
  registers: [metricsRegistry]
});

export const apiRequestsTotal = new client.Counter({
  name: 'prd_senate_api_requests_total',
  help: 'Total number of API requests to the LLM',
  labelNames: ['project', 'model', 'endpoint', 'status'],
  registers: [metricsRegistry]
});
