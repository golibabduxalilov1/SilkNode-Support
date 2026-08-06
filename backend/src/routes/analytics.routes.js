import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { analyticsSummary, analyticsByOrganizations, analyticsByAgents, analyticsExport } from '../services/analytics.service.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

/** So'rov query'sidan filtrlarni o'qiydi. 'agent' roli faqat o'z ko'rsatkichlarini ko'radi (TZ 2-bo'lim). */
function readFilters(req) {
  const filters = {
    from: req.query.from || undefined,
    to: req.query.to || undefined,
    organizationId: req.query.organization_id || undefined,
    category: req.query.category || undefined,
    agentId: req.query.agent_id || undefined,
  };
  if (req.user.role === 'agent') filters.agentId = req.user.id;
  return filters;
}

analyticsRouter.get('/summary', async (req, res, next) => {
  try {
    res.json(await analyticsSummary(readFilters(req)));
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get('/organizations', requireAdmin, async (req, res, next) => {
  try {
    res.json({ items: await analyticsByOrganizations(readFilters(req)) });
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get('/agents', requireAdmin, async (req, res, next) => {
  try {
    res.json({ items: await analyticsByAgents(readFilters(req)) });
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get('/export', requireAdmin, async (req, res, next) => {
  try {
    const buffer = await analyticsExport(readFilters(req));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.xlsx"');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});
