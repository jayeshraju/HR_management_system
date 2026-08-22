import type { Response } from 'express';
import { z } from 'zod';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';
import { attendanceInsights } from './employeeController.js';

const querySchema = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional(), employeeId: z.string().trim().max(30).optional(), status: z.enum(['Present', 'Absent', 'Half-day', 'Leave']).optional() });
export async function getAllAttendance(req: AuthRequest, res: Response) { const input = querySchema.parse(req.query); const filter: any = {}; if (input.from || input.to) filter.date = { ...(input.from ? { $gte: input.from } : {}), ...(input.to ? { $lt: input.to } : {}) }; if (input.status) filter.status = input.status; if (input.employeeId) { const employee = await User.findOne({ employeeId: input.employeeId.toUpperCase() }).select('_id'); if (!employee) return res.json({ records: [], insights: attendanceInsights([]) }); filter.employee = employee._id; } const records = await Attendance.find(filter).populate('employee', 'name employeeId email').sort({ date: -1 }).limit(2000); res.json({ records, insights: attendanceInsights(records) }); }
export async function getEmployees(req: AuthRequest, res: Response) { const employees = await User.find({ role: 'employee', status: 'active' }).select('name employeeId').sort({ name: 1 }); res.json({ employees }); }
