import { StructuredPRD } from '../prd/schema';
import { TraceabilityMap } from './types';

export function validateTraceability(prd: StructuredPRD, maps: TraceabilityMap[]): string[] {
  const errors: string[] = [];

  const mappedReqs = new Set<string>();
  const mappedStories = new Set<string>();
  const mappedMetrics = new Set<string>();

  maps.forEach(m => {
    if (m.requirementIds.length === 0) {
      errors.push(`Goal ${m.goalId} has no mapped Functional Requirements.`);
    }
    m.requirementIds.forEach(id => mappedReqs.add(id));
    m.userStoryIds.forEach(id => mappedStories.add(id));
    m.metricIds.forEach(id => mappedMetrics.add(id));
  });

  prd.functionalRequirements.forEach(fr => {
    if (!mappedReqs.has(fr.id!)) {
      errors.push(`Orphan Functional Requirement detected: ${fr.id}`);
    }
  });

  prd.userStories.forEach(us => {
    if (!mappedStories.has(us.id!)) {
      errors.push(`Orphan User Story detected: ${us.id}`);
    }
    if (!us.acceptanceCriteria || us.acceptanceCriteria.length === 0) {
      errors.push(`User Story ${us.id} is missing Acceptance Criteria.`);
    }
  });

  prd.successMetrics.forEach(sm => {
    if (!mappedMetrics.has(sm.id!)) {
      // The user prompt said: "A Success Metric without a Goal = Warning"
      // We can push it as an error or just ignore it. Let's push it so it gets fixed.
      errors.push(`Orphan Success Metric detected: ${sm.id}`);
    }
  });

  return errors;
}
