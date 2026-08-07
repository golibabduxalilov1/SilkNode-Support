import { db, pool } from '../db.js';
import { config, OPEN_STATUSES, STATUS_LABELS, PRIORITY_LABELS } from '../config.js';
import { isStaff } from '../middleware/auth.js';
import { sendTelegramMessage } from '../lib/telegram.js';
import { writeAudit } from '../lib/audit.js';

export const nowIso = () => new Date().toISOString();
const minutesBetween = (from, to) => Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 60000));

/** status_history.changed_by NULL bo'lishi mumkin (masalan superadmin bazada saqlanmaydi). */
const historyActorId = (actor) => (Number.isInteger(actor?.id) ? actor.id : null);

export function formatMinutesUz(min) {
  if (min === null || min === undefined) return "noma'lum";
  if (min < 60) return `${min} daqiqa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat ${min % 60} daqiqa`;
  return `${Math.floor(h / 24)} kun ${h % 24} soat`;
}

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

/**
 * "Foydalanuvchi javobi kutilmoqda" holatida jami o'tgan vaqtni status_history asosida hisoblaydi.
 * @param {string} referenceEndIso - hisoblash uchun oxirgi chegara (masalan, yopilgan vaqt)
 */
async function recomputeWaitMinutes(ticketId, referenceEndIso) {
  const { rows: history } = await db.query(
    'SELECT new_status, created_at FROM status_history WHERE ticket_id = $1 ORDER BY created_at ASC, id ASC',
    [ticketId]
  );
  let waitMinutes = 0;
  for (let i = 0; i < history.length; i++) {
    if (history[i].new_status !== 'waiting_user') continue;
    const start = history[i].created_at;
    const end = history[i + 1] ? history[i + 1].created_at : referenceEndIso;
    waitMinutes += minutesBetween(start, end);
  }
  return waitMinutes;
}

/**
 * Status o'zgarishiga bog'liq vaqt maydonlarini (resolved_at/closed_at/resolution_minutes va h.k.)
 * hisoblaydi. changeStatus() va addMessage()dagi implicit o'tishlar uchun umumiy mantiq.
 */
function statusTimingPatch(ticket, newStatus, ts) {
  const patch = {};
  if (newStatus === ticket.status) return patch;
  if (newStatus === 'resolved') {
    if (!ticket.resolved_at) patch.resolved_at = ts;
  } else if (newStatus === 'closed') {
    if (!ticket.closed_at) {
      patch.closed_at = ts;
      patch.resolution_minutes = minutesBetween(ticket.created_at, ts);
    }
    if (!ticket.resolved_at) patch.resolved_at = ts;
  } else {
    patch.resolved_at = null;
    patch.closed_at = null;
    patch.resolution_minutes = null;
    patch.waiting_on_user_minutes = null;
    patch.net_work_minutes = null;
  }
  return patch;
}

/** Tiket 'closed'ga o'tganda sof ishlash vaqtini hisoblab, alohida yozadi (tranzaksiyadan tashqarida). */
async function finalizeClosedTiming(ticketId, resolutionMinutes, closedAtIso) {
  const waitMinutes = await recomputeWaitMinutes(ticketId, closedAtIso);
  const netWork = Math.max(0, resolutionMinutes - waitMinutes);
  await db.query('UPDATE tickets SET waiting_on_user_minutes = $1, net_work_minutes = $2 WHERE id = $3', [
    waitMinutes,
    netWork,
    ticketId,
  ]);
  return { waitMinutes, netWork };
}

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
    await client.query(
      'INSERT INTO status_history (ticket_id, old_status, new_status, changed_by, created_at) VALUES ($1, NULL, $2, $3, $4)',
      [id, 'new', authorId, created]
    );

    for (const f of files) {
      await client.query(
        `INSERT INTO attachments (ticket_id, message_id, file_path, original_name, mime_type, size_bytes, uploaded_by, created_at)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)`,
        [id, f.path, f.originalname, f.mimetype, f.size, authorId, created]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const ticket = await getTicketById(id);
  await notifyNewTicketToStaff(ticket);
  return ticket;
}

async function notifyNewTicketToStaff(ticket) {
  const { rows: staff } = await db.query(
    "SELECT telegram_id FROM users WHERE role IN ('agent','admin') AND is_active = true AND telegram_id IS NOT NULL"
  );
  const telegramIds = new Set(staff.map((s) => s.telegram_id));
  if (config.superadminTelegramId) telegramIds.add(config.superadminTelegramId);
  if (!telegramIds.size) return;
  const text =
    `🆕 <b>Yangi murojaat</b>\n${ticket.number} — ${ticket.title}\n` +
    `Tashkilot: ${ticket.organization_name}\nMuhimlik: ${PRIORITY_LABELS[ticket.priority] || ticket.priority}`;
  await Promise.all(
    [...telegramIds].map((telegramId) => sendTelegramMessage(telegramId, text, ticket.id, { admin: true }))
  );
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

const SORTABLE_COLUMNS = new Set([
  'number', 'title', 'category', 'priority', 'status', 'created_at', 'last_message_at', 'organization_name', 'assignee_name',
]);

/** Vergul bilan ajratilgan qiymatni SQL IN(...) shartiga aylantiradi. */
function inClause(args, column, rawValue, cast = (v) => v) {
  const values = String(rawValue).split(',').map((v) => v.trim()).filter(Boolean).map(cast);
  if (!values.length) return null;
  const placeholders = values.map((v) => { args.push(v); return `$${args.length}`; });
  return `${column} IN (${placeholders.join(',')})`;
}

export async function listTickets({
  user, scope = 'mine', status, organizationId, category, priority, assignedTo, q,
  page = 1, limit = 20, sortBy = 'last_message_at', sortDir = 'desc',
}) {
  const where = [];
  const args = [];
  const p = () => `$${args.length}`;

  if (!isStaff(user) || scope === 'mine') {
    args.push(user.id);
    where.push(`t.author_id = ${p()}`);
  }
  if (status === 'open') where.push(`t.status IN ('${OPEN_STATUSES.join("','")}')`);
  else if (status) {
    const clause = inClause(args, 't.status', status);
    if (clause) where.push(clause);
  }
  if (organizationId) {
    const clause = inClause(args, 't.organization_id', organizationId, Number);
    if (clause) where.push(clause);
  }
  if (category) {
    const clause = inClause(args, 't.category', category);
    if (clause) where.push(clause);
  }
  if (priority) {
    const clause = inClause(args, 't.priority', priority);
    if (clause) where.push(clause);
  }
  if (assignedTo === 'none') where.push('t.assigned_to IS NULL');
  else if (assignedTo) {
    const clause = inClause(args, 't.assigned_to', assignedTo, Number);
    if (clause) where.push(clause);
  }
  if (q) {
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    where.push(`(t.title ILIKE $${args.length - 2} OR t.number ILIKE $${args.length - 1} OR t.description ILIKE $${args.length})`);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows: countRows } = await db.query(`SELECT COUNT(*)::int c FROM tickets t ${clause}`, args);
  const total = countRows[0].c;
  const offset = (Number(page) - 1) * Number(limit);
  const limitArgs = [...args, Number(limit), offset];
  const sortColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'last_message_at';
  const sortExpr = ['organization_name', 'assignee_name'].includes(sortColumn) ? sortColumn : `t.${sortColumn}`;
  const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';
  const { rows: items } = await db.query(
    `${TICKET_SELECT} ${clause} ORDER BY ${sortExpr} ${sortDirection}, t.id DESC LIMIT $${limitArgs.length - 1} OFFSET $${limitArgs.length}`,
    limitArgs
  );

  return { items, total, page: Number(page), limit: Number(limit) };
}

/** Filtrlarga mos barcha tiketlarni (sahifalashsiz, eksport uchun) qaytaradi. */
export async function listTicketsForExport({ user, status, organizationId, category, priority, assignedTo, q }, cap = 5000) {
  const { items } = await listTickets({
    user, scope: isStaff(user) ? 'all' : 'mine', status, organizationId, category, priority, assignedTo, q,
    page: 1, limit: cap,
  });
  return items;
}

/** Xabar qo'shish: time tracking va status o'tishi shu yerda boshqariladi. */
export async function addMessage({ ticket, sender, text, files = [], system = false }) {
  const ts = nowIso();
  const staffReply = isStaff(sender) && !system;

  const client = await pool.connect();
  let messageId;
  let newStatus = null;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO messages (ticket_id, sender_id, message, is_system, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [ticket.id, sender.id, text || '', system, ts]
    );
    messageId = rows[0].id;

    for (const f of files) {
      await client.query(
        `INSERT INTO attachments (ticket_id, message_id, file_path, original_name, mime_type, size_bytes, uploaded_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [ticket.id, messageId, f.path, f.originalname, f.mimetype, f.size, sender.id, ts]
      );
    }

    const patch = { last_message_at: ts, updated_at: ts };

    if (staffReply && !ticket.first_response_at) {
      patch.first_response_at = ts;
      patch.first_response_minutes = minutesBetween(ticket.created_at, ts);
    }
    if (staffReply && ['new', 'in_progress'].includes(ticket.status)) newStatus = 'waiting_user';
    if (!staffReply && !system && ['waiting_user', 'resolved'].includes(ticket.status)) newStatus = 'in_progress';
    if (staffReply && !ticket.assigned_to) patch.assigned_to = sender.id;

    if (newStatus) {
      Object.assign(patch, statusTimingPatch(ticket, newStatus, ts));
      patch.status = newStatus;
      await client.query(
        'INSERT INTO status_history (ticket_id, old_status, new_status, changed_by, created_at) VALUES ($1, $2, $3, $4, $5)',
        [ticket.id, ticket.status, newStatus, historyActorId(sender), ts]
      );
    }

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

  if (newStatus === 'closed') {
    const t = await getTicketById(ticket.id);
    await finalizeClosedTiming(ticket.id, t.resolution_minutes, ts);
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

/**
 * @param {object} params
 * @param {string} [params.reason] - system-xabarga qo'shiladigan izoh (masalan, avtomatik yopilganda)
 */
export async function changeStatus({ ticket, status, actor, reason }) {
  const ts = nowIso();
  const timingPatch = statusTimingPatch(ticket, status, ts);
  const patch = { status, updated_at: ts, ...timingPatch };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO status_history (ticket_id, old_status, new_status, changed_by, created_at) VALUES ($1, $2, $3, $4, $5)',
      [ticket.id, ticket.status, status, historyActorId(actor), ts]
    );
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

  let closedTiming = null;
  if (status === 'closed' && timingPatch.resolution_minutes !== undefined) {
    closedTiming = await finalizeClosedTiming(ticket.id, timingPatch.resolution_minutes, ts);
  }

  const label = STATUS_LABELS[status];
  const messageText = reason ? `Status o'zgardi: ${label} — ${reason}` : `Status o'zgardi: ${label}`;
  await db.query(
    'INSERT INTO messages (ticket_id, sender_id, message, is_system, created_at) VALUES ($1, $2, $3, true, $4)',
    [ticket.id, actor.id, messageText, ts]
  );
  await writeAudit({
    actor, action: 'ticket.status_changed', entityType: 'ticket', entityId: ticket.id,
    meta: { from: ticket.status, to: status, reason: reason || null },
  });

  if (isStaff(actor) && ticket.author_telegram_id) {
    if (status === 'resolved') {
      await sendTelegramMessage(
        ticket.author_telegram_id,
        `✅ <b>${ticket.number}</b> — ${ticket.title}\nMutaxassis muammoni hal qilingan deb belgiladi.\n\nMuammo hal bo'ldimi?`,
        ticket.id,
        {
          buttons: [[
            { text: "Ha, hal bo'ldi", callback_data: `confirm:${ticket.id}:yes` },
            { text: "Yo'q, hal bo'lmadi", callback_data: `confirm:${ticket.id}:no` },
          ]],
        }
      );
    } else if (status === 'closed') {
      const total = closedTiming ? closedTiming.netWork : timingPatch.resolution_minutes;
      await sendTelegramMessage(
        ticket.author_telegram_id,
        `🔒 <b>${ticket.number}</b> — ${ticket.title}\nMurojaat yopildi.\nUmumiy sarflangan vaqt: ${formatMinutesUz(total)}`,
        ticket.id
      );
    } else if (status === 'waiting_user') {
      await sendTelegramMessage(
        ticket.author_telegram_id,
        `❓ <b>${ticket.number}</b> — ${ticket.title}\nMutaxassis sizdan qo'shimcha ma'lumot kutmoqda. Iltimos, javob yozing.`,
        ticket.id
      );
    } else {
      await sendTelegramMessage(
        ticket.author_telegram_id,
        `<b>${ticket.number}</b> — ${ticket.title}\nStatus: <b>${label}</b>`,
        ticket.id
      );
    }
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
  const timingPatch = status !== ticket.status ? statusTimingPatch(ticket, status, ts) : {};
  const patch = { assigned_to: assigneeId || null, status, updated_at: ts, ...timingPatch };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (status !== ticket.status) {
      await client.query(
        'INSERT INTO status_history (ticket_id, old_status, new_status, changed_by, created_at) VALUES ($1, $2, $3, $4, $5)',
        [ticket.id, ticket.status, status, historyActorId(actor), ts]
      );
    }
    const keys = Object.keys(patch);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    await client.query(`UPDATE tickets SET ${setClause} WHERE id = $${keys.length + 1}`, [
      ...keys.map((k) => patch[k]),
      ticket.id,
    ]);
    await client.query(
      'INSERT INTO messages (ticket_id, sender_id, message, is_system, created_at) VALUES ($1, $2, $3, true, $4)',
      [ticket.id, actor.id, assignee ? `Mas'ul tayinlandi: ${assignee.fullname}` : "Mas'ul olib tashlandi", ts]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await writeAudit({
    actor, action: 'ticket.assigned', entityType: 'ticket', entityId: ticket.id,
    meta: { assignedTo: assigneeId || null },
  });

  const result = await getTicketById(ticket.id);
  if (assignee && assignee.telegram_id) {
    await sendTelegramMessage(
      assignee.telegram_id,
      `📌 <b>Sizga tiket tayinlandi</b>\n${result.number} — ${result.title}\nMuhimlik: ${PRIORITY_LABELS[result.priority] || result.priority}`,
      result.id,
      { admin: true }
    );
  }
  return result;
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
