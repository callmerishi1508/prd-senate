import { saveKnowledge, deleteKnowledgeBySourceId } from './src/lib/knowledge/memory-manager';
import { generateEmbedding } from './src/lib/knowledge/embedding-manager';
import { retrieveContext } from './src/lib/knowledge/retrieval-engine';
import { runQualityGate } from './src/lib/quality/quality-gate';
import { KnowledgeDocument, KnowledgeChunk } from './src/lib/knowledge/knowledge-schema';

async function testConflict() {
  console.log("=== Quality Gate Conflict Test ===");

  const docId = "doc-test-conflict";
  const sourceId = "v-test-conflict-001";

  // 1. Index a standard
  const standardText = "MFA Required for all logins";
  const embedding = await generateEmbedding(standardText);
  
  const doc: KnowledgeDocument = {
    id: docId,
    type: "STANDARD",
    title: "Security Standard: Authentication",
    sourceId: sourceId,
    createdAt: new Date().toISOString()
  };

  const chunk: KnowledgeChunk = {
    id: "chk-conflict-123",
    documentId: docId,
    chunkType: "STANDARD",
    content: standardText,
    sourceConfidence: 100,
    embedding
  };

  console.log("Indexing Standard: MFA Required");
  await saveKnowledge(doc, [chunk]);

  // 2. Retrieve Context for the prompt
  const prompt = "Build a banking app with password-only login";
  const retrieved = await retrieveContext(prompt, 5);
  const contextStr = retrieved.map(c => `[${c.chunkType} from ${c.documentTitle}]\n${c.content}`).join('\n\n');
  console.log("Retrieved Context: ", contextStr || "NONE");

  // 3. Mock a generated PRD Markdown that violates the standard
  const mockPRDMarkdown = `
# Product Overview
A simple banking app.

## Goals
- Allow users to log in easily.

## Functional Requirements
**FR-001**
- Description: Users must log in using only a password.
- Purpose: Simplicity
- User Value: Fast access

## Technical Considerations
- Security: Password-only login is implemented for ease of use.
  `;

  console.log("\nRunning Quality Gate...");
  const report = await runQualityGate(mockPRDMarkdown, null, 'qwen2.5:1.5b', contextStr);

  console.log(`\nRaw Report: ${JSON.stringify(report, null, 2)}`);
  console.log(`\nQuality Gate Decision: ${report.decision}`);
  if (report.criticalIssues && report.criticalIssues.length > 0) {
    console.log("Critical Issues:");
    report.criticalIssues.forEach((issue: string) => console.log(` - ${issue}`));
  }

  if (report.decision === 'REJECT') {
    const isConflictCaught = report.criticalIssues.some((i: string) => i.toLowerCase().includes('mfa') || i.toLowerCase().includes('conflict') || i.toLowerCase().includes('standard') || i.toLowerCase().includes('password'));
    if (isConflictCaught) {
      console.log("\n✅ SUCCESS: Quality Gate rejected the PRD due to Organizational Memory conflict.");
    } else {
      console.log("\n❌ FAILED: Rejected, but not clearly due to MFA conflict.");
    }
  } else {
    console.log("\n❌ FAILED: Quality Gate did NOT reject the conflicting PRD.");
  }

  console.log("\nCleaning up...");
  await deleteKnowledgeBySourceId(sourceId);
}

testConflict().catch(console.error);
