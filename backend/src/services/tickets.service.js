import { db, pool } from '../db.js';
import { OPEN_STATUSES } from '../config.js';
import { isStaff } from '../middleware/auth.js';
import { sendTelegramMessage } from '../lib/telegram.js';

export const nowIso = () => new Date().toISOString();
const minutesBetween = (from, to) => Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 60000));

const ticketNumber = (id, createdAt) =>
  `SD-${new Date(createdAt).getFullYear()}-${String(id).padStart(5, '0')}`;

const TICKET_SELECT = `
  SELECT t.*,
         o.name  AS organization_name,
         a.fullname AS author_name,
         a.telegram_id AS author_telegram_id,
         g.fullname AS assignee_name
  FROM tickets t
  JOIN organizations o ON o.id = t.organization_id
  JOIN users a         ON a.id = t.author_id
  LEFT JOIN users g    ON g.id = t.assigned_to
`;

export async function createTicket({ authorId, organizationId, title, description, category, priority, files = [] }) {
  const created = nowIso();
  const client = await pool.connect();
  let id;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO tickets (organization_id, title, description, category, priority, status, author_id, created_at, updated_at, last_message_at)
       VALUES ($1, $2, $3, $4, $5, 'new', $6, $7, $7, $7) RETURNING id`,
      [organizationId, title, description, category, priority, authorId, created]
    );
    id = rows[0].id;
    await client.query('UPDATE tickets SET number = $1 WHERE id = $2', [ticketNumber(id, created), id]);

    for (const f of files) {
      await client.query(
        `INSERT INTO attachments (ticket_id, message_id, file_path, original_name, mime_type, size_bytes, created_at)
         VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
        [id, f.path, f.originalname, f.mimetype, f.size, created]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getTicketById(id);
}

export async function getTicketById(id) {
  const { rows } = await db.query(`${TICKET_SELECT} WHERE t.id = $1`, [id]);
  return rows[0];
}

export async function getTicketThread(id) {
  const { rows: messages } = await db.query(
    `SELECT m.*, u.fullname AS sender_name, u.role AS sender_role
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.ticket_id = $1 ORDER BY m.id ASC`,
    [id]
  );
  const { rows: attachments } = await db.query(
    'SELECT * FROM attachments WHERE ticket_id = $1 ORDER BY id ASC',
    [id]
  );
  return {
    messages: messages.map((m) => ({ ...m, attachments: attachments.filter((a) => a.message_id === m.id) })),
    initialAttachments: attachments.filter((a) => a.message_id === null),
  };
}

export async function listTickets({ user, scope = 'mine', status, organizationId, category, priority, assignedTo, q, page = 1, limit = 20 }) {
  const where = [];
  const args = [];
  const p = () => `$${args.length}`;

  if (!isStaff(user) || scope === 'mine') {
    args.push(user.id);
    where.push(`t.author_id = ${p()}`);
  }
  if (status === 'open') where.push(`t.status IN ('${OPEN_STATUSES.join("','")}')`);
  else if (status) { args.push(status); where.push(`t.status = ${p()}`); }
  if (organizationId) { args.push(Number(organizationId)); where.push(`t.organization_id = ${p()}`); }
  if (category) { args.push(category); where.push(`t.category = ${p()}`); }
  if (priority) { args.push(priority); where.push(`t.priority = ${p()}`); }
  if (assignedTo === 'none') where.push('t.assigned_to IS NULL');
  else if (assignedTo) { args.push(Number(assignedTo)); where.push(`t.assigned_to = ${p()}`); }
  if (q) {
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    where.push(`(t.title ILIKE $${args.length - 2} OR t.number ILIKE $${args.length - 1} OR t.description ILIKE $${args.length})`);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows: countRows } = await db.query(`SELECT COUNT(*)::int c FROM tickets t ${clause}`, args);
  const total = countRows[0].c;
  const offset = (Number(page) - 1) * Number(limit);
  const limitArgs = [...args, Number(limit), offset];
  const { rows: items } = await db.query(
    `${TICKET_SELECT} ${clause} ORDER BY t.last_message_at DESC, t.id DESC LIMIT $${limitArgs.length - 1} OFFSET $${limitArgs.length}`,
    limitArgs
  );

  return { items, total, page: Number(page), limit: Number(limit) };
}

/** Xabar qo'shish: time tracking va status o'tishi shu yerda boshqariladi. */
export async function addMessage({ ticket, sender, text, files = [], system = false }) {
  const ts = nowIso();
  const staffReply = isStaff(sender) && !system;

  const client = await pool.connect();
  let messageId;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO messages (ticket_id, sender_id, message, is_system, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [ticket.id, sender.id, text || '', system, ts]
    );
    messageId = rows[0].id;

    for (const f of files) {
      await client.query(
        `INSERT INTO attachments (ticket_id, message_id, file_path, original_name, mime_type, size_bytes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [ticket.id, messageId, f.path, f.originalname, f.mimetype, f.size, ts]
      );
    }

    const patch = { last_message_at: ts, updated_at: ts };

    if (staffReply && !ticket.first_response_at) {
      patch.first_response_at = ts;
      patch.first_response_minutes = minutesBetween(ticket.created_at, ts);
    }
    if (staffReply && ['new', 'in_progress'].includes(ticket.status)) patch.status = 'waiting_user';
    if (!staffReply && !system && ['waiting_user', 'resolved'].includes(ticket.status)) patch.status = 'in_progress';
    if (staffReply && !ticket.assigned_to) patch.assigned_to = sender.id;

    const keys = Object.keys(patch);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    await client.query(`UPDATE tickets SET ${setClause} WHERE id = $${keys.length + 1}`, [
      ...keys.map((k) => patch[k]),
      ticket.id,
    ]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  if (staffReply && ticket.author_telegram_id) {
    await sendTelegramMessage(
      ticket.author_telegram_id,
      `<b>${ticket.number}</b> — ${ticket.title}\nTexnik mutaxassis javob berdi:\n\n${(text || 'Fayl yuborildi').slice(0, 500)}`,
      ticket.id
    );
  }

  const { rows } = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
  return rows[0];
}

export async function changeStatus({ ticket, status, actor }) {
  const ts = nowIso();
  const patch = { status, updated_at: ts };

  if (['resolved', 'closed'].includes(status)) {
    if (!ticket.closed_at) {
      patch.closed_at = ts;
      patch.resolution_minutes = minutesBetween(ticket.created_at, ts);
    }
  } else {
    patch.closed_at = null;
    patch.resolution_minutes = null;
  }

  const keys = Object.keys(patch);
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  await db.query(`UPDATE tickets SET ${setClause} WHERE id = $${keys.length + 1}`, [
    ...keys.map((k) => patch[k]),
    ticket.id,
  ]);

  const labels = { new: 'Yangi', in_progress: 'Ish jarayonida', waiting_user: 'Foydalanuvchi javobi kutilmoqda', resolved: 'Hal qilindi', closed: 'Yopildi' };
  await db.query(
    'INSERT INTO messages (ticket_id, sender_id, message, is_system, created_at) VALUES ($1, $2, $3, true, $4)',
    [ticket.id, actor.id, `Status o'zgardi: ${labels[status]}`, ts]
  );

  if (isStaff(actor) && ticket.author_telegram_id) {
    await sendTelegramMessage(
      ticket.author_telegram_id,
      `<b>${ticket.number}</b> — ${ticket.title}\nStatus: <b>${labels[status]}</b>`,
      ticket.id
    );
  }
  return getTicketById(ticket.id);
}

export async function assignTicket({ ticket, assigneeId, actor }) {
  const ts = nowIso();
  let assignee = null;
  if (assigneeId) {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [assigneeId]);
    assignee = rows[0];
    if (!assignee || !isStaff(assignee)) throw Object.assign(new Error('Ijrochi topilmadi'), { status: 400 });
  }

  const status = ticket.status === 'new' && assigneeId ? 'in_progress' : ticket.status;
  await db.query('UPDATE tickets SET assigned_to = $1, status = $2, updated_at = $3 WHERE id = $4', [
    assigneeId || null,
    status,
    ts,
    ticket.id,
  ]);

  await db.query(
    'INSERT INTO messages (ticket_id, sender_id, message, is_system, created_at) VALUES ($1, $2, $3, true, $4)',
    [ticket.id, actor.id, assignee ? `Mas'ul tayinlandi: ${assignee.fullname}` : "Mas'ul olib tashlandi", ts]
  );

  return getTicketById(ticket.id);
}

export async function dashboardSummary({ organizationId } = {}) {
  const orgWhere = organizationId ? 'AND organization_id = $1' : '';
  const args = organizationId ? [Number(organizationId)] : [];
  const one = async (sql, extraArgs = []) => (await db.query(sql, [...args, ...extraArgs])).rows[0];

  const counts = {
    new: (await one(`SELECT COUNT(*)::int c FROM tickets WHERE status = 'new' ${orgWhere}`)).c,
    in_progress: (await one(`SELECT COUNT(*)::int c FROM tickets WHERE status = 'in_progress' ${orgWhere}`)).c,
    waiting_user: (await one(`SELECT COUNT(*)::int c FROM tickets WHERE status = 'waiting_user' ${orgWhere}`)).c,
    closed_today: (await one(
      `SELECT COUNT(*)::int c FROM tickets WHERE closed_at IS NOT NULL AND closed_at::date = CURRENT_DATE ${orgWhere}`
    )).c,
    open_total: (await one(`SELECT COUNT(*)::int c FROM tickets WHERE status IN ('new','in_progress','waiting_user') ${orgWhere}`)).c,
  };

  const avg = await one(
    `SELECT ROUND(AVG(first_response_minutes)) frt, ROUND(AVG(resolution_minutes)) rt FROM tickets WHERE 1=1 ${orgWhere}`
  );

  const closed = {
    today: counts.closed_today,
    week: (await one(`SELECT COUNT(*)::int c FROM tickets WHERE closed_at >= now() - interval '7 days' ${orgWhere}`)).c,
    month: (await one(`SELECT COUNT(*)::int c FROM tickets WHERE closed_at >= now() - interval '30 days' ${orgWhere}`)).c,
  };

  const { rows: byCategory } = await db.query(
    `SELECT category, COUNT(*)::int c FROM tickets WHERE 1=1 ${orgWhere} GROUP BY category ORDER BY c DESC`,
    args
  );

  const { rows: byOrganization } = await db.query(
    `SELECT o.name, COUNT(t.id)::int c,
            SUM(CASE WHEN t.status IN ('new','in_progress','waiting_user') THEN 1 ELSE 0 END)::int open_count
     FROM organizations o LEFT JOIN tickets t ON t.organization_id = o.id
     GROUP BY o.id ORDER BY c DESC`
  );

  return {
    counts,
    avgFirstResponseMinutes: Number(avg.frt) || 0,
    avgResolutionMinutes: Number(avg.rt) || 0,
    closed,
    byCategory,
    byOrganization,
  };
}
