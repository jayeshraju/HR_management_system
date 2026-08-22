import { env } from './env.js';

export const leaveLimits = { Paid: env.PAID_LEAVE_LIMIT, Sick: env.SICK_LEAVE_LIMIT, Unpaid: null } as const;
export type LeaveType = keyof typeof leaveLimits;
