import { verifyToken } from '../lib/jwt.js';
import { db } from '../db.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
  try {
    const payload = verifyToken(token);
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [payload.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
  }
}

export const isStaff = (user) => user.role === 'agent' || user.role === 'admin';

export function requireStaff(req, res, next) {
  if (!isStaff(req.user)) return res.status(403).json({ error: 'Ruxsat yetarli emas' });
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Faqat administrator uchun' });
  next();
}
