import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applyLeave, checkIn, checkOut, dashboard, getAttendance, getLeave, getNotifications, getPayroll, getProfile, updateProfile } from '../controllers/employeeController.js';

export const employeeRoutes = Router();
employeeRoutes.use(requireAuth, requireRole('employee'));
employeeRoutes.get('/dashboard', asyncHandler(dashboard));
employeeRoutes.get('/profile', asyncHandler(getProfile));
employeeRoutes.patch('/profile', asyncHandler(updateProfile));
employeeRoutes.get('/attendance', asyncHandler(getAttendance));
employeeRoutes.post('/attendance/check-in', asyncHandler(checkIn));
employeeRoutes.post('/attendance/check-out', asyncHandler(checkOut));
employeeRoutes.get('/leave', asyncHandler(getLeave));
employeeRoutes.post('/leave', asyncHandler(applyLeave));
employeeRoutes.get('/payroll', asyncHandler(getPayroll));
employeeRoutes.get('/notifications', asyncHandler(getNotifications));
