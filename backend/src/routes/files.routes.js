import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../db.js';
import { requireAuth, requirePhoneVerified, isStaff } from '../middleware/auth.js';

export const filesRouter = Router();
filesRouter.use(requireAuth);
filesRouter.use(requirePhoneVerified);

filesRouter.get('/:id', async (req, res, next) => {
  try {
    const { rows: fileRows } = await db.query('SELECT * FROM attachments WHERE id = $1', [req.params.id]);
    const file = fileRows[0];
    if (!file) return res.status(404).json({ error: 'Fayl topilmadi' });

    const { rows: ticketRows } = await db.query('SELECT * FROM tickets WHERE id = $1', [file.ticket_id]);
    const ticket = ticketRows[0];
    if (!isStaff(req.user) && ticket.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Ruxsat yetarli emas' });
    }

    const abs = path.resolve(file.file_path);
    if (!fs.existsSync(abs)) return res.status(410).json({ error: 'Fayl diskda mavjud emas' });
    res.download(abs, file.original_name);
  } catch (err) {
    next(err);
  }
});
