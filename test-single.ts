import { strict as assert } from 'assert';
import { Agent, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(new Agent({ bodyTimeout: 0 }));

async function runTest() {
  const bodyData = JSON.stringify({
    projectId: "proj-test",
    problemStatement: "Build a ride sharing platform for college students",
    targetUsers: "College students",
    constraints: "Must be scalable",
    model: "qwen2.5:1.5b"
  });

  const res = await fetch('http://localhost:3000/api/generate', {
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
      if (dataStr && event !== 'agent-status') {
         console.log(`[Event: ${event}]`, dataStr.substring(0, 200));
      } else if (event === 'agent-status') {
         console.log(`[Status]`, dataStr);
      }
    }
  }
}

runTest();
