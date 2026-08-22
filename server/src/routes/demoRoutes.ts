import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resetDemo, seedDemo } from '../controllers/demoController.js';
export const demoRoutes = Router();
demoRoutes.use(requireAuth, requireRole('hr'));
demoRoutes.post('/seed', asyncHandler(seedDemo));
demoRoutes.post('/reset', asyncHandler((req, res) => resetDemo(req, res)));
