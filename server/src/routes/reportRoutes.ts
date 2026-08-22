import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { exportReport, search } from '../controllers/reportController.js';
export const reportRoutes = Router();
reportRoutes.use(requireAuth, requireRole('hr'));
reportRoutes.get('/export', asyncHandler(exportReport));
reportRoutes.get('/search', asyncHandler(search));
