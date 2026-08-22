import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAllAttendance, getEmployees } from '../controllers/hrAttendanceController.js';

export const hrAttendanceRoutes = Router();
hrAttendanceRoutes.use(requireAuth, requireRole('hr'));
hrAttendanceRoutes.get('/', asyncHandler(getAllAttendance));
hrAttendanceRoutes.get('/employees', asyncHandler(getEmployees));
