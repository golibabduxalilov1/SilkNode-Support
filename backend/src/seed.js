/**
 * Demo ma'lumotlar: 1 ta foydalanuvchi va bir nechta murojaat.
 * Ishga tushirish: npm run seed
 */
import { db, pool, initSchema, seedIfEmpty } from './db.js';
import { createTicket, addMessage, changeStatus } from './services/tickets.service.js';

await initSchema();
await seedIfEmpty();

const ensureUser = async (telegramId, fullname, username) => {
  const { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  if (rows[0]) return rows[0];
  const inserted = await db.query(
    'INSERT INTO users (telegram_id, fullname, username, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [telegramId, fullname, username, 'user']
  );
  return inserted.rows[0];
};

const author = await ensureUser('900001', 'Aziz Karimov', 'aziz_k');
const { rows: agentRows } = await db.query("SELECT * FROM users WHERE role = 'agent'");
const agent = agentRows[0];

const demo = [
  { title: 'ERP da sotuvlar hisoboti ochilmayapti', category: 'erp', priority: 'high', description: 'Hisobot tugmasini bosganda "500 Internal Error" chiqmoqda. Kecha ishlayotgan edi.' },
  { title: 'Ofis printeri tarmoqda korinmayapti', category: 'network', priority: 'medium', description: '3-qavatdagi printer tarmoqdan uzilgan. Kompyuterlar uni topa olmayapti.' },
  { title: 'Korporativ pochta parolini tiklash', category: 'email', priority: 'low', description: 'Yangi xodim uchun pochta paroli kerak.' },
];

for (const d of demo) {
  const { rows: existing } = await db.query('SELECT id FROM tickets WHERE title = $1', [d.title]);
  if (existing[0]) continue;
  const ticket = await createTicket({ authorId: author.id, organizationId: 1, ...d });
  if (d.category === 'erp' && agent) {
    await addMessage({ ticket, sender: agent, text: 'Muammoni takrorladik, dasturchilarga uzatdik. Bugun kun oxirigacha javob beramiz.' });
  }
  if (d.category === 'email' && agent) {
    const { rows: t1 } = await db.query('SELECT * FROM tickets WHERE id = $1', [ticket.id]);
    await addMessage({ ticket: { ...ticket, ...t1[0] }, sender: agent, text: 'Parol tiklandi, shaxsiy xabarda yubordik.' });
    const { rows: t2 } = await db.query('SELECT * FROM tickets WHERE id = $1', [ticket.id]);
    await changeStatus({ ticket: t2[0], status: 'closed', actor: agent });
  }
}

console.log('Demo malumotlar tayyor. Admin: admin / admin123, Mutaxassis: agent / agent123');
await pool.end();
