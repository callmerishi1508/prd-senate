import { Dependency } from './planning-schema';

export function calculateCriticalPath(epicsIds: string[], dependencies: Dependency[]): string[] {
  const adj = new Map<string, string[]>();
  epicsIds.forEach(id => adj.set(id, []));

  dependencies.forEach(d => {
    if (d.type === 'BLOCKS' || d.type === 'REQUIRES') {
      const from = d.type === 'BLOCKS' ? d.from : d.to;
      const to = d.type === 'BLOCKS' ? d.to : d.from;
      if (!adj.has(from)) adj.set(from, []);
      if (!adj.has(to)) adj.set(to, []);
      adj.get(from)!.push(to);
    }
  });

  const memo = new Map<string, string[]>();
  const visiting = new Set<string>();

  function dfs(node: string): string[] {
    if (memo.has(node)) return memo.get(node)!;
    if (visiting.has(node)) return [];
    
    visiting.add(node);
    let longestPath: string[] = [];
    for (const neighbor of adj.get(node) || []) {
      const path = dfs(neighbor);
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }
    visiting.delete(node);
    
    const result = [node, ...longestPath];
    memo.set(node, result);
    return result;
  }

  let criticalPath: string[] = [];
  for (const node of epicsIds) {
    const path = dfs(node);
    if (path.length > criticalPath.length) {
      criticalPath = path;
    }
  }

  return criticalPath;
}
