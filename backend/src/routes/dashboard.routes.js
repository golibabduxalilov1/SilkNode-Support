import { Router } from 'express';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { dashboardSummary } from '../services/tickets.service.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', requireAuth, requireStaff, async (req, res, next) => {
  try {
    res.json(await dashboardSummary({ organizationId: req.query.organization_id }));
  } catch (err) {
    next(err);
  }
});
