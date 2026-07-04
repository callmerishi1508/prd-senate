import fs from 'fs/promises';
import path from 'path';

export interface ConsensusTelemetry {
  mode: 'legacy' | 'hierarchical';
  stage: string;
  promptChars: number;
  estimatedTokens: number;
  latencyMs: number;
  success: boolean;
  violations: any[];
}

const TELEMETRY_FILE = path.join(process.cwd(), 'data', 'consensus_telemetry.json');

export async function logConsensusTelemetry(data: ConsensusTelemetry) {
  try {
    let current: ConsensusTelemetry[] = [];
    try {
      const content = await fs.readFile(TELEMETRY_FILE, 'utf-8');
      current = JSON.parse(content);
    } catch {}
    current.push(data);
    await fs.writeFile(TELEMETRY_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to log telemetry', e);
  }
}
