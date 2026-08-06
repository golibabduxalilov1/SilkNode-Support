import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { db } from '../src/db.js';
import { buildTestApp } from './helpers/app.js';
import { resetDb, closeDb } from './helpers/db.js';
import { createOrganization, createUser, authHeader } from './helpers/factory.js';

vi.mock('../src/lib/telegram.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, sendTelegramMessage: vi.fn().mockResolvedValue(undefined) };
});

let app;

beforeAll(() => { app = buildTestApp(); });
beforeEach(async () => { await resetDb(); });
afterAll(async () => { await closeDb(); });

async function insertTicket({ org, author, assignee, status, resolutionMinutes, createdAt, closedAt, category = 'erp', priority = 'high' }) {
  const { rows } = await db.query(
    `INSERT INTO tickets (number, organization_id, title, description, category, priority, status, author_id, assigned_to,
                           resolution_minutes, net_work_minutes, waiting_on_user_minutes, created_at, updated_at, closed_at, resolved_at, last_message_at)
     VALUES ($1,$2,'Test tiket','Tavsif',$3,$4,$5,$6,$7,$8,$8,0,$9,$9,$10,$10,$9) RETURNING *`,
    [`SD-TEST-${Math.random().toString(36).slice(2, 8)}`, org.id, category, priority, status, author.id, assignee?.id || null,
      resolutionMinutes ?? null, createdAt, closedAt || null]
  );
  return rows[0];
}

describe('Analytics moduli (TZ 7.3, 12-bo\'lim)', () => {
  it('umumiy statistika, tashkilot va mutaxassis kesimlarini to\'g\'ri agregatlaydi', async () => {
    const org = await createOrganization();
    const employee = await createUser({ role: 'employee' });
    const admin = await createUser({ role: 'admin' });
    const agentA = await createUser({ role: 'agent' });
    const agentB = await createUser({ role: 'agent' });

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600000).toISOString();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000).toISOString();

    await insertTicket({ org, author: employee, assignee: agentA, status: 'closed', resolutionMinutes: 60, createdAt: twoHoursAgo, closedAt: now.toISOString() });
    await insertTicket({ org, author: employee, assignee: agentB, status: 'closed', resolutionMinutes: 120, createdAt: twoHoursAgo, closedAt: now.toISOString() });
    await insertTicket({ org, author: employee, assignee: null, status: 'new', createdAt: fiveDaysAgo });

    // Admin: to'liq statistika
    const summaryRes = await request(app).get('/api/analytics/summary').set(authHeader(admin));
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.avgResolutionMinutes).toBe(90);
    expect(summaryRes.body.closed.today).toBe(2);
    const openNew = summaryRes.body.openByStatus.find((s) => s.status === 'new');
    expect(openNew.count).toBe(1);
    expect(summaryRes.body.longestOpen[0].organization_name).toBe(org.name);

    const orgRes = await request(app).get('/api/analytics/organizations').set(authHeader(admin));
    expect(orgRes.status).toBe(200);
    const orgRow = orgRes.body.items.find((o) => o.id === org.id);
    expect(orgRow.total).toBe(3);
    expect(orgRow.openCount).toBe(1);
    expect(orgRow.closedCount).toBe(2);

    const agentRes = await request(app).get('/api/analytics/agents').set(authHeader(admin));
    expect(agentRes.status).toBe(200);
    const agentARow = agentRes.body.items.find((a) => a.id === agentA.id);
    expect(agentARow.closedCount).toBe(1);
    expect(agentARow.avgResolutionMinutes).toBe(60);

    // Agent: faqat o'ziniki (TZ 2-bo'lim ruxsat matritsasi)
    const agentSummaryRes = await request(app).get('/api/analytics/summary').set(authHeader(agentA));
    expect(agentSummaryRes.status).toBe(200);
    expect(agentSummaryRes.body.avgResolutionMinutes).toBe(60);

    const agentOrgRes = await request(app).get('/api/analytics/organizations').set(authHeader(agentA));
    expect(agentOrgRes.status).toBe(403);
  });
});
