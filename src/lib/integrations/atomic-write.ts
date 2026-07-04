import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function writeJsonAtomicSync(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempFilePath = `${filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tempFilePath, JSON.stringify(data, null, 2), 'utf-8');

  let retries = 50;
  let delay = 10;
  
  while (retries > 0) {
    try {
      fs.renameSync(tempFilePath, filePath);
      return;
    } catch (err: any) {
      if ((err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES') && retries > 1) {
        retries--;
        // Synchronous sleep hack since it's a sync function
        const start = Date.now();
        while (Date.now() - start < delay) {}
        delay += 5; // backoff
      } else {
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
        throw err;
      }
    }
  }
}
