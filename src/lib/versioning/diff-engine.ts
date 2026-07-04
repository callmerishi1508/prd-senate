import { PRDVersion, RequirementChange, EvolutionSummary } from './version-schema';
import { Goal, FunctionalRequirement, UserStory, SuccessMetric } from '../prd/schema';

type EntityObj = Goal | FunctionalRequirement | UserStory | SuccessMetric;

function getStringVal(item: any): string {
  if (!item) return '';
  if (item.title && item.description) return `${item.title}: ${item.description}`;
  if (item.description) return item.description;
  return JSON.stringify(item);
}

function compareArrays(
  arr1: any[],
  arr2: any[],
  entityType: RequirementChange['entityType']
): RequirementChange[] {
  const changes: RequirementChange[] = [];
  
  const map1 = new Map(arr1.filter(i => i && i.id).map(i => [i.id, i]));
  const map2 = new Map(arr2.filter(i => i && i.id).map(i => [i.id, i]));

  const removed: any[] = [];
  const added: any[] = [];

  for (const [id, item1] of map1.entries()) {
    const item2 = map2.get(id);
    if (!item2) {
      removed.push(item1);
    } else {
      const s1 = getStringVal(item1);
      const s2 = getStringVal(item2);
      if (s1 !== s2) {
        changes.push({
          type: 'MODIFIED',
          entityType,
          entityId: id,
          before: s1,
          after: s2
        });
      }
    }
  }

  for (const [id, item2] of map2.entries()) {
    if (!map1.has(id)) {
      added.push(item2);
    }
  }

  // Detect ID_CHANGED
  // If a removed item has the exact same string value as an added item
  for (let i = removed.length - 1; i >= 0; i--) {
    const rItem = removed[i];
    const rStr = getStringVal(rItem);
    
    const addedIndex = added.findIndex(aItem => getStringVal(aItem) === rStr);
    if (addedIndex !== -1) {
      const aItem = added[addedIndex];
      changes.push({
        type: 'ID_CHANGED',
        entityType,
        entityId: `${rItem.id} -> ${aItem.id}`,
        before: rItem.id,
        after: aItem.id
      });
      // Remove them from added/removed lists
      removed.splice(i, 1);
      added.splice(addedIndex, 1);
    }
  }

  // Whatever is left in removed and added are true removals/additions
  for (const rItem of removed) {
    changes.push({
      type: 'REMOVED',
      entityType,
      entityId: rItem.id,
      before: getStringVal(rItem)
    });
  }

  for (const aItem of added) {
    changes.push({
      type: 'ADDED',
      entityType,
      entityId: aItem.id,
      after: getStringVal(aItem)
    });
  }

  return changes;
}

export function compareVersions(v1: PRDVersion, v2: PRDVersion): RequirementChange[] {
  const changes: RequirementChange[] = [];

  const prd1 = v1.structuredPRD;
  const prd2 = v2.structuredPRD;

  changes.push(...compareArrays(prd1.goals || [], prd2.goals || [], 'Goal'));
  changes.push(...compareArrays(prd1.functionalRequirements || [], prd2.functionalRequirements || [], 'Requirement'));
  changes.push(...compareArrays(prd1.userStories || [], prd2.userStories || [], 'UserStory'));
  changes.push(...compareArrays(prd1.successMetrics || [], prd2.successMetrics || [], 'Metric'));

  return changes;
}

export function generateEvolutionSummary(changes: RequirementChange[]): EvolutionSummary {
  const summary: EvolutionSummary = { added: [], modified: [], removed: [] };

  for (const change of changes) {
    if (change.type === 'ADDED') {
      summary.added.push(`${change.entityType} [${change.entityId}]: ${change.after}`);
    } else if (change.type === 'REMOVED') {
      summary.removed.push(`${change.entityType} [${change.entityId}]: ${change.before}`);
    } else if (change.type === 'MODIFIED') {
      summary.modified.push(`${change.entityType} [${change.entityId}]`);
    } else if (change.type === 'ID_CHANGED') {
      // Treat ID_CHANGED as a modification of the ID for summary purposes
      summary.modified.push(`${change.entityType} ID changed: ${change.entityId}`);
    }
  }

  return summary;
}
