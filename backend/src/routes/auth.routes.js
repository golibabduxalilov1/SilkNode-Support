import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { config, SUPERADMIN_ID } from '../config.js';
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
      // TZ 11.1-band: imzo noto'g'ri yoki muddati o'tgan bo'lsa — 401 Unauthorized.
      try {
        tg = parseInitData(initData);
      } catch (err) {
        return res.status(401).json({ error: err.message || 'initData imzosi yaroqsiz' });
      }
    } else if (config.devAuthBypass && devUser) {
      tg = devUser; // faqat lokal ishlab chiqish uchun
    } else {
      return res.status(400).json({ error: 'initData yuborilmadi' });
    }

    const fullname = [tg.first_name, tg.last_name].filter(Boolean).join(' ') || tg.username || 'Foydalanuvchi';
    const telegramId = String(tg.id);

    // Faqat initData imzosi tasdiqlagan telegramId config'dagi superadmin ID'siga tenglashsa
    // 'admin' roli beriladi — frontend'dan kelgan hech qanday qiymatga tayanilmaydi.
    const isSuperadmin = telegramId === String(config.superadminTelegramId);

    let { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
    let user = rows[0];
    if (!user) {
      const inserted = await db.query(
        'INSERT INTO users (telegram_id, fullname, username, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [telegramId, fullname, tg.username || null, isSuperadmin ? 'admin' : 'user']
      );
      user = inserted.rows[0];
    } else {
      const nextRole = isSuperadmin && user.role !== 'admin' ? 'admin' : user.role;
      const updated = await db.query(
        'UPDATE users SET fullname = $1, username = $2, role = $3 WHERE id = $4 RETURNING *',
        [fullname, tg.username || null, nextRole, user.id]
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

    // Superadmin — bazadagi users jadvaliga umuman bog'liq bo'lmagan, faqat
    // .env orqali boshqariladigan alohida kirish yo'li. Bazaga hech qanday
    // qator yozilmaydi, faqat shu so'rov uchun xotirada vaqtinchalik user hosil qilinadi.
    if (config.superadminUsername && username === config.superadminUsername) {
      const isValid =
        !!config.superadminPasswordHash && bcrypt.compareSync(password || '', config.superadminPasswordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Login yoki parol xato' });
      }
      const superadminUser = {
        id: SUPERADMIN_ID,
        fullname: 'Superadmin',
        username: config.superadminUsername,
        role: 'admin',
        telegram_id: null,
      };
      return res.json({ token: signToken(superadminUser), user: publicUser(superadminUser) });
    }

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
