import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => { if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid request', details: error.flatten().fieldErrors }); console.error(error); const status = error.statusCode ?? 500; res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message }); };
