import { generateOllamaResponse } from './src/lib/agents/ollama';

async function main() {
    const model = 'qwen2.5:1.5b';
    
    // Condensed Summary (simulating Stage C: Consensus Summary)
    const consensusSummary = `
PRODUCT OVERVIEW
A mobile-first ride sharing platform exclusively for verified college students, offering affordable and safe transportation.

KEY GOALS
1. Affordable rides for students.
2. Safety through university email verification.
3. Easy carpooling.

KEY FEATURES
- Student Verification via .edu email.
- Driver Matching.
- Fare Splitting.
- Emergency SOS button.
    `.trim();

    const pocPromptSystem = `
You are a PRD generator.
Based on the Consensus Summary, generate ONLY the Product Overview and Functional Requirements sections of the PRD.

CRITICAL RULE: EVERY single item in "functionalRequirements" MUST have a valid "source" property.

Return ONLY valid JSON matching this schema exactly:
{
  "productOverview": "string",
  "functionalRequirements": [ { "description": "string", "purpose": "string", "userValue": "string", "source": "string" } ]
}
`;

    const pocPromptUser = `Consensus Summary:\n${consensusSummary}`;

    console.log("Running Hierarchical POC...");
    const start = Date.now();
    const res = await generateOllamaResponse([
        { role: 'system', content: pocPromptSystem },
        { role: 'user', content: pocPromptUser }
    ], { model, format: 'json', num_ctx: 1024, num_predict: 800 });
    const end = Date.now();

    console.log("\n==============================");
    console.log("HIERARCHICAL POC RESULTS");
    console.log("==============================");
    console.log(`Latency: ${end - start}ms`);
    console.log(`System Prompt Size: ${pocPromptSystem.length} chars`);
    console.log(`User Prompt Size: ${pocPromptUser.length} chars`);
    console.log(`Total Prompt Size: ${pocPromptSystem.length + pocPromptUser.length} chars`);
    console.log("\nRAW OUTPUT:");
    console.log(res);
}

main().catch(console.error);
