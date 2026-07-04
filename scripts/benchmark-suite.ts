import { strict as assert } from 'assert';
import { Agent, setGlobalDispatcher } from 'undici';
import fs from 'fs';
import path from 'path';

setGlobalDispatcher(new Agent({ bodyTimeout: 0 }));

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBenchmark() {
  console.log("==========================================");
  console.log("RELIABILITY BENCHMARK SUITE");
  console.log("==========================================\n");

  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 1;

  console.log(`Starting benchmark for ${limit} project(s) sequentially.\n`);

  const baseUrl = 'http://localhost:3000';

  async function generatePRD(projectId: string, statement: string) {
    console.log(`[Project ${projectId}] Starting pipeline for: ${statement}`);
    
    const bodyData = JSON.stringify({
        projectId,
        problemStatement: statement,
        targetUsers: "General users",
        constraints: "Must be scalable and reliable",
        model: "qwen2.5:1.5b"
    });

    let success = false;
    let validationFailed = false;

    try {
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyData
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        
        for (const block of blocks) {
          let event = '';
          let dataStr = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
          }
          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (event === 'done') success = data.success;
              if (event === 'validation-failed') {
                validationFailed = true;
                console.log("    [Validation Blocked]:", data.reasons);
              }
            } catch(e) {}
          }
        }
      }
    } catch (e: any) {
       console.log("    [Timeout/Error]: Fetch aborted or failed:", e.message);
       success = false;
    }

    if (validationFailed || !success) {
      throw new Error("AI Generation Failed or Timed out.");
    }
  }

  // Generate projects based on limit
  const baseStatements = [
    "Build a ride sharing platform for college students",
    "Build an AI Resume Builder",
    "Build a water tracking app",
    "Build a Hospital Management System",
    "Build an E-commerce Marketplace",
    "Build a Smart Home Automation Hub",
    "Build an Online Learning Platform",
    "Build a Personal Finance Tracker",
    "Build a Project Management Tool",
    "Build a Social Media Dashboard"
  ];

  const projects = Array.from({ length: limit }).map((_, i) => ({
    id: `proj-bench-${Date.now()}-${i}`,
    stmt: baseStatements[i % baseStatements.length] + ` (Iteration ${Math.floor(i / baseStatements.length) + 1})`
  }));

  // Clean data files
  console.log("Clearing previous data to establish baseline...");
  const dataDir = path.join(process.cwd(), 'data');
  const filesToClear = [
    'ai_corrections.jsonl',
    'ai_generations.jsonl',
    'versions.json'
  ];
  for (const file of filesToClear) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  const knowledgeDir = path.join(dataDir, 'knowledge');
  if (fs.existsSync(knowledgeDir)) {
    fs.rmSync(knowledgeDir, { recursive: true, force: true });
  }

  // Await server readiness if we just deleted things
  await delay(2000);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    try {
      await generatePRD(proj.id, proj.stmt);
      successCount++;
      console.log(`    ✅ Pipeline Success`);
    } catch (e: any) {
      failCount++;
      console.log(`    ❌ Pipeline Failed: ${e.message}`);
    }
  }

  console.log("\n==========================================");
  console.log("BENCHMARK COMPLETE");
  console.log("==========================================");
  console.log(`Total Projects: ${limit}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  // Fetch telemetry to report baseline
  try {
    const telRes = await fetch(`${baseUrl}/api/telemetry`);
    const stats = await telRes.json();
    console.log("\nTELEMETRY REPORT:");
    console.log(`Success Rate: ${((successCount / limit) * 100).toFixed(1)}%`);
    console.log(`Correction Rate: ${(stats.aiCorrectionRate * 100).toFixed(1)}%`);
    console.log(`Average Generation Time: ${(stats.averageLatencyMs / 1000 / 60).toFixed(2)} min`);
    console.log(`Total Corrections: ${stats.totalCorrections}`);
    console.log(`Health Score: ${stats.healthScore ? stats.healthScore.toFixed(1) : '100'}`);
    console.log(`Critical Escapes: ${stats.criticalEscapes}`);
    console.log("\nPenalty Breakdown:");
    console.log(`- Validation: ${stats.penalties?.validationPenalty.toFixed(1)}`);
    console.log(`- Retry: ${stats.penalties?.retryPenalty.toFixed(1)}`);
    console.log(`- Correction: ${stats.penalties?.correctionPenalty.toFixed(1)}`);
    console.log(`- Latency: ${stats.penalties?.latencyPenalty.toFixed(1)}`);
  } catch (e: any) {
    console.error("Failed to fetch telemetry report:", e.message);
  }
}

runBenchmark();
