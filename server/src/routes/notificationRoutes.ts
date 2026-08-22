import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listNotifications, markAllRead, markRead } from '../controllers/notificationController.js';
export const notificationRoutes = Router();
notificationRoutes.use(requireAuth);
notificationRoutes.get('/', asyncHandler(listNotifications));
notificationRoutes.patch('/:id/read', asyncHandler(markRead));
notificationRoutes.post('/read-all', asyncHandler(markAllRead));
