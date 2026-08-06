import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, requireStaff, requireAdmin } from '../middleware/auth.js';
import { publicUser } from './auth.routes.js';

export const usersRouter = Router();
usersRouter.use(requireAuth);

/** Ijrochilar ro'yxati (tayinlash uchun) */
usersRouter.get('/staff', requireStaff, async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM users WHERE role IN ('agent','admin') AND is_active = true ORDER BY fullname"
    );
    res.json({ items: rows.map(publicUser) });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/staff', requireAdmin, async (req, res) => {
  const { fullname, username, password, role = 'agent' } = req.body || {};
  if (!fullname || !username || !password) return res.status(400).json({ error: "Ism, login va parol to'ldirilishi shart" });
  try {
    const { rows } = await db.query(
      'INSERT INTO users (fullname, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [fullname, username, bcrypt.hashSync(password, 10), role === 'admin' ? 'admin' : 'agent']
    );
    res.status(201).json(publicUser(rows[0]));
  } catch {
    res.status(409).json({ error: 'Bunday login band' });
  }
});
