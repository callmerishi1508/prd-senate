import { indexApprovedPRD } from './src/lib/knowledge/indexing-engine';
import { retrieveContext } from './src/lib/knowledge/retrieval-engine';
import { getAllVersions } from './src/lib/versioning/version-manager';
import { deleteKnowledgeBySourceId, getAllKnowledgeDocuments, getAllKnowledgeChunks } from './src/lib/knowledge/memory-manager';

async function runTest() {
  console.log("=== Knowledge Base Test ===");

  const versions = await getAllVersions();
  if (versions.length === 0) {
    console.log("No versions to test with. Run a generation first.");
    return;
  }

  const v = versions[0];
  console.log(`Indexing PRD: ${v.title || v.id}...`);
  await indexApprovedPRD(v);

  const docs = await getAllKnowledgeDocuments();
  const chunks = await getAllKnowledgeChunks();
  console.log(`Indexed ${docs.length} docs and ${chunks.length} chunks.`);

  if (chunks.length === 0) {
    console.log("❌ FAILED: No chunks indexed.");
    return;
  }

  // Check confidence
  const reqChunk = chunks.find(c => c.chunkType === 'REQUIREMENT');
  if (reqChunk && reqChunk.sourceConfidence === 100) {
    console.log("✅ SUCCESS: Source confidence mapped correctly to 100 for Requirement.");
  } else {
    console.log("❌ FAILED: Source confidence mapping missing or incorrect.");
  }

  console.log("Retrieving context for query: 'Build something similar'");
  const results = await retrieveContext("Build something similar", 3);
  
  if (results.length > 0) {
    console.log(`✅ SUCCESS: Retrieved ${results.length} relevant chunks.`);
    results.forEach((r, i) => {
      console.log(`  [${i+1}] Score: ${r.score.toFixed(2)} | Sim: ${r.similarity.toFixed(2)} | Conf: ${r.sourceConfidence} | Type: ${r.chunkType}`);
    });
  } else {
    console.log("❌ FAILED: Did not retrieve any chunks.");
  }

  // Check usage tracking
  const updatedChunks = await getAllKnowledgeChunks();
  const usedChunk = updatedChunks.find(c => c.id === results[0].id);
  if (usedChunk && usedChunk.usageCount && usedChunk.usageCount > 0) {
    console.log("✅ SUCCESS: Usage tracking correctly incremented.");
  } else {
    console.log("❌ FAILED: Usage tracking did not increment.");
  }

  console.log("Cleaning up test indexing...");
  await deleteKnowledgeBySourceId(v.id);
  console.log("Done.");
}

runTest().catch(console.error);
