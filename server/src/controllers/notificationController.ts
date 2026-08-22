import type { Response } from 'express';
import { z } from 'zod';
import { Notification } from '../models/Notification.js';
import type { AuthRequest } from '../middleware/auth.js';
const idInput = z.object({ id: z.string().min(1) });
export async function listNotifications(req: AuthRequest, res: Response) { const notifications = await Notification.find({ recipient: req.auth!.userId }).sort({ timestamp: -1 }).limit(200); res.json({ notifications, unreadCount: notifications.filter((item) => !item.read).length }); }
export async function markRead(req: AuthRequest, res: Response) { const { id } = idInput.parse(req.params); const notification = await Notification.findOneAndUpdate({ _id: id, recipient: req.auth!.userId }, { $set: { read: true } }, { new: true }); if (!notification) return res.status(404).json({ error: 'Notification not found' }); res.json({ notification }); }
export async function markAllRead(req: AuthRequest, res: Response) { await Notification.updateMany({ recipient: req.auth!.userId, read: false }, { $set: { read: true } }); res.status(204).send(); }
