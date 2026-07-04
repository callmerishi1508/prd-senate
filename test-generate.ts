import { Agent, setGlobalDispatcher } from 'undici';

// Disable the default 5-minute bodyTimeout
setGlobalDispatcher(new Agent({ bodyTimeout: 0 }));

async function run() {
  console.log("Starting...");
  const res = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problemStatement: "Build a water tracking app",
      targetUsers: "College students",
      constraints: "Must be scalable",
      model: "qwen2.5:1.5b"
    })
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
      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
      }
      if (event) {
        console.log("Event:", event);
      }
    }
  }
  console.log("Finished!");
}

run().catch(console.error);
