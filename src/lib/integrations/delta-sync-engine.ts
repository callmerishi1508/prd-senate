export function computeDelta(localObj: Record<string, any>, externalObj: Record<string, any>): Record<string, any> {
  const diff: Record<string, any> = {};
  
  const allKeys = new Set([...Object.keys(localObj), ...Object.keys(externalObj)]);
  
  for (const key of allKeys) {
    // Ignore internal IDs or metadata in delta comparison
    if (['id', 'localId', 'externalId', 'fingerprint', 'syncStatus', 'lastSyncedAt'].includes(key)) continue;

    const localVal = JSON.stringify(localObj[key]);
    const extVal = JSON.stringify(externalObj[key]);

    if (localVal !== extVal && localObj[key] !== undefined) {
      diff[key] = localObj[key];
    }
  }

  return diff;
}
