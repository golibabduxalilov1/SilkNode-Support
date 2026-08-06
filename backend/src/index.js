import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { initSchema, seedIfEmpty } from './db.js';
import { startScheduler } from './lib/scheduler.js';
import { authRouter } from './routes/auth.routes.js';
import { ticketsRouter } from './routes/tickets.routes.js';
import { organizationsRouter } from './routes/organizations.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { filesRouter } from './routes/files.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';

await initSchema();
await seedIfEmpty();

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: config.corsOrigin.includes('*') ? true : config.corsOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// TZ 15.3-band: minimal monitoring — har bir so'rov metod/yo'l/status/vaqt bilan loglanadi.
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(`[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});

// TZ 11.3-band: rate limiting — umumiy API va login endpointlari uchun alohida cheklov.
app.use('/api', rateLimit({ windowMs: 5 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(
  ['/api/auth/login', '/api/auth/telegram'],
  rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: "Juda ko'p urinish, birozdan so'ng qayta urinib ko'ring" } })
);

app.get('/api/health', (_req, res) => res.json({ ok: true, env: config.env, time: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/users', usersRouter);
app.use('/api/files', filesRouter);

app.use((_req, res) => res.status(404).json({ error: 'Endpoint topilmadi' }));

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  res.status(status).json({ error: err.message || 'Server xatosi' });
});

app.listen(config.port, () => {
  console.log(`Silknode Support API: http://localhost:${config.port}/api`);
});

startScheduler();
