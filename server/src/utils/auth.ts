import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export type AuthPayload = { userId: string; role: 'employee' | 'hr' };
export const signToken = (payload: AuthPayload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' });
export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as AuthPayload;
