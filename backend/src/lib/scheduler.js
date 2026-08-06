import { db } from '../db.js';
import { config } from '../config.js';
import { changeStatus, getTicketById } from '../services/tickets.service.js';

const INTERVAL_MS = 60 * 60 * 1000; // soatiga bir marta tekshiradi

let cachedAdminId = null;
async function fallbackAdminId() {
  if (cachedAdminId) return cachedAdminId;
  const { rows } = await db.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true ORDER BY id LIMIT 1");
  cachedAdminId = rows[0]?.id || null;
  return cachedAdminId;
}

/** "Hal qilindi" holatida N kundan ortiq javobsiz qolgan tiketlarni tizim nomidan yopadi. */
export async function runAutoClose() {
  try {
    const { rows } = await db.query(
      `SELECT id FROM tickets WHERE status = 'resolved' AND resolved_at IS NOT NULL
       AND resolved_at < now() - ($1 || ' days')::interval`,
      [config.autoCloseAfterDays]
    );

    for (const row of rows) {
      const ticket = await getTicketById(row.id);
      if (!ticket || ticket.status !== 'resolved') continue;

      const actorId = ticket.assigned_to || (await fallbackAdminId());
      if (!actorId) continue;
      const { rows: actorRows } = await db.query('SELECT * FROM users WHERE id = $1', [actorId]);
      const actor = actorRows[0];
      if (!actor) continue;

      await changeStatus({
        ticket,
        status: 'closed',
        actor,
        reason: "muddat o'tgani sababli tizim tomonidan avtomatik",
      });
    }
  } catch (err) {
    console.error('[scheduler] avtomatik yopish xatosi:', err.message);
  }
}

export function startScheduler() {
  runAutoClose();
  setInterval(runAutoClose, INTERVAL_MS);
}
