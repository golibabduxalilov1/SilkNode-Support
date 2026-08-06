import bcrypt from 'bcryptjs';
import { db } from '../../src/db.js';
import { signToken } from '../../src/lib/jwt.js';

let counter = 0;
const uniq = (prefix) => `${prefix}${Date.now()}${counter++}`;

export async function createOrganization(overrides = {}) {
  const { rows } = await db.query(
    'INSERT INTO organizations (name, contact_person, contact_phone, is_active) VALUES ($1,$2,$3,$4) RETURNING *',
    [overrides.name || uniq('Org-'), overrides.contact_person || null, overrides.contact_phone || null, overrides.is_active ?? true]
  );
  return rows[0];
}

export async function createUser({ role = 'employee', fullname, telegramId, phone, username, password } = {}) {
  const dbRole = role === 'employee' ? 'user' : role;
  const passwordHash = password ? bcrypt.hashSync(password, 4) : null;
  const { rows } = await db.query(
    `INSERT INTO users (telegram_id, fullname, username, password_hash, role, phone, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING *`,
    [telegramId || uniq('tg'), fullname || uniq('Foydalanuvchi '), username || null, passwordHash, dbRole, phone || '+998900000000']
  );
  return rows[0];
}

export function authHeader(user) {
  return { Authorization: `Bearer ${signToken(user)}` };
}
