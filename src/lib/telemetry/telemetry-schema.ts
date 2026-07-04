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
