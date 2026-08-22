import { Router } from 'express';
import { login, logout, register } from '../controllers/authController.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const authRoutes = Router();
authRoutes.post('/register', asyncHandler(register)); authRoutes.post('/login', asyncHandler(login)); authRoutes.post('/logout', requireAuth, logout); authRoutes.get('/me', requireAuth, asyncHandler(async (req: AuthRequest, res) => { const user = await User.findById(req.auth!.userId); if (!user) return res.status(404).json({ error: 'User not found' }); res.json({ user: { id: user.id, name: user.name, employeeId: user.employeeId, email: user.email, role: user.role } }); }));
