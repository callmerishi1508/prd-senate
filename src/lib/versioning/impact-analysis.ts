import { RequirementChange, ImpactReport, PRDVersion } from './version-schema';

export function runImpactAnalysis(change: RequirementChange, baseVersion: PRDVersion): ImpactReport {
  const report: ImpactReport = {
    affectedGoals: [],
    affectedRequirements: [],
    affectedStories: [],
    affectedMetrics: []
  };

  // We rely on the TraceabilityMap of the baseVersion (where the entity existed/exists)
  // to find the blast radius.
  const maps = baseVersion.traceabilityMap || [];

  const entityId = change.entityId.split(' -> ')[0]; // in case it's ID_CHANGED "old -> new"

  if (change.entityType === 'Goal') {
    const map = maps.find(m => m.goalId === entityId);
    if (map) {
      report.affectedRequirements.push(...map.requirementIds);
      report.affectedStories.push(...map.userStoryIds);
      report.affectedMetrics.push(...map.metricIds);
    }
  } else if (change.entityType === 'Requirement') {
    // Find any goal maps that include this requirement
    maps.forEach(map => {
      if (map.requirementIds.includes(entityId)) {
        if (!report.affectedGoals.includes(map.goalId)) {
          report.affectedGoals.push(map.goalId);
        }
        
        // Find which user stories map to this requirement. 
        // Wait, the TraceabilityMap structure stores goal -> reqs -> stories. 
        // So `map.userStoryIds` has all stories for the *goal*, but we don't know which belong strictly to the requirement from the map directly.
        // Actually, the current TraceabilityMap structure might just have userStoryIds per goal!
        // Let's assume it affects all user stories tied to the same goals as the requirement for a broad impact view,
        // or we just look up the requirements mapped to user stories.
        // For now, if a requirement changes, it affects the stories listed in the same map node.
        map.userStoryIds.forEach(us => {
          if (!report.affectedStories.includes(us)) {
            report.affectedStories.push(us);
          }
        });
      }
    });
  } else if (change.entityType === 'Metric') {
    maps.forEach(map => {
      if (map.metricIds.includes(entityId)) {
        if (!report.affectedGoals.includes(map.goalId)) {
          report.affectedGoals.push(map.goalId);
        }
      }
    });
  } else if (change.entityType === 'UserStory') {
    maps.forEach(map => {
      if (map.userStoryIds.includes(entityId)) {
        if (!report.affectedGoals.includes(map.goalId)) {
          report.affectedGoals.push(map.goalId);
        }
        // Since we don't store req -> story map explicitly per story in TraceabilityMap, we can't easily reverse it to requirement without searching the PRD text overlap again.
        // But the broad goal level is useful enough for impact.
      }
    });
  }

  return report;
}
