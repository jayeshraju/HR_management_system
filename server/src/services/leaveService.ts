import { LeaveRequest } from '../models/LeaveRequest.js';
import type { LeaveType } from '../config/leavePolicy.js';
import { leaveLimits } from '../config/leavePolicy.js';

export function leaveDays(start: Date, end: Date) { return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1; }
export async function calculateLeaveBalances(employee: unknown) { const approved = await LeaveRequest.find({ employee, status: 'Approved' }).select('leaveType startDate endDate'); return (Object.keys(leaveLimits) as LeaveType[]).reduce((result, type) => { const used = approved.filter((request) => request.leaveType === type).reduce((total, request) => total + leaveDays(request.startDate, request.endDate), 0); const limit = leaveLimits[type]; result[type] = { limit, used, available: limit === null ? null : Math.max(limit - used, 0) }; return result; }, {} as Record<LeaveType, { limit: number | null; used: number; available: number | null }>); }
export async function hasOverlappingLeave(employee: unknown, startDate: Date, endDate: Date, excludeId?: string) { const filter: any = { employee, status: { $in: ['Pending', 'Approved'] }, startDate: { $lte: endDate }, endDate: { $gte: startDate } }; if (excludeId) filter._id = { $ne: excludeId }; return LeaveRequest.exists(filter); }
