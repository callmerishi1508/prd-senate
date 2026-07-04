import { NextResponse } from 'next/server';
import { runResearchEngine } from '../../../lib/research/research-engine';
import { generateOllamaResponse } from '../../../lib/agents/ollama';
import { AGENT_PROMPTS } from '../../../lib/agents/prompts';
import { smartExtractJSON as extractJSON } from '../../../lib/utils/smart-extractor';
import { runHierarchicalConsensus } from '../../../lib/agents/consensus';
import { StructuredPRD } from '../../../lib/prd/schema';
import { logGenerationEvent } from '../../../lib/telemetry/telemetry-manager';

export const maxDuration = 300;

export async function POST(req: Request) {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    const sendEvent = async (event: string, data: any) => {
        await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    };

    const processPipeline = async () => {
        try {
            const body = await req.json();
            const { projectId, problemStatement, targetUsers, constraints, model = 'qwen2.5-coder:7b' } = body;
            
            const userInput = `Problem Statement: ${problemStatement}\nTarget Users: ${targetUsers}\nConstraints: ${constraints}`;
            
            // 1. Research Engine
            sendEvent('agent-status', { agent: 'Research Engine', status: 'researching market' });
            const tResStart = Date.now();
            const researchReport = await runResearchEngine(projectId, userInput, model);
            const tResEnd = Date.now();
            
            logGenerationEvent({ projectId, model, stage: 'Research Engine', timestamp: new Date().toISOString(), latencyMs: tResEnd - tResStart, success: true }).catch(() => {});
            sendEvent('research-complete', { data: researchReport });

            // 2. Draft
            sendEvent('agent-status', { agent: 'Lead Product Manager', status: 'drafting PRD' });
            const draftPrompt = `Research Report:\n${JSON.stringify(researchReport, null, 2)}\n\nUser Input:\n${userInput}`;
            const tDraftStart = Date.now();
            const draftRes = await generateOllamaResponse([
                { role: 'system', content: AGENT_PROMPTS.DRAFT_AGENT },
                { role: 'user', content: draftPrompt }
            ], { model, num_predict: 800, num_ctx: 2048 });
            const tDraftEnd = Date.now();
            
            logGenerationEvent({ projectId, model, stage: 'Draft', timestamp: new Date().toISOString(), latencyMs: tDraftEnd - tDraftStart, success: true }).catch(() => {});
            sendEvent('draft-complete', { data: extractJSON(draftRes) });

            // 3 & 4. UX and Tech Critiques (Parallel)
            sendEvent('agent-status', { agent: 'Critique Panel', status: 'critiquing concurrently' });
            
            const uxPrompt = `Review this draft:\n${draftRes}`;
            const techPrompt = `Review this draft:\n${draftRes}`;

            const tCritiqueStart = Date.now();
            const [uxRes, techRes] = await Promise.all([
                generateOllamaResponse([
                    { role: 'system', content: AGENT_PROMPTS.UX_CRITIQUE },
                    { role: 'user', content: uxPrompt }
                ], { model, num_predict: 400, num_ctx: 1024 }),
                generateOllamaResponse([
                    { role: 'system', content: AGENT_PROMPTS.TECH_CRITIQUE },
                    { role: 'user', content: techPrompt }
                ], { model, num_predict: 400, num_ctx: 1024 })
            ]);
            const tCritiqueEnd = Date.now();
            
            logGenerationEvent({ projectId, model, stage: 'UX Critique', timestamp: new Date().toISOString(), latencyMs: tCritiqueEnd - tCritiqueStart, success: true }).catch(() => {});
            logGenerationEvent({ projectId, model, stage: 'Tech Critique', timestamp: new Date().toISOString(), latencyMs: tCritiqueEnd - tCritiqueStart, success: true }).catch(() => {});
            
            let uxParsed;
            try { uxParsed = extractJSON(uxRes); } catch(e) { uxParsed = {}; }
            if (!uxParsed || !uxParsed.argument) uxParsed = { ...uxParsed, argument: "The UX design needs more focus on user onboarding and clarity." };
            sendEvent('debate-message', { role: 'ux', name: 'UX Researcher', data: uxParsed });

            let techParsed;
            try { techParsed = extractJSON(techRes); } catch(e) { techParsed = {}; }
            if (!techParsed || !techParsed.argument) techParsed = { ...techParsed, argument: "The technical architecture must ensure high availability and data security." };
            sendEvent('debate-message', { role: 'tech', name: 'Technical Architect', data: techParsed });

            const consensusMode = model === 'qwen2.5:1.5b' ? 'legacy' : 'hierarchical';
            let verifyRes = "{}";

            if (consensusMode === 'legacy') {
                // 5. Verification
                sendEvent('agent-status', { agent: 'Verification Agent', status: 'verifying' })
                const verifyPrompt = `Draft:\n${draftRes}\nUX Critique:\n${uxRes}\nTech Critique:\n${techRes}`
                
                verifyRes = await generateOllamaResponse([
                  { role: 'system', content: AGENT_PROMPTS.VERIFICATION },
                  { role: 'user', content: verifyPrompt }
                ], { model, num_predict: 400, num_ctx: 1024 })
                
                let vParsed;
                try { vParsed = extractJSON(verifyRes); } catch(e) { vParsed = {}; }
                sendEvent('verification-complete', { data: vParsed })
            } else {
                sendEvent('verification-complete', { data: { argument: "Verification bypassed in Hierarchical mode." } });
            }

            // 7. Consensus
            let structuredPRD: StructuredPRD;
            
            if (consensusMode === 'hierarchical') {
                structuredPRD = await runHierarchicalConsensus(projectId, model, researchReport, draftRes, uxRes, techRes, verifyRes, sendEvent);
            } else {
                sendEvent('agent-status', { agent: 'Quality Validator', status: 'validating assembly' });
                const { validateAndNormalizePRD } = require('../../../lib/prd/validator');
                const { runRepairAgent } = require('../../../lib/agents/repair-agent');
                
                let assembled = {};
                try { assembled = extractJSON(draftRes); } catch (e) { }
                let { isValid, normalizedPRD, violations } = validateAndNormalizePRD(assembled);
                
                if (!isValid) {
                    sendEvent('schema-violations', { violations });
                    const naturalErrors = violations.map((v: any) => `Field ${v.field} is invalid or missing: ${v.actualType} instead of ${v.expectedType}`);
                    const repairReport = { decision: "REJECT", criticalIssues: naturalErrors, summary: "Schema validation failed during Assembly." };
                    sendEvent('agent-status', { agent: 'Repair Agent', status: `fixing assembly schema` });
                    const repairedPRD = await runRepairAgent(assembled, repairReport, researchReport, model);
                    const check = validateAndNormalizePRD(repairedPRD);
                    if (check.isValid) {
                        normalizedPRD = check.normalizedPRD;
                    } else {
                        throw new Error("Assembly Failed validation gates after repair.");
                    }
                }
                structuredPRD = normalizedPRD as StructuredPRD;
            }

            sendEvent('agent-status', { agent: 'System', status: 'done' });
            sendEvent('done', { success: true, prd: structuredPRD });
        } catch (e: any) {
            console.error('Pipeline error:', e);
            sendEvent('error', { message: e.message });
            sendEvent('done', { success: false });
        } finally {
            writer.close();
        }
    };

    processPipeline();

    return new NextResponse(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
