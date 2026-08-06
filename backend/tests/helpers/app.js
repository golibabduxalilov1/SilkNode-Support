import express from 'express';
import { authRouter } from '../../src/routes/auth.routes.js';
import { ticketsRouter } from '../../src/routes/tickets.routes.js';
import { organizationsRouter } from '../../src/routes/organizations.routes.js';
import { dashboardRouter } from '../../src/routes/dashboard.routes.js';
import { usersRouter } from '../../src/routes/users.routes.js';
import { filesRouter } from '../../src/routes/files.routes.js';
import { analyticsRouter } from '../../src/routes/analytics.routes.js';

/** index.js'ga o'xshash, lekin app.listen/rate-limit/scheduler'siz — faqat testlar uchun. */
export function buildTestApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/files', filesRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Endpoint topilmadi' }));
  app.use((err, _req, res, _next) => {
    const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
    res.status(status).json({ error: err.message || 'Server xatosi' });
  });
  return app;
}
