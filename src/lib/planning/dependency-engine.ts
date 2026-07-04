import { Epic, Dependency } from './planning-schema';
import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';
import { getDependencyCache, saveToDependencyCache, CachedDependency } from './dependency-cache';

export async function detectDependencies(epics: Epic[], projectId: string, model: string = 'qwen2.5:1.5b'): Promise<Dependency[]> {
  const deps: Dependency[] = [];
  const cache = await getDependencyCache(projectId);
  const newCacheEntries: CachedDependency[] = [];

  const ambiguousPairs: {from: Epic, to: Epic}[] = [];

  // 1. Deterministic Pass
  for (let i = 0; i < epics.length; i++) {
    for (let j = 0; j < epics.length; j++) {
      if (i === j) continue;
      
      const fromEpic = epics[i];
      const toEpic = epics[j];

      // Explicit ID References
      if (fromEpic.description.includes(toEpic.id) || fromEpic.title.includes(toEpic.id)) {
        deps.push({ from: fromEpic.id, to: toEpic.id, type: "REQUIRES" });
        continue;
      }

      // Traceability Co-location
      const sharedReqs = fromEpic.relatedRequirements.filter(req => toEpic.relatedRequirements.includes(req));
      if (sharedReqs.length > 0) {
        ambiguousPairs.push({from: fromEpic, to: toEpic});
        continue;
      }

      // Keyword Matching (Simple heuristic: common >5 letter words in title)
      const wordsA = new Set(fromEpic.title.toLowerCase().split(/\W+/).filter(w => w.length > 5));
      const wordsB = new Set(toEpic.title.toLowerCase().split(/\W+/).filter(w => w.length > 5));
      const intersection = [...wordsA].filter(x => wordsB.has(x));
      if (intersection.length > 0) {
        ambiguousPairs.push({from: fromEpic, to: toEpic});
      }
    }
  }

  // 2. Ambiguous Pair Identification
  // Deduplicate ambiguous pairs
  const uniqueAmbiguous = Array.from(new Map(ambiguousPairs.map(p => [`${p.from.id}|${p.to.id}`, p])).values());

  // Cap the number of pairs dynamically
  const maxPairs = Math.max(50, epics.length);
  const cappedPairs = uniqueAmbiguous.slice(0, maxPairs);

  // Check cache
  const uncachedPairs = [];
  for (const pair of cappedPairs) {
    const pairHash = `${pair.from.id}|${pair.to.id}`;
    if (cache.has(pairHash)) {
      const type = cache.get(pairHash);
      if (type) {
        deps.push({ from: pair.from.id, to: pair.to.id, type: type as any });
      }
    } else {
      uncachedPairs.push(pair);
    }
  }

  // 3. Targeted LLM Semantic Pass
  if (uncachedPairs.length > 0) {
    const pairsStr = uncachedPairs.map((p, idx) => `Pair ${idx + 1}: [${p.from.id}] ${p.from.title} vs [${p.to.id}] ${p.to.title}`).join('\n');
    const prompt = `${AGENT_PROMPTS.DEPENDENCY_DETECTION}\n\nPlease evaluate if the following specific pairs of Epics have a dependency:\n${pairsStr}\n`;

    let parsed: any;
    try {
      if (model === 'MOCK') {
        // Simulate enterprise API latency: 10ms per pair evaluated
        await new Promise(r => setTimeout(r, uncachedPairs.length * 10));
        parsed = { dependencies: [] };
      } else {
        const res = await generateOllamaResponse([
          { role: 'user', content: prompt }
        ], { model, format: 'json', num_ctx: 4096, num_predict: 2048 });
        parsed = JSON.parse(res);
      }
    } catch (e) {
      console.error("LLM Dependency detection failed:", e);
    }

    if (parsed?.dependencies) {
      for (const llmDep of parsed.dependencies) {
        if (!deps.find(d => d.from === llmDep.from && d.to === llmDep.to)) {
          deps.push(llmDep);
        }
        newCacheEntries.push({ pairHash: `${llmDep.from}|${llmDep.to}`, type: llmDep.type });
      }
    }

    // Cache the negatives too
    for (const pair of uncachedPairs) {
      const pairHash = `${pair.from.id}|${pair.to.id}`;
      if (!newCacheEntries.find(c => c.pairHash === pairHash)) {
        newCacheEntries.push({ pairHash, type: null });
      }
    }

    await saveToDependencyCache(projectId, newCacheEntries);
  }

  // Deduplicate final deps
  const finalDeps: Dependency[] = [];
  for (const dep of deps) {
    if (!finalDeps.find(d => d.from === dep.from && d.to === dep.to)) {
      finalDeps.push(dep);
    }
  }

  return finalDeps;
}
