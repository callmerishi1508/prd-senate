import { indexApprovedPRD } from './src/lib/knowledge/indexing-engine';
import { retrieveContext } from './src/lib/knowledge/retrieval-engine';
import { deleteKnowledgeBySourceId } from './src/lib/knowledge/memory-manager';
import { generateOllamaResponse } from './src/lib/agents/ollama';
import { AGENT_PROMPTS } from './src/lib/agents/prompts';
import { runResearchEngine } from './src/lib/research/research-engine';

async function testRAG() {
  console.log("=== End-to-End RAG Test ===");

  // 1. Create and index an older PRD
  const version: any = {
    id: "v-test-rag-999",
    versionNumber: 1,
    createdAt: new Date().toISOString(),
    title: "Ride Sharing v1",
    status: "APPROVED",
    structuredPRD: {
      productOverview: "A standard ride sharing app.",
      functionalRequirements: [
        { description: "Driver Verification through biometric ID scan.", purpose: "Security", userValue: "Trust", source: "Market" },
        { description: "Real-time GPS Tracking of vehicles.", purpose: "Operations", userValue: "ETA accuracy", source: "Market" },
        { description: "Two-way Ratings system for driver and passenger.", purpose: "Quality", userValue: "Accountability", source: "Market" },
        { description: "Advance Ride Scheduling system.", purpose: "Convenience", userValue: "Planning", source: "Market" }
      ]
    },
    traceabilityMap: []
  };

  console.log("Indexing base PRD...");
  await indexApprovedPRD(version);

  // 2. Generate new PRD with retrieval
  console.log("Retrieving context for 'Ride Sharing Platform For Students'...");
  const prompt = "Build a Ride Sharing Platform For Students";
  const retrieved = await retrieveContext(prompt, 5);
  console.log(`Retrieved ${retrieved.length} chunks.`);
  
  const contextStr = retrieved.map(c => `[${c.chunkType} from ${c.documentTitle} (Similarity: ${(c.similarity * 100).toFixed(1)}%)]\n${c.content}`).join('\n\n');
  const enhancedPrompt = `User Prompt: ${prompt}\n\nOrganizational Memory / Context:\n${contextStr}`;

  console.log("\nRunning Research Engine...");
  const researchReport = await runResearchEngine(enhancedPrompt);

  console.log("Running Product Strategist with Organizational Memory...");
  const strategistPrompt = `Research context: ${JSON.stringify(researchReport, null, 2)}\nOrganizational Context:\n${contextStr}\n${prompt}`;
  
  const draftRes = await generateOllamaResponse([
    { role: 'system', content: AGENT_PROMPTS.STRATEGIST },
    { role: 'user', content: strategistPrompt }
  ], { model: 'qwen2.5:1.5b' });

  console.log("\n--- STRATEGIST OUTPUT ---");
  console.log(draftRes);

  console.log("\nCleaning up...");
  await deleteKnowledgeBySourceId(version.id);
}

testRAG().catch(console.error);
