import { promises as fs } from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const VERSIONS_FILE = path.join(DATA_DIR, 'versions.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const KNOWLEDGE_DOCS_FILE = path.join(DATA_DIR, 'knowledge', 'documents.json');
const KNOWLEDGE_CHUNKS_FILE = path.join(DATA_DIR, 'knowledge', 'chunks.json');
const SYNC_STATE_FILE = path.join(process.cwd(), '.senate-data', 'sync-state.json');

async function migrate() {
  console.log("Starting Storage Migration & Audit...");

  // 1. Migrate Versions
  try {
    const vData = await fs.readFile(VERSIONS_FILE, 'utf-8');
    const versions = JSON.parse(vData);
    let vMigrated = 0;
    for (const v of versions) {
      if (!v.projectId) {
        // Tag old artifacts as legacy so they don't leak into new sessions
        v.projectId = 'legacy-test-project';
        vMigrated++;
      }
    }
    if (vMigrated > 0) {
      await fs.writeFile(VERSIONS_FILE, JSON.stringify(versions, null, 2), 'utf-8');
      console.log(`✅ Migrated ${vMigrated} legacy versions in versions.json`);
    }
  } catch (e) { console.log("No versions.json found, skipping."); }

  // 2. Migrate Reviews
  try {
    const rData = await fs.readFile(REVIEWS_FILE, 'utf-8');
    const reviews = JSON.parse(rData);
    let rMigrated = 0;
    for (const r of reviews) {
      if (!r.projectId) {
        r.projectId = 'legacy-test-project';
        rMigrated++;
      }
    }
    if (rMigrated > 0) {
      await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
      console.log(`✅ Migrated ${rMigrated} legacy reviews in reviews.json`);
    }
  } catch (e) { console.log("No reviews.json found, skipping."); }

  // 3. Migrate Sync Jobs
  try {
    const sData = await fs.readFile(SYNC_STATE_FILE, 'utf-8');
    const syncs = JSON.parse(sData);
    let sMigrated = 0;
    for (const s of syncs) {
      if (!s.projectId) {
        s.projectId = 'legacy-test-project';
        sMigrated++;
      }
    }
    if (sMigrated > 0) {
      await fs.writeFile(SYNC_STATE_FILE, JSON.stringify(syncs, null, 2), 'utf-8');
      console.log(`✅ Migrated ${sMigrated} legacy sync jobs in sync-state.json`);
    }
  } catch (e) { console.log("No sync-state.json found, skipping."); }

  // 4. Migrate Knowledge
  try {
    const dData = await fs.readFile(KNOWLEDGE_DOCS_FILE, 'utf-8');
    const docs = JSON.parse(dData);
    let dMigrated = 0;
    for (const d of docs) {
      if (!d.environment) {
        d.environment = 'PROD';
        dMigrated++;
      }
    }
    if (dMigrated > 0) {
      await fs.writeFile(KNOWLEDGE_DOCS_FILE, JSON.stringify(docs, null, 2), 'utf-8');
      console.log(`✅ Migrated ${dMigrated} knowledge documents to PROD environment`);
    }
  } catch (e) { console.log("No knowledge documents found, skipping."); }

  console.log("Migration Complete.");
}

migrate().catch(console.error);
