import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { config } from '../config.js';
import { signToken } from '../lib/jwt.js';
import { parseInitData } from '../lib/telegram.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

/** Mini App: Telegram initData orqali kirish */
authRouter.post('/telegram', async (req, res, next) => {
  try {
    const { initData, devUser } = req.body || {};
    let tg;

    if (initData) {
      tg = parseInitData(initData);
    } else if (config.devAuthBypass && devUser) {
      tg = devUser; // faqat lokal ishlab chiqish uchun
    } else {
      return res.status(400).json({ error: 'initData yuborilmadi' });
    }

    const fullname = [tg.first_name, tg.last_name].filter(Boolean).join(' ') || tg.username || 'Foydalanuvchi';
    const telegramId = String(tg.id);

    let { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
    let user = rows[0];
    if (!user) {
      const inserted = await db.query(
        'INSERT INTO users (telegram_id, fullname, username, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [telegramId, fullname, tg.username || null, 'user']
      );
      user = inserted.rows[0];
    } else {
      const updated = await db.query(
        'UPDATE users SET fullname = $1, username = $2 WHERE id = $3 RETURNING *',
        [fullname, tg.username || null, user.id]
      );
      user = updated.rows[0];
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

/** Admin Panel: login va parol orqali kirish */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1 AND is_active = true', [username || '']);
    const user = rows[0];
    if (!user || !user.password_hash || !bcrypt.compareSync(password || '', user.password_hash)) {
      return res.status(401).json({ error: 'Login yoki parol xato' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export const publicUser = (u) => ({
  id: u.id,
  fullname: u.fullname,
  username: u.username,
  role: u.role,
  telegram_id: u.telegram_id,
});
