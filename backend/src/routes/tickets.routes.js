import { Router } from 'express';
import { db } from '../db.js';
import { CATEGORIES, PRIORITIES, STATUSES, config } from '../config.js';
import { requireAuth, requireStaff, isStaff } from '../middleware/auth.js';
import { upload, verifyUploadedFiles } from '../middleware/upload.js';
import { exportTicketsXlsx } from '../services/analytics.service.js';
import {
  createTicket, listTickets, listTicketsForExport, getTicketById, getTicketThread,
  addMessage, changeStatus, assignTicket,
} from '../services/tickets.service.js';

export const ticketsRouter = Router();
ticketsRouter.use(requireAuth);

/** Murojaatga kirish huquqi: muallif yoki texnik xodim */
async function loadTicket(req, res, next) {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Murojaat topilmadi' });
    if (!isStaff(req.user) && ticket.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Ruxsat yetarli emas' });
    }
    req.ticket = ticket;
    next();
  } catch (err) {
    next(err);
  }
}

ticketsRouter.get('/', async (req, res, next) => {
  try {
    const scope = isStaff(req.user) ? req.query.scope || 'all' : 'mine';
    res.json(
      await listTickets({
        user: req.user,
        scope,
        status: req.query.status,
        organizationId: req.query.organization_id,
        category: req.query.category,
        priority: req.query.priority,
        assignedTo: req.query.assigned_to,
        q: req.query.q,
        page: req.query.page || 1,
        limit: Math.min(Number(req.query.limit || 20), 100),
      })
    );
  } catch (err) {
    next(err);
  }
});

ticketsRouter.post('/', upload.array('files', config.maxFilesPerTicket), verifyUploadedFiles, async (req, res, next) => {
  try {
    if (!req.user.phone) {
      return res.status(403).json({
        error: "Murojaat yuborishdan oldin telefon raqamingizni tasdiqlang — buning uchun botga /start yuboring va raqamingizni ulashing",
      });
    }
    const { organization_id, title, category, priority = 'medium', description } = req.body || {};
    const errors = [];
    if (!organization_id) errors.push('Tashkilot tanlanmadi');
    if (!title || title.trim().length < 3) errors.push("Mavzu kamida 3 ta belgidan iborat bo'lishi kerak");
    if (!description || description.trim().length < 5) errors.push('Muammo tavsifi juda qisqa');
    if (!CATEGORIES.includes(category)) errors.push('Kategoriya notogri');
    if (!PRIORITIES.includes(priority)) errors.push('Muhimlik darajasi notogri');
    const { rows } = await db.query('SELECT * FROM organizations WHERE id = $1 AND is_active = true', [organization_id]);
    if (!rows[0]) errors.push('Tashkilot topilmadi');
    if (errors.length) return res.status(400).json({ error: errors.join('. ') });

    const ticket = await createTicket({
      authorId: req.user.id,
      organizationId: Number(organization_id),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      files: req.files || [],
    });
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

ticketsRouter.get('/:id', loadTicket, async (req, res, next) => {
  try {
    res.json({ ticket: req.ticket, ...(await getTicketThread(req.ticket.id)) });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.post('/:id/messages', loadTicket, upload.array('files', config.maxFilesPerTicket), verifyUploadedFiles, async (req, res, next) => {
  try {
    const text = (req.body?.message || '').trim();
    if (!text && !(req.files || []).length) return res.status(400).json({ error: 'Xabar yoki fayl yuboring' });
    if (req.ticket.status === 'closed' && !isStaff(req.user)) {
      return res.status(409).json({ error: 'Yopilgan murojaatga xabar yozib bolmaydi' });
    }
    const message = await addMessage({ ticket: req.ticket, sender: req.user, text, files: req.files || [] });
    res.status(201).json({ message, ticket: await getTicketById(req.ticket.id) });
  } catch (err) {
    next(err);
  }
});

ticketsRouter.patch('/:id/status', loadTicket, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Status notogri' });
    // Foydalanuvchi faqat "Hal qilindi" holatidan tasdiqlash (Yopildi) yoki rad etish (Ish jarayonida) orqali o'ta oladi
    if (!isStaff(req.user)) {
      const allowed = req.ticket.status === 'resolved' && (status === 'closed' || status === 'in_progress');
      if (!allowed) return res.status(403).json({ error: 'Ruxsat yetarli emas' });
    }
    res.json(await changeStatus({ ticket: req.ticket, status, actor: req.user }));
  } catch (err) {
    next(err);
  }
});

ticketsRouter.patch('/:id/assign', loadTicket, requireStaff, async (req, res, next) => {
  try {
    const assigneeId = req.body?.assigned_to ? Number(req.body.assigned_to) : null;
    res.json(await assignTicket({ ticket: req.ticket, assigneeId, actor: req.user }));
  } catch (err) {
    next(err);
  }
});

ticketsRouter.get('/meta/dictionaries', (_req, res) => {
  res.json({ categories: CATEGORIES, priorities: PRIORITIES, statuses: STATUSES });
});

/** TZ 7.2: tiketlar jadvalini joriy filtrlar bilan Excel formatda eksport qilish. */
ticketsRouter.get('/export/xlsx', requireStaff, async (req, res, next) => {
  try {
    const items = await listTicketsForExport({
      user: req.user,
      status: req.query.status,
      organizationId: req.query.organization_id,
      category: req.query.category,
      priority: req.query.priority,
      assignedTo: req.query.assigned_to,
      q: req.query.q,
    });
    const buffer = await exportTicketsXlsx(items);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets-export.xlsx"');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});
