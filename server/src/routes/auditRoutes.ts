import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listAuditLogs } from '../controllers/auditController.js';
export const auditRoutes = Router();
auditRoutes.get('/', requireAuth, requireRole('hr'), asyncHandler(listAuditLogs));
