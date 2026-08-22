import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken } from '../utils/auth.js';
import { AuditLog } from '../models/AuditLog.js';
import { env } from '../config/env.js';
const registration = z.object({ name: z.string().min(2).max(80).optional(), employeeId: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/i), email: z.string().email(), password: z.string().min(8).max(128), role: z.enum(['employee', 'hr']), hrRegistrationCode: z.string().optional() });
const loginInput = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });
const publicUser = (user: any) => ({ id: user._id, name: user.name, employeeId: user.employeeId, email: user.email, role: user.role });
const sessionCookie = (res: Response, user: any) => res.cookie('dayflow_session', signToken({ userId: user.id, role: user.role }), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000, path: '/' });
export async function register(req: Request, res: Response) { const input = registration.parse(req.body); if (input.role === 'hr' && (!env.DEMO_MODE && (!env.HR_REGISTRATION_CODE || input.hrRegistrationCode !== env.HR_REGISTRATION_CODE))) return res.status(403).json({ error: 'HR accounts require an authorized registration code' }); if (await User.exists({ $or: [{ email: input.email }, { employeeId: input.employeeId }] })) return res.status(409).json({ error: 'An account with that email or employee ID already exists' }); const user = await User.create({ name: input.name ?? input.employeeId, employeeId: input.employeeId, email: input.email, role: input.role, passwordHash: await bcrypt.hash(input.password, 12) }); await AuditLog.create({ actor: user._id, action: 'employee.created', entity: 'User', entityId: user._id, newValue: publicUser(user) }); sessionCookie(res, user); res.status(201).json({ user: publicUser(user) }); }
export async function login(req: Request, res: Response) { const input = loginInput.parse(req.body); const user = await User.findOne({ email: input.email }).select('+passwordHash'); if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: 'The email or password is incorrect. Please try again.' }); await AuditLog.create({ actor: user._id, action: 'login', entity: 'User', entityId: user._id }); sessionCookie(res, user); res.json({ user: publicUser(user) }); }
export function logout(_req: Request, res: Response) { res.clearCookie('dayflow_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' }); res.status(204).send(); }
