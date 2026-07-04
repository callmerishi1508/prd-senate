import { EngineeringTask, Sprint } from './delivery-schema';
import { Epic } from '../planning/planning-schema';
import { StructuredPRD } from '../prd/schema';

export interface TraceabilityAuditResult {
  orphanRequirements: string[];
  orphanEpics: string[];
  orphanTasks: string[];
  orphanSprints: string[];
  score: number;
}

export function auditDeliveryTraceability(
  prd: StructuredPRD,
  epics: Epic[],
  tasks: EngineeringTask[],
  sprints: Sprint[]
): TraceabilityAuditResult {
  const result: TraceabilityAuditResult = {
    orphanRequirements: [],
    orphanEpics: [],
    orphanTasks: [],
    orphanSprints: [],
    score: 100
  };

  // 1. Requirement -> Epic
  const allReqIds = (prd.functionalRequirements || []).map(r => r.id);
  const mappedReqIds = new Set<string>();
  epics.forEach(e => {
    e.relatedRequirements.forEach(reqId => mappedReqIds.add(reqId));
  });

  allReqIds.forEach(reqId => {
    if (reqId && !mappedReqIds.has(reqId)) {
      result.orphanRequirements.push(reqId);
    }
  });

  // 2. Epic -> Task
  const allEpicIds = epics.map(e => e.id);
  const mappedEpicIds = new Set<string>();
  tasks.forEach(t => {
    mappedEpicIds.add(t.epicId);
  });

  allEpicIds.forEach(epicId => {
    if (!mappedEpicIds.has(epicId)) {
      result.orphanEpics.push(epicId);
    }
  });

  // 3. Task -> Sprint
  const allTaskIds = tasks.map(t => t.id);
  const mappedTaskIds = new Set<string>();
  sprints.forEach(s => {
    s.tasks.forEach(tId => mappedTaskIds.add(tId));
  });

  allTaskIds.forEach(taskId => {
    if (!mappedTaskIds.has(taskId)) {
      result.orphanTasks.push(taskId);
    }
  });

  // 4. Sprints with no tasks
  sprints.forEach(s => {
    if (s.tasks.length === 0) {
      result.orphanSprints.push(s.id);
    }
  });

  const totalIssues = result.orphanRequirements.length + result.orphanEpics.length + result.orphanTasks.length + result.orphanSprints.length;
  result.score = Math.max(0, 100 - (totalIssues * 5));

  return result;
}
