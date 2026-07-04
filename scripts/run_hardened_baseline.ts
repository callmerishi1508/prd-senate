import { strict as assert } from 'assert';
import { Agent, setGlobalDispatcher } from 'undici';
import fs from 'fs';
import path from 'path';

setGlobalDispatcher(new Agent({ bodyTimeout: 0 }));

async function runBenchmark() {
  console.log("==========================================");
  console.log("FORENSIC BASELINE COLLECTION");
  console.log("==========================================\n");

  const baseUrl = 'http://localhost:3000';

  async function generatePRD(projectId: string, statement: string, model: string) {
    console.log(`[Project ${projectId} - ${model}] Starting pipeline...`);
    
    const bodyData = JSON.stringify({
        projectId,
        problemStatement: statement,
        targetUsers: "General users",
        constraints: "Must be scalable and reliable",
        model
    });

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
        if(!reader) break;
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
      }
    } catch (e: any) {
       console.log(`    [Timeout/Error]: ${e.message}`);
    }
  }

  const projects = [
    { id: "proj-stab-23", stmt: "Build a Manufacturing ERP System", model: "qwen2.5:1.5b" },
    { id: "proj-stab-30", stmt: "Build a Ride Sharing Platform", model: "qwen2.5:1.5b" },
    { id: "proj-stab-44", stmt: "Build an Agriculture Marketplace", model: "qwen2.5:1.5b" },
    { id: "proj-stab-49", stmt: "Build an IoT Smart Home Platform", model: "qwen2.5:1.5b" },
    { id: "proj-comp-1", stmt: "Build a water tracking app", model: "qwen2.5-coder:7b" },
    { id: "proj-comp-2", stmt: "Build an AI Resume Builder", model: "qwen2.5-coder:7b" },
    { id: "proj-comp-3", stmt: "Build a Hospital Management System", model: "qwen2.5-coder:7b" },
    { id: "proj-comp-4", stmt: "Build a water tracking app", model: "llama3.1:8b" },
    { id: "proj-comp-5", stmt: "Build an AI Resume Builder", model: "llama3.1:8b" },
    { id: "proj-comp-6", stmt: "Build a Hospital Management System", model: "llama3.1:8b" }
  ];

  for (const p of projects) {
    await generatePRD(p.id, p.stmt, p.model);
  }
  
  console.log("Forensic baseline collection complete.");
}

runBenchmark().catch(console.error);
