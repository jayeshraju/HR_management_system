import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { decideLeave, listLeaveRequests } from '../controllers/hrLeaveController.js';

export const hrLeaveRoutes = Router();
hrLeaveRoutes.use(requireAuth, requireRole('hr'));
hrLeaveRoutes.get('/', asyncHandler(listLeaveRequests));
hrLeaveRoutes.patch('/:id', asyncHandler(decideLeave));
