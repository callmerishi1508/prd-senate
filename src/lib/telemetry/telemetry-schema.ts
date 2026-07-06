export enum AICorrectionType {
  SchemaRepair = 'SCHEMA_REPAIR',
  SourceBackfill = 'SOURCE_BACKFILL',
  ResearchRetry = 'RESEARCH_RETRY',
  ConsensusRetry = 'CONSENSUS_RETRY',
  ValidationFailure = 'VALIDATION_FAILURE',
  NormalizationEvent = 'NORMALIZATION_EVENT',
  CriticalEscape = 'CRITICAL_ESCAPE',
  ParserRecoverySuccess = 'PARSER_RECOVERY_SUCCESS',
  ParserRecoveryFailure = 'PARSER_RECOVERY_FAILURE',
  ParserFallbackTriggered = 'PARSER_FALLBACK_TRIGGERED'
}

export interface AICorrectionEvent {
  projectId: string;
  model: string;
  stage: string;
  promptVersion: string;
  correctionType: AICorrectionType;
  timestamp: string;
  success: boolean;
  details?: string;
}

export interface AIGenerationEvent {
  projectId: string;
  model: string;
  stage: string;
  timestamp: string;
  latencyMs: number;
  success: boolean;
}

export interface CompressionFidelity {
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number; // 0.0 to 1.0 (compressed/original)
  sectionsRemoved: number;
  requiredFieldsPreserved: number;
}

export interface AITokenEvent {
  projectId: string;
  model: string;
  stage: string;
  timestamp: string;
  fidelity: CompressionFidelity;
}

export interface AITerminalFailureEvent {
  projectId: string;
  model: string;
  stage: string;
  timestamp: string;
  failureCategory: string; // Parser, Prompt, Validation, Repair, Model Capability, Timeout, Infrastructure, Unknown
  exceptionMessage: string;
  retryCount: number;
  validationOutcome: string;
  parserOutcome: string;
  repairOutcome: string;
  deploymentGateStatus: string;
}

export interface AIRetryEvent {
  projectId: string;
  model: string;
  stage: string;
  timestamp: string;
  retryNumber: number;
  reason: string;
  validatorMessage: string;
  repairPrompt: string;
  repairOutput: string;
  success: boolean;
}
