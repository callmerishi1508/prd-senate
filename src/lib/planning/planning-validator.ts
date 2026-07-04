import { PlanningArtifacts } from './planning-schema';

export function validatePlanningProgrammatically(artifacts: PlanningArtifacts): string[] {
  const issues: string[] = [];
  
  // Rule 1: Every Epic must contain >= 1 Requirement
  for (const epic of artifacts.epics) {
    if (!epic.relatedRequirements || epic.relatedRequirements.length === 0) {
      issues.push(`Epic ${epic.id} (${epic.title}) contains no related requirements.`);
    }
  }

  // Rule 2: Every Release must contain >= 1 Epic
  for (const milestone of artifacts.releasePlan.milestones) {
    if (!milestone.epics || milestone.epics.length === 0) {
      issues.push(`Release ${milestone.id} (${milestone.title}) contains no Epics.`);
    }
  }

  // Check releases epic ordering
  const epicToReleaseIndex = new Map<string, number>();
  artifacts.releasePlan.milestones.forEach((m, idx) => {
    m.epics.forEach(eId => epicToReleaseIndex.set(eId, idx));
  });

  // Rule 3: Critical Epics cannot appear after Low Priority Epics
  let foundLowPriorityRelease = -1;
  artifacts.releasePlan.milestones.forEach((m, idx) => {
    let hasLow = false;
    let hasCritical = false;
    m.epics.forEach(eId => {
      const epic = artifacts.epics.find(e => e.id === eId);
      if (epic) {
        if (epic.priority === 'LOW') hasLow = true;
        if (epic.priority === 'CRITICAL') hasCritical = true;
      }
    });

    if (hasCritical && foundLowPriorityRelease !== -1 && foundLowPriorityRelease < idx) {
      issues.push(`A Critical Epic in Release ${idx + 1} appears after a Low Priority Epic was scheduled in Release ${foundLowPriorityRelease + 1}.`);
    }
    
    if (hasLow && foundLowPriorityRelease === -1) {
      foundLowPriorityRelease = idx;
    }
  });

  // Rule 4: Dependency Satisfaction
  for (const dep of artifacts.dependencies) {
    if (dep.type === 'BLOCKS') {
      const fromIdx = epicToReleaseIndex.get(dep.from);
      const toIdx = epicToReleaseIndex.get(dep.to);
      if (fromIdx !== undefined && toIdx !== undefined) {
        if (toIdx < fromIdx) {
          issues.push(`Dependency violation: Epic ${dep.from} BLOCKS Epic ${dep.to}, but ${dep.to} is scheduled in an earlier release.`);
        }
      }
    }
  }

  // Detect cyclic dependencies
  const adj = new Map<string, string[]>();
  artifacts.epics.forEach(e => adj.set(e.id, []));
  artifacts.dependencies.forEach(d => {
    if (d.type === 'BLOCKS') {
      if (!adj.has(d.from)) adj.set(d.from, []);
      if (!adj.has(d.to)) adj.set(d.to, []);
      adj.get(d.from)!.push(d.to);
    }
  });
  
  const visited = new Set<string>();
  const recStack = new Set<string>();
  function isCyclic(node: string): boolean {
    if (!visited.has(node)) {
      visited.add(node);
      recStack.add(node);
      for (const neighbor of adj.get(node) || []) {
        if (!visited.has(neighbor) && isCyclic(neighbor)) return true;
        else if (recStack.has(neighbor)) return true;
      }
    }
    recStack.delete(node);
    return false;
  }
  for (const node of adj.keys()) {
    if (isCyclic(node)) {
      issues.push(`Cyclic dependency detected involving Epic ${node}.`);
      break; // Report one cycle issue to avoid flooding
    }
  }

  return issues;
}
