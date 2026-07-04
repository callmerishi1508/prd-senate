const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    if (fs.statSync(file).isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
walk(path.join(__dirname, '../src')).forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (content.includes("model: string = 'default'")) {
    content = content.replace(/model: string = 'default'/g, "model: string = 'qwen2.5:1.5b'");
    changed = true;
  }
  if (content.includes("model: 'default'")) {
    content = content.replace(/model:\s*'default'/g, "model: 'qwen2.5:1.5b'");
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Restored', f);
  }
});
