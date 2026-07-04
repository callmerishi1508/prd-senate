import { runResearchEngine } from './src/lib/research/research-engine';
import { generateOllamaResponse } from './src/lib/agents/ollama';
import { AGENT_PROMPTS } from './src/lib/agents/prompts';

async function main() {
    const projectId = 'proj-ride-test';
    const problemStatement = 'Build a ride sharing platform for college students';
    const targetUsers = 'College students without cars';
    const constraints = 'Must be extremely cheap, student-only, safe, mobile first';
    const model = 'qwen2.5:1.5b';

    const prompt = `Problem: ${problemStatement}\nUsers: ${targetUsers}\nConstraints: ${constraints}`;

    console.log("Running Research...");
    const researchReport = await runResearchEngine(prompt);
    
    console.log("Drafting...");
    const strategistPrompt = `Research context: ${JSON.stringify(researchReport, null, 2)}\nOrganizational Context:\n\n${prompt}`;
    const draftRes = await generateOllamaResponse([
        { role: 'system', content: AGENT_PROMPTS.STRATEGIST },
        { role: 'user', content: strategistPrompt }
    ], { model, num_predict: 800, num_ctx: 1024 });

    console.log("Critique 1...");
    const uxRes = await generateOllamaResponse([
        { role: 'system', content: AGENT_PROMPTS.UX_CRITIQUE },
        { role: 'user', content: `Review this draft:\n${draftRes}` }
    ], { model, num_predict: 400, num_ctx: 1024 });

    console.log("Critique 2...");
    const techRes = await generateOllamaResponse([
        { role: 'system', content: AGENT_PROMPTS.TECH_CRITIQUE },
        { role: 'user', content: `Review this draft:\n${draftRes}` }
    ], { model, num_predict: 400, num_ctx: 1024 });

    console.log("Verification...");
    const verifyRes = await generateOllamaResponse([
        { role: 'system', content: AGENT_PROMPTS.VERIFICATION },
        { role: 'user', content: `Draft:\n${draftRes}\nUX Critique:\n${uxRes}\nTech Critique:\n${techRes}` }
    ], { model, num_predict: 400, num_ctx: 1024 });

    const shortResearch = JSON.stringify(researchReport, null, 2).substring(0, 1000);
    const currentPrompt = `Organizational Context:\n\n\nResearch context:\n${shortResearch}\n\nDraft:\n${draftRes.substring(0, 1000)}\nCritiques:\n${uxRes.substring(0, 500)}\n${techRes.substring(0, 500)}\nVerification:\n${verifyRes.substring(0, 500)}`;

    const systemPromptLength = AGENT_PROMPTS.CONSENSUS.length;
    const userPromptLength = currentPrompt.length;

    console.log("\n==============================");
    console.log("PROMPT SIZE AUDIT (Characters)");
    console.log("==============================");
    console.log(`Research JSON Size: ${JSON.stringify(researchReport).length} chars`);
    console.log(`Draft Size: ${draftRes.length} chars`);
    console.log(`UX Critique Size: ${uxRes.length} chars`);
    console.log(`Tech Critique Size: ${techRes.length} chars`);
    console.log(`Verification Size: ${verifyRes.length} chars`);
    console.log(`CONSENSUS System Prompt: ${systemPromptLength} chars`);
    console.log(`CONSENSUS User Prompt: ${userPromptLength} chars`);
    console.log(`Total CONSENSUS Input Size: ${systemPromptLength + userPromptLength} chars`);

    console.log("\nRunning Consensus Output Test...");
    const consensusRes = await generateOllamaResponse([
        { role: 'system', content: AGENT_PROMPTS.CONSENSUS },
        { role: 'user', content: currentPrompt }
    ], { model, format: 'json', num_ctx: 1024, num_predict: 800 });

    console.log("\nRAW CONSENSUS OUTPUT:");
    console.log(consensusRes);
}

main().catch(console.error);
