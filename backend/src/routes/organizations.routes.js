import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

export const organizationsRouter = Router();
organizationsRouter.use(requireAuth);

organizationsRouter.get('/', async (req, res, next) => {
  try {
    const all = req.query.all === '1' && req.user.role === 'admin';
    const { rows } = await db.query(
      `SELECT * FROM organizations ${all ? '' : 'WHERE is_active = true'} ORDER BY name`
    );
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
});

organizationsRouter.post('/', requireAdmin, async (req, res) => {
  const name = (req.body?.name || '').trim();
  const contactPerson = (req.body?.contact_person || '').trim() || null;
  const contactPhone = (req.body?.contact_phone || '').trim() || null;
  if (!name) return res.status(400).json({ error: 'Tashkilot nomi kiritilmadi' });
  try {
    const { rows } = await db.query(
      'INSERT INTO organizations (name, contact_person, contact_phone) VALUES ($1, $2, $3) RETURNING *',
      [name, contactPerson, contactPhone]
    );
    await writeAudit({ actor: req.user, action: 'organization.created', entityType: 'organization', entityId: rows[0].id, meta: { name } });
    res.status(201).json(rows[0]);
  } catch {
    res.status(409).json({ error: 'Bunday nomli tashkilot allaqachon mavjud' });
  }
});

organizationsRouter.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM organizations WHERE id = $1', [req.params.id]);
    const org = rows[0];
    if (!org) return res.status(404).json({ error: 'Tashkilot topilmadi' });
    const name = (req.body?.name ?? org.name).trim();
    const isActive = req.body?.is_active === undefined ? org.is_active : Boolean(req.body.is_active);
    const contactPerson = req.body?.contact_person === undefined ? org.contact_person : (req.body.contact_person || '').trim() || null;
    const contactPhone = req.body?.contact_phone === undefined ? org.contact_phone : (req.body.contact_phone || '').trim() || null;
    const { rows: updated } = await db.query(
      'UPDATE organizations SET name = $1, is_active = $2, contact_person = $3, contact_phone = $4 WHERE id = $5 RETURNING *',
      [name, isActive, contactPerson, contactPhone, org.id]
    );
    await writeAudit({
      actor: req.user, action: 'organization.updated', entityType: 'organization', entityId: org.id,
      meta: { name, is_active: isActive },
    });
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});
