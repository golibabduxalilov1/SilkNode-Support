import { pool, initSchema } from '../../src/db.js';

let schemaReady = false;

export async function ensureSchema() {
  if (!schemaReady) {
    await initSchema();
    schemaReady = true;
  }
}

/** Har testdan oldin barcha jadvalni tozalaydi (schema saqlanadi). */
export async function resetDb() {
  await ensureSchema();
  await pool.query(
    'TRUNCATE TABLE audit_logs, status_history, attachments, messages, tickets, organizations, users RESTART IDENTITY CASCADE'
  );
}

export async function closeDb() {
  await pool.end();
}
