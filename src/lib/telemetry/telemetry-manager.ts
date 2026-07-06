import fs from 'fs/promises';
import path from 'path';
import { AICorrectionEvent, AIGenerationEvent, AITokenEvent, AITerminalFailureEvent, AIRetryEvent } from './telemetry-schema';
import { aiCorrectionsTotal, generationDuration, apiRequestsTotal } from './metrics';

const CORRECTIONS_FILE = path.join(process.cwd(), 'data', 'ai_corrections.jsonl');
const GENERATIONS_FILE = path.join(process.cwd(), 'data', 'ai_generations.jsonl');
const TOKENS_FILE = path.join(process.cwd(), 'data', 'ai_tokens.jsonl');
const TERMINAL_FAILURES_FILE = path.join(process.cwd(), 'data', 'ai_terminal_failures.jsonl');
const RETRIES_FILE = path.join(process.cwd(), 'data', 'ai_retries.jsonl');
async function appendJsonl(filePath: string, data: any) {
  try {
    const line = JSON.stringify(data) + '\n';
    await fs.appendFile(filePath, line, 'utf-8');
  } catch (error) {
    console.error(`Failed to append telemetry to ${filePath}`, error);
  }
}

export async function logCorrectionEvent(event: AICorrectionEvent) {
  aiCorrectionsTotal.inc({
    project: event.projectId,
    model: event.model,
    stage: event.stage,
    correction_type: event.correctionType
  });
  await appendJsonl(CORRECTIONS_FILE, event);
}

export async function logGenerationEvent(event: AIGenerationEvent) {
  generationDuration.observe(
    { project: event.projectId, model: event.model, stage: event.stage },
    event.latencyMs / 1000.0
  );
  apiRequestsTotal.inc({
    project: event.projectId,
    model: event.model,
    endpoint: 'ollama',
    status: event.success ? 'success' : 'error'
  });
  await appendJsonl(GENERATIONS_FILE, event);
}

export async function logTokenEvent(event: AITokenEvent) {
  await appendJsonl(TOKENS_FILE, event);
}

export async function logTerminalFailureEvent(event: AITerminalFailureEvent) {
  await appendJsonl(TERMINAL_FAILURES_FILE, event);
}

export async function logRetryEvent(event: AIRetryEvent) {
  await appendJsonl(RETRIES_FILE, event);
}

// Utility to read JSONL files
async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch (error: any) {
    if (error.code === 'ENOENT') return [];
    console.error(`Failed to read telemetry from ${filePath}`, error);
    return [];
  }
}

export async function getTelemetryStats() {
  const corrections = await readJsonl<AICorrectionEvent>(CORRECTIONS_FILE);
  const generations = await readJsonl<AIGenerationEvent>(GENERATIONS_FILE);
  const tokenEvents = await readJsonl<AITokenEvent>(TOKENS_FILE);

  const totalGenerations = generations.length;
  const totalCorrections = corrections.length;
  
  const aiCorrectionRate = totalGenerations > 0 ? totalCorrections / totalGenerations : 0;

  const correctionsByProject: Record<string, number> = {};
  const correctionsByType: Record<string, number> = {};
  const correctionsByStage: Record<string, number> = {};

  corrections.forEach(c => {
    correctionsByProject[c.projectId] = (correctionsByProject[c.projectId] || 0) + 1;
    correctionsByType[c.correctionType] = (correctionsByType[c.correctionType] || 0) + 1;
    correctionsByStage[c.stage] = (correctionsByStage[c.stage] || 0) + 1;
  });

  const totalLatency = generations.reduce((sum, g) => sum + g.latencyMs, 0);
  const averageLatencyMs = totalGenerations > 0 ? totalLatency / totalGenerations : 0;

  const validGens = Math.max(1, totalGenerations);
  const validationPenalty = ((correctionsByType['VALIDATION_FAILURE'] || 0) / validGens) * 25;
  const retryPenalty = (((correctionsByType['RESEARCH_RETRY'] || 0) + (correctionsByType['CONSENSUS_RETRY'] || 0)) / validGens) * 8;
  const correctionPenalty = (((correctionsByType['SCHEMA_REPAIR'] || 0) + (correctionsByType['SOURCE_BACKFILL'] || 0) + (correctionsByType['NORMALIZATION_EVENT'] || 0)) / validGens) * 2;
  const latencyPenalty = Math.max(0, (averageLatencyMs - 30000) / 15000); // 1 point per 15s over 30s
  
  const healthScore = Math.max(0, Math.min(100, 100 - validationPenalty - retryPenalty - correctionPenalty - latencyPenalty));
  const criticalEscapes = correctionsByType['CRITICAL_ESCAPE'] || 0;

  const projectsWithCorrections = new Set(corrections.map(c => c.projectId)).size;
  const projectsWithCriticalEscapes = new Set(corrections.filter(c => c.correctionType === 'CRITICAL_ESCAPE').map(c => c.projectId)).size;
  const recoveredProjects = projectsWithCorrections - projectsWithCriticalEscapes;
  const correctionEfficiency = projectsWithCorrections > 0 ? recoveredProjects / projectsWithCorrections : 1;

  return {
    totalGenerations,
    totalCorrections,
    aiCorrectionRate,
    correctionsByProject,
    correctionsByType,
    correctionsByStage,
    averageLatencyMs,
    healthScore,
    penalties: {
      validationPenalty,
      retryPenalty,
      correctionPenalty,
      latencyPenalty
    },
    criticalEscapes,
    correctionEfficiency
  };
}

export async function getPhase15JStats() {
  const terminalFailures = await readJsonl<AITerminalFailureEvent>(TERMINAL_FAILURES_FILE);
  const retries = await readJsonl<AIRetryEvent>(RETRIES_FILE);
  
  return {
    terminalFailures: terminalFailures.length,
    retries: retries.length
  };
}
