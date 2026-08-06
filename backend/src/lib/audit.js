import { db } from '../db.js';

/**
 * TZ 11.3-band: "kim, qachon, qaysi tiketda status/ijrochi o'zgartirganini saqlash".
 * Superadmin bazada saqlanmagani uchun uning harakati user_id=NULL + meta.actor='superadmin' bilan yoziladi.
 */
export async function writeAudit({ actor, action, entityType, entityId, meta = {} }) {
  const userId = Number.isInteger(actor?.id) ? actor.id : null;
  const fullMeta = userId ? meta : { ...meta, actor: 'superadmin' };
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, meta, created_at) VALUES ($1, $2, $3, $4, $5, now())',
      [userId, action, entityType, String(entityId), JSON.stringify(fullMeta)]
    );
  } catch (err) {
    console.error('[audit] yozib bo\'lmadi:', err.message);
  }
}
