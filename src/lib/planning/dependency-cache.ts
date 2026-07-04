import { getAllKnowledgeChunks, saveKnowledgeBulk, getAllKnowledgeDocuments } from '../knowledge/memory-manager';

export interface CachedDependency {
  pairHash: string; // e.g. "EPIC-A|EPIC-B"
  type: string | null; // e.g. "REQUIRES" or null if no dependency
}

export async function getDependencyCache(projectId: string): Promise<Map<string, string | null>> {
  const chunks = await getAllKnowledgeChunks();
  // Filter for both chunkType and projectId
  // Since we don't have documentId easily available in chunk to filter by projectId, wait, knowledge chunk schema doesn't have projectId.
  // Oh no, KnowledgeChunk doesn't have projectId. KnowledgeDocument does.
  // I must fetch documents first, filter by projectId, then filter chunks.
  // Let me replace the implementation to do this properly.
  const docs = await getAllKnowledgeDocuments();
  const projectDocs = docs.filter(d => d.projectId === projectId);
  const docIds = new Set(projectDocs.map(d => d.id));
  
  const cacheChunks = chunks.filter(c => (c.chunkType as string) === 'DEPENDENCY_CACHE' && docIds.has(c.documentId));
  const cacheMap = new Map<string, string | null>();
  
  for (const c of cacheChunks) {
    try {
      const parsed = JSON.parse(c.content) as CachedDependency[];
      for (const item of parsed) {
        cacheMap.set(item.pairHash, item.type);
      }
    } catch(e) {}
  }
  return cacheMap;
}

export async function saveToDependencyCache(projectId: string, newDeps: CachedDependency[]): Promise<void> {
  if (newDeps.length === 0) return;
  const docId = `dep-cache-${Date.now()}`;
  await saveKnowledgeBulk(
    [{ id: docId, projectId, type: 'PLANNING', title: 'Dependency Cache', sourceId: 'system', createdAt: new Date().toISOString() }],
    [{
       id: `chk-${Date.now()}`,
       documentId: docId,
       chunkType: 'DEPENDENCY_CACHE' as any,
       content: JSON.stringify(newDeps),
       sourceConfidence: 100,
       embedding: []
    }]
  );
}
