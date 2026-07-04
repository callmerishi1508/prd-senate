const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk(path.join(__dirname, '../src'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (content.includes("= 'qwen2.5:1.5b'")) {
    content = content.replace(/=\s*'qwen2\.5:1\.5b'/g, "= 'default'");
    changed = true;
  }
  if (content.includes("model: 'qwen2.5:1.5b'")) {
    content = content.replace(/model:\s*'qwen2\.5:1\.5b'/g, "model: 'default'");
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated', f);
  }
});
