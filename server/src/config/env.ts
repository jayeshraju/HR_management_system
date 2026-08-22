import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({ NODE_ENV: z.enum(['development','test','production']).default('development'), PORT: z.coerce.number().default(4000), MONGODB_URI: z.string().min(1), JWT_SECRET: z.string().min(32), CLIENT_URL: z.string().url().default('http://localhost:5173'), PAID_LEAVE_LIMIT: z.coerce.number().int().min(0).default(20), SICK_LEAVE_LIMIT: z.coerce.number().int().min(0).default(10), DEMO_MODE: z.coerce.boolean().default(false), HR_REGISTRATION_CODE: z.string().min(16).optional() });
export const env = schema.parse(process.env);
