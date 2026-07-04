import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  res.on('data', (chunk) => {
    const text = chunk.toString();
    const events = text.split('\n\n').filter(Boolean);
    for (const ev of events) {
      const lines = ev.split('\n');
      const eventType = lines.find(l => l.startsWith('event: '))?.replace('event: ', '');
      const dataLine = lines.find(l => l.startsWith('data: '))?.replace('data: ', '');
      
      if (eventType && dataLine) {
        console.log(`[EVENT] ${eventType}`);
        if (eventType === 'final-prd') {
          const prd = JSON.parse(dataLine);
          console.log("\n=== FINAL PRD ===");
          console.log("Requirements:", prd.data.requirements.map(r => r.id));
          console.log("Stories:", prd.data.userStories.map(s => s.id));
        }
      }
    }
  });
  
  res.on('end', () => {
    console.log('[DONE]');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  problemStatement: "Build a ride sharing platform for college students",
  targetUsers: "college students",
  constraints: "none",
  model: "qwen2.5:1.5b"
}));
req.end();
