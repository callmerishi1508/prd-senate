import { StructuredPRD } from '../prd/schema';
import { TraceabilityMap } from './types';
import { validateTraceability } from './validator';

function getWordOverlap(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().match(/\b\w+\b/g) || [];
  const words2 = text2.toLowerCase().match(/\b\w+\b/g) || [];
  const set2 = new Set(words2);
  return words1.filter(w => set2.has(w) && w.length > 3).length; // ignore small words
}

function getWordOverlapRatio(text1: string, text2: string): number {
  if (text1 === text2) return 1;
  const words1 = text1.toLowerCase().match(/\b\w+\b/g)?.filter(w => w.length > 2) || [];
  const words2 = text2.toLowerCase().match(/\b\w+\b/g)?.filter(w => w.length > 2) || [];
  if (words1.length === 0 && words2.length === 0) return 0;
  const set2 = new Set(words2);
  const overlap = words1.filter(w => set2.has(w)).length;
  const maxLen = Math.max(words1.length, words2.length);
  return maxLen === 0 ? 0 : overlap / maxLen;
}

export function buildTraceability(prd: StructuredPRD, previousPrd?: StructuredPRD): { maps: TraceabilityMap[], errors: string[] } {
  // 1. Generate IDs
  prd.goals = (prd.goals || []).map(g => typeof g === 'string' ? { description: g } : g);
  prd.functionalRequirements = (prd.functionalRequirements || []).map(fr => typeof fr === 'string' ? { description: fr, purpose: 'Requirement', userValue: '' } : fr);
  prd.userStories = (prd.userStories || []).map(us => typeof us === 'string' ? { title: us, description: us, acceptanceCriteria: [] } : us);
  prd.successMetrics = (prd.successMetrics || []).map(sm => typeof sm === 'string' ? { description: sm } : sm);

  function preserveOrGenerateId(items: any[], prefix: string, previousItems: any[] = []) {
    let maxIdNum = 0;
    // Find the highest ID number in previousItems
    previousItems.forEach(item => {
      if (item && item.id && String(item.id).startsWith(prefix + '-')) {
        const num = parseInt(item.id.split('-')[1], 10);
        if (!isNaN(num) && num > maxIdNum) {
          maxIdNum = num;
        }
      }
    });

    // Make a copy of previousItems to remove as they are matched
    const availablePrev = [...previousItems];

    items.forEach(item => {
      // If it already has an ID, keep it and update maxIdNum
      if (item.id && String(item.id).startsWith(prefix + '-')) {
         const num = parseInt(item.id.split('-')[1], 10);
         if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
         return;
      }

      const str = item.description || item.title || '';
      let bestMatch: any = null;
      let maxRatio = -1;

      availablePrev.forEach(prev => {
        const prevStr = prev.description || prev.title || '';
        const ratio = getWordOverlapRatio(str, prevStr);
        if (ratio > maxRatio && ratio >= 0.5) { // At least 50% similarity
          maxRatio = ratio;
          bestMatch = prev;
        }
      });

      if (bestMatch && bestMatch.id) {
        item.id = bestMatch.id;
        const idx = availablePrev.indexOf(bestMatch);
        if (idx !== -1) availablePrev.splice(idx, 1);
      } else {
        maxIdNum++;
        item.id = `${prefix}-${String(maxIdNum).padStart(3, '0')}`;
      }
    });
  }

  preserveOrGenerateId(prd.goals, 'G', previousPrd?.goals || []);
  preserveOrGenerateId(prd.functionalRequirements, 'FR', previousPrd?.functionalRequirements || []);
  preserveOrGenerateId(prd.userStories, 'US', previousPrd?.userStories || []);
  preserveOrGenerateId(prd.successMetrics, 'SM', previousPrd?.successMetrics || []);

  const maps: TraceabilityMap[] = prd.goals.map(g => ({
    goalId: g.id!,
    requirementIds: [],
    userStoryIds: [],
    metricIds: []
  }));

  // 2. Build relationships
  // Map FR to Goals
  prd.functionalRequirements.forEach(fr => {
    let bestGoalIndex = 0;
    let maxOverlap = -1;
    prd.goals.forEach((g, i) => {
      const overlap = getWordOverlap(fr.description, g.description);
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestGoalIndex = i;
      }
    });
    if (maxOverlap > 0 && maps[bestGoalIndex]) {
      maps[bestGoalIndex].requirementIds.push(fr.id!);
    }
    // If maxOverlap == 0, it becomes an orphan!
  });

  // Map US to FR
  prd.userStories.forEach(us => {
    let bestFrIndex = 0;
    let maxOverlap = -1;
    prd.functionalRequirements.forEach((fr, i) => {
      const overlap = getWordOverlap(us.title + ' ' + us.description, fr.description);
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestFrIndex = i;
      }
    });
    if (maxOverlap > 0 && prd.functionalRequirements[bestFrIndex]) {
      const frId = prd.functionalRequirements[bestFrIndex].id!;
      const map = maps.find(m => m.requirementIds.includes(frId));
      if (map) {
        map.userStoryIds.push(us.id!);
      }
    }
  });

  // Map SM to Goals
  prd.successMetrics.forEach(sm => {
    let bestGoalIndex = 0;
    let maxOverlap = -1;
    prd.goals.forEach((g, i) => {
      const overlap = getWordOverlap(sm.description, g.description);
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestGoalIndex = i;
      }
    });
    if (maxOverlap > 0 && maps[bestGoalIndex]) {
      maps[bestGoalIndex].metricIds.push(sm.id!);
    }
  });

  // 3. Validate Traceability
  const errors = validateTraceability(prd, maps);

  return { maps, errors };
}
