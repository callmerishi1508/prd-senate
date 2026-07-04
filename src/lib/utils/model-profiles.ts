export interface ModelProfile {
  name: string;
  maxRetries: number;
  timeoutMs: number;
  family: 'qwen' | 'llama' | 'openai' | 'anthropic' | 'unknown';
}

export const MODEL_PROFILES: Record<string, ModelProfile> = {
  'qwen2.5:1.5b': { name: 'qwen2.5:1.5b', maxRetries: 3, timeoutMs: 300000, family: 'qwen' },
  'qwen2.5-coder:7b': { name: 'qwen2.5-coder:7b', maxRetries: 3, timeoutMs: 7200000, family: 'qwen' },
  'llama3.1:8b': { name: 'llama3.1:8b', maxRetries: 2, timeoutMs: 7200000, family: 'llama' },
};

export const DEFAULT_MODEL_ID = 'qwen2.5:1.5b';

export function getModelProfile(modelId: string): ModelProfile {
  return MODEL_PROFILES[modelId] || {
    name: modelId,
    maxRetries: 2,
    timeoutMs: 1500000,
    family: 'unknown'
  };
}
