import pg from 'pg';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool(
  config.databaseUrl ? { connectionString: config.databaseUrl } : config.pg
);

/** Sync-ga o'xshash qulay wrapper: barcha route/service kod await db.query(...) chaqiradi. */
export const db = {
  query: (text, params = []) => pool.query(text, params),
};

export async function initSchema() {
  await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  telegram_id   TEXT UNIQUE,
  fullname      TEXT NOT NULL,
  username      TEXT UNIQUE,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'user',   -- user | agent | admin
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id                     SERIAL PRIMARY KEY,
  number                 TEXT UNIQUE,
  organization_id        INTEGER NOT NULL REFERENCES organizations(id),
  title                  TEXT NOT NULL,
  description            TEXT NOT NULL,
  category               TEXT NOT NULL,
  priority               TEXT NOT NULL DEFAULT 'medium',
  status                 TEXT NOT NULL DEFAULT 'new',
  author_id              INTEGER NOT NULL REFERENCES users(id),
  assigned_to            INTEGER REFERENCES users(id),
  first_response_at      TIMESTAMPTZ,
  closed_at              TIMESTAMPTZ,
  first_response_minutes INTEGER,
  resolution_minutes     INTEGER,
  last_message_at        TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id  INTEGER NOT NULL REFERENCES users(id),
  message    TEXT,
  is_system  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachments (
  id            SERIAL PRIMARY KEY,
  ticket_id     INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  message_id    INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  file_path     TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_author ON tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org    ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_tkt   ON messages(ticket_id);
`);

  // Eski bazalarda bu ustun yo'q bo'lishi mumkin — CREATE TABLE emas, ALTER orqali qo'shiladi.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;`);
}

export async function seedIfEmpty() {
  const { rows: orgRows } = await pool.query('SELECT COUNT(*)::int c FROM organizations');
  if (orgRows[0].c === 0) {
    const names = ['Silknode HQ', 'Silknode Production', 'Silknode Retail', 'Silknode Logistics'];
    for (const n of names) {
      await pool.query('INSERT INTO organizations(name) VALUES ($1)', [n]);
    }
  }
  const { rows: adminRows } = await pool.query(
    "SELECT COUNT(*)::int c FROM users WHERE role IN ('admin','agent')"
  );
  if (adminRows[0].c === 0) {
    await pool.query(
      'INSERT INTO users(fullname, username, password_hash, role) VALUES ($1, $2, $3, $4)',
      ['Bosh administrator', 'admin', bcrypt.hashSync('admin123', 10), 'admin']
    );
    await pool.query(
      'INSERT INTO users(fullname, username, password_hash, role) VALUES ($1, $2, $3, $4)',
      ['Texnik mutaxassis', 'agent', bcrypt.hashSync('agent123', 10), 'agent']
    );
  }
}
