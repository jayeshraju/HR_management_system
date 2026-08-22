import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { analytics } from '../controllers/analyticsController.js';
export const analyticsRoutes = Router();
analyticsRoutes.get('/', requireAuth, requireRole('hr'), asyncHandler(analytics));
