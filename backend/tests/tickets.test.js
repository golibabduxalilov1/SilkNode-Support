import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { buildTestApp } from './helpers/app.js';
import { resetDb, closeDb } from './helpers/db.js';
import { createOrganization, createUser, authHeader } from './helpers/factory.js';

vi.mock('../src/lib/telegram.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, sendTelegramMessage: vi.fn().mockResolvedValue(undefined) };
});

// 1x1 shaffof PNG (magic-byte tekshiruvidan o'tishi uchun haqiqiy PNG bo'lishi shart).
const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

let app;

beforeAll(() => { app = buildTestApp(); });
beforeEach(async () => { await resetDb(); });
afterAll(async () => { await closeDb(); });

describe('Murojaat hayotiy sikli (TZ 16-bo\'lim qabul mezonlari)', () => {
  it('xodim murojaat yaratadi + fayl biriktiradi, mutaxassis javob beradi va vaqt avtomatik hisoblanadi, tasdiqlangach yopiladi', async () => {
    const org = await createOrganization();
    const employee = await createUser({ role: 'employee' });
    const agent = await createUser({ role: 'agent' });

    const createRes = await request(app)
      .post('/api/tickets')
      .set(authHeader(employee))
      .field('organization_id', String(org.id))
      .field('title', 'ERP ochilmayapti')
      .field('category', 'erp')
      .field('priority', 'high')
      .field('description', "Sotuvlar hisoboti ochilmayapti, xato chiqmoqda")
      .attach('files', PNG_BUFFER, { filename: 'screenshot.png', contentType: 'image/png' });

    expect(createRes.status).toBe(201);
    const ticket = createRes.body;
    expect(ticket.number).toMatch(/^SD-\d{4}-\d{5}$/);
    expect(ticket.status).toBe('new');

    // Mutaxassis barcha yangi murojaatlarni ko'radi
    const listRes = await request(app).get('/api/tickets?scope=all').set(authHeader(agent));
    expect(listRes.status).toBe(200);
    expect(listRes.body.items.some((t) => t.id === ticket.id)).toBe(true);

    const detailRes = await request(app).get(`/api/tickets/${ticket.id}`).set(authHeader(agent));
    expect(detailRes.body.initialAttachments).toHaveLength(1);
    expect(detailRes.body.initialAttachments[0].original_name).toBe('screenshot.png');

    // Mutaxassis javob yozadi — birinchi javob vaqti avtomatik hisoblanadi
    const replyRes = await request(app)
      .post(`/api/tickets/${ticket.id}/messages`)
      .set(authHeader(agent))
      .field('message', "Muammoni ko'rib chiqyapmiz");
    expect(replyRes.status).toBe(201);
    expect(replyRes.body.ticket.first_response_minutes).toBeGreaterThanOrEqual(0);

    // Mas'ul tayinlanadi
    const assignRes = await request(app)
      .patch(`/api/tickets/${ticket.id}/assign`)
      .set(authHeader(agent))
      .send({ assigned_to: agent.id });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.assigned_to).toBe(agent.id);

    // Mutaxassis "Hal qilindi" deb belgilaydi
    const resolveRes = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set(authHeader(agent))
      .send({ status: 'resolved' });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.resolved_at).toBeTruthy();
    expect(resolveRes.body.closed_at).toBeFalsy(); // faqat 'closed'da closed_at yoziladi

    // Xodim "Hal qilindi"dan "Yo'q, hal bo'lmadi" deb rad etsa — tiket qayta ochiladi (TZ 8-bo'lim)
    const rejectRes = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set(authHeader(employee))
      .send({ status: 'in_progress' });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe('in_progress');

    // Mutaxassis qayta "Hal qilindi"ga o'tkazadi, endi xodim tasdiqlaydi
    await request(app).patch(`/api/tickets/${ticket.id}/status`).set(authHeader(agent)).send({ status: 'resolved' });
    const confirmRes = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set(authHeader(employee))
      .send({ status: 'closed' });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('closed');
    expect(confirmRes.body.closed_at).toBeTruthy();
    expect(confirmRes.body.resolution_minutes).toBeGreaterThanOrEqual(0);
    expect(confirmRes.body.waiting_on_user_minutes).toBeGreaterThanOrEqual(0);
    expect(confirmRes.body.net_work_minutes).toBe(
      Math.max(0, confirmRes.body.resolution_minutes - confirmRes.body.waiting_on_user_minutes)
    );
  });

  it('xodim ochiq (yangi) murojaatni to\'g\'ridan-to\'g\'ri yopa olmaydi', async () => {
    const org = await createOrganization();
    const employee = await createUser({ role: 'employee' });

    const createRes = await request(app)
      .post('/api/tickets')
      .set(authHeader(employee))
      .field('organization_id', String(org.id))
      .field('title', 'Printer ishlamayapti')
      .field('category', 'network')
      .field('priority', 'low')
      .field('description', 'Printer tarmoqda korinmayapti');

    const res = await request(app)
      .patch(`/api/tickets/${createRes.body.id}/status`)
      .set(authHeader(employee))
      .send({ status: 'closed' });
    expect(res.status).toBe(403);
  });
});

describe('RBAC: xodim faqat o\'z murojaatlarini ko\'radi', () => {
  it('boshqa xodimning murojaatiga kira olmaydi', async () => {
    const org = await createOrganization();
    const employeeA = await createUser({ role: 'employee' });
    const employeeB = await createUser({ role: 'employee' });

    const createRes = await request(app)
      .post('/api/tickets')
      .set(authHeader(employeeA))
      .field('organization_id', String(org.id))
      .field('title', "Xodim A'ning murojaati")
      .field('category', 'other')
      .field('priority', 'low')
      .field('description', 'Faqat xodim A ko\'rishi kerak');

    const detailRes = await request(app).get(`/api/tickets/${createRes.body.id}`).set(authHeader(employeeB));
    expect(detailRes.status).toBe(403);

    const listRes = await request(app).get('/api/tickets').set(authHeader(employeeB));
    expect(listRes.body.items.some((t) => t.id === createRes.body.id)).toBe(false);
  });
});

describe('Fayl yuklash cheklovlari (TZ 4.2-band)', () => {
  it("ruxsat etilmagan kengaytmani rad etadi", async () => {
    const org = await createOrganization();
    const employee = await createUser({ role: 'employee' });
    const res = await request(app)
      .post('/api/tickets')
      .set(authHeader(employee))
      .field('organization_id', String(org.id))
      .field('title', 'Fayl testi')
      .field('category', 'other')
      .field('priority', 'low')
      .field('description', 'Ruxsat etilmagan fayl yuklanmoqda')
      .attach('files', Buffer.from('MZ fake exe content'), { filename: 'virus.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);
  });

  it("kengaytmasi mos, lekin tarkibi mos kelmagan faylni rad etadi (MIME qayta tekshiruvi)", async () => {
    const org = await createOrganization();
    const employee = await createUser({ role: 'employee' });
    const res = await request(app)
      .post('/api/tickets')
      .set(authHeader(employee))
      .field('organization_id', String(org.id))
      .field('title', 'Fayl testi 2')
      .field('category', 'other')
      .field('priority', 'low')
      .field('description', 'PNG deb nomlangan matn fayli')
      .attach('files', Buffer.from('bu aslida oddiy matn, PNG emas'), { filename: 'fake.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });
});
