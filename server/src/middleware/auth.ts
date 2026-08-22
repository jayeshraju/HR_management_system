import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type AuthPayload } from '../utils/auth.js';
import { User } from '../models/User.js';
export type AuthRequest = Request & { auth?: AuthPayload };
function tokenFromRequest(req: AuthRequest) { return req.cookies?.dayflow_session ?? req.headers.authorization?.split(' ')[1]; }
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) { const value = tokenFromRequest(req); if (!value) return res.status(401).json({ error: 'Authentication required' }); try { const payload = verifyToken(value); const user = await User.findById(payload.userId).select('role status'); if (!user || user.status !== 'active' || user.role !== payload.role) { res.clearCookie('dayflow_session'); return res.status(401).json({ error: 'Invalid or expired session' }); } req.auth = { userId: String(user._id), role: user.role }; next(); } catch { res.clearCookie('dayflow_session'); res.status(401).json({ error: 'Invalid or expired session' }); } }
export function requireRole(...roles: Array<AuthPayload['role']>) { return (req: AuthRequest, res: Response, next: NextFunction) => req.auth && roles.includes(req.auth.role) ? next() : res.status(403).json({ error: 'Insufficient permissions' }); }
