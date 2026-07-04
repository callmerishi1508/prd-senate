const RECENT_SYNCS = new Map<string, number>();
const LOOP_THRESHOLD_MS = 60000; // 60 seconds

export function isSyncLooping(fingerprint: string): boolean {
  const lastSync = RECENT_SYNCS.get(fingerprint);
  const now = Date.now();
  
  if (lastSync && now - lastSync < LOOP_THRESHOLD_MS) {
    console.warn(`[Sync Loop Protection] Blocked redundant sync for ${fingerprint}`);
    return true; // Looping detected
  }
  
  RECENT_SYNCS.set(fingerprint, now);
  return false;
}

// Cleanup function to prevent memory leak on long-running servers
export function cleanupSyncLoopCache() {
  const now = Date.now();
  for (const [key, timestamp] of RECENT_SYNCS.entries()) {
    if (now - timestamp > 60000) { // Older than 1 minute
      RECENT_SYNCS.delete(key);
    }
  }
}
