import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { buildTestApp } from './helpers/app.js';
import { resetDb, closeDb } from './helpers/db.js';

vi.mock('../src/lib/telegram.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, sendTelegramMessage: vi.fn().mockResolvedValue(undefined) };
});

function buildInitData(userObj, botToken, authDateSec = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams();
  params.set('user', JSON.stringify(userObj));
  params.set('auth_date', String(authDateSec));
  const dataCheckString = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

const BOT_TOKEN = process.env.BOT_TOKEN;
let app;

beforeAll(() => { app = buildTestApp(); });
beforeEach(async () => { await resetDb(); });
afterAll(async () => { await closeDb(); });

describe('POST /api/auth/telegram (TZ 11.1-band)', () => {
  it("to'g'ri imzo bilan foydalanuvchini yaratadi va JWT qaytaradi", async () => {
    const initData = buildInitData({ id: 111222, first_name: 'Aziz', username: 'aziz' }, BOT_TOKEN);
    const res = await request(app).post('/api/auth/telegram').send({ initData });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('user');
  });

  it("noto'g'ri imzoda 401 qaytaradi", async () => {
    const initData = buildInitData({ id: 999, first_name: 'X' }, 'boshqa-token');
    const res = await request(app).post('/api/auth/telegram').send({ initData });
    expect(res.status).toBe(401);
  });

  it('eskirgan (24 soatdan ortiq) auth_date uchun 401 qaytaradi', async () => {
    const oldDate = Math.floor(Date.now() / 1000) - 90000;
    const initData = buildInitData({ id: 333 }, BOT_TOKEN, oldDate);
    const res = await request(app).post('/api/auth/telegram').send({ initData });
    expect(res.status).toBe(401);
  });

  it('initData yuborilmasa 400 qaytaradi (DEV_AUTH_BYPASS o\'chiq)', async () => {
    const res = await request(app).post('/api/auth/telegram').send({});
    expect(res.status).toBe(400);
  });
});
