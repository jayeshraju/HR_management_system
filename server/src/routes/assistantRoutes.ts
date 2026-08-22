import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ask } from '../controllers/assistantController.js';
export const assistantRoutes = Router();
assistantRoutes.post('/ask', requireAuth, asyncHandler(ask));
