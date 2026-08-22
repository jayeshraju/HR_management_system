import type { Response } from 'express';
import { z } from 'zod';
import { Attendance } from '../models/Attendance.js';
import { EmployeeProfile } from '../models/EmployeeProfile.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Notification } from '../models/Notification.js';
import { Payroll } from '../models/Payroll.js';
import { User } from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';
import { calculateLeaveBalances, hasOverlappingLeave, leaveDays } from '../services/leaveService.js';
import { AuditLog } from '../models/AuditLog.js';

const profileUpdate = z.object({
  phone: z.string().trim().max(30).optional(),
  address: z.object({ line1: z.string().trim().max(120).optional(), line2: z.string().trim().max(120).optional(), city: z.string().trim().max(80).optional(), state: z.string().trim().max(80).optional(), postalCode: z.string().trim().max(20).optional(), country: z.string().trim().max(80).optional() }).optional(),
  profilePicture: z.string().url().max(500).optional().or(z.literal('')),
  about: z.string().trim().max(2000).optional(),
  whatILove: z.string().trim().max(2000).optional(),
  interests: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim().max(80)).max(50).optional(),
  certifications: z.array(z.string().trim().max(120)).max(30).optional(),
  company: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
}).strict();

const leaveInput = z.object({ leaveType: z.enum(['Paid', 'Sick', 'Unpaid']), startDate: z.coerce.date(), endDate: z.coerce.date(), reason: z.string().trim().min(1).max(1000), remarks: z.string().trim().max(1000).optional() }).refine((value) => value.endDate >= value.startDate, { path: ['endDate'], message: 'End date cannot be before start date' });
const userFor = (user: any) => ({ id: user._id, name: user.name, employeeId: user.employeeId, email: user.email, role: user.role, status: user.status });
function dayBounds(date = new Date()) { const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); return { start, end: new Date(start.getTime() + 86400000) }; }
function daysBetween(start: Date, end: Date) { return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1; }

export async function dashboard(req: AuthRequest, res: Response) {
  const employee = await User.findById(req.auth!.userId);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  const { start, end } = dayBounds();
  const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const [today, monthAttendance, pendingRequests, latestPayroll, notifications, recentLeave] = await Promise.all([
    Attendance.findOne({ employee: employee._id, date: { $gte: start, $lt: end } }),
    Attendance.find({ employee: employee._id, date: { $gte: monthStart, $lt: end } }).sort({ date: -1 }).limit(31),
    LeaveRequest.countDocuments({ employee: employee._id, status: 'Pending' }),
    Payroll.findOne({ employee: employee._id }).sort({ effectiveDate: -1 }),
    Notification.find({ recipient: employee._id }).sort({ timestamp: -1 }).limit(5),
    LeaveRequest.find({ employee: employee._id }).sort({ createdAt: -1 }).limit(5),
  ]);
  const approvedLeave = await LeaveRequest.find({ employee: employee._id, status: 'Approved', startDate: { $gte: monthStart } }).select('startDate endDate');
  const approvedDays = approvedLeave.reduce((total, request) => total + daysBetween(request.startDate, request.endDate), 0);
  const balances = await calculateLeaveBalances(employee._id);
  res.json({ user: userFor(employee), attendance: { today, workingHoursThisMonth: monthAttendance.reduce((total, item) => total + (item.workingHours ?? 0), 0) }, leave: { approvedDaysThisMonth: approvedDays, balanceConfigured: true, balances }, pendingRequests, salary: latestPayroll ? { grossSalary: latestPayroll.grossSalary, netSalary: latestPayroll.netSalary, effectiveDate: latestPayroll.effectiveDate, monthlyWage: latestPayroll.monthlyWage } : null, notifications, recentActivity: recentLeave });
}

export async function getProfile(req: AuthRequest, res: Response) {
  const [user, profile, payroll] = await Promise.all([
    User.findById(req.auth!.userId),
    EmployeeProfile.findOne({ employee: req.auth!.userId }).populate('manager', 'name employeeId'),
    Payroll.findOne({ employee: req.auth!.userId }).sort({ effectiveDate: -1 }),
  ]);
  if (!user) return res.status(404).json({ error: 'Employee not found' });
  res.json({ user: userFor(user), profile, compensation: payroll });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const input = profileUpdate.parse(req.body);
  const previous = await EmployeeProfile.findOne({ employee: req.auth!.userId }).lean();
  const profile = await EmployeeProfile.findOneAndUpdate(
    { employee: req.auth!.userId },
    { $set: input },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await AuditLog.create({ actor: req.auth!.userId, action: 'profile.modified', entity: 'EmployeeProfile', entityId: profile._id, previousValue: previous ?? undefined, newValue: profile.toObject() });
  res.json({ profile });
}

export function attendanceInsights(records: Array<{ status: string; checkIn?: Date | null; checkOut?: Date | null; workingHours?: number | null }>) {
  const recordedDays = records.length;
  const presentDays = records.filter((record) => ['Present', 'Half-day'].includes(record.status)).length;
  const arrivalTimes = records.filter((record) => record.checkIn).map((record) => { const date = record.checkIn!.getUTCHours() * 60 + record.checkIn!.getUTCMinutes(); return date; });
  const averageArrivalMinutes = arrivalTimes.length ? Math.round(arrivalTimes.reduce((sum, value) => sum + value, 0) / arrivalTimes.length) : null;
  const totalHours = records.reduce((sum, record) => sum + (record.workingHours ?? 0), 0);
  const standardHoursPerDay = 8;
  return {
    attendancePercentage: recordedDays ? Math.round((presentDays / recordedDays) * 100) : 0,
    averageArrivalTime: averageArrivalMinutes === null ? null : `${String(Math.floor(averageArrivalMinutes / 60)).padStart(2, '0')}:${String(averageArrivalMinutes % 60).padStart(2, '0')}`,
    totalWorkingHours: Math.round(totalHours * 100) / 100,
    lateArrivals: records.filter((record) => record.checkIn && record.checkIn.getUTCHours() * 60 + record.checkIn.getUTCMinutes() > 9 * 60).length,
    missingCheckouts: records.filter((record) => record.checkIn && !record.checkOut).length,
    extraHours: records.map((record) => { const wh = record.workingHours ?? 0; return Math.max(0, Math.round((wh - standardHoursPerDay) * 100) / 100); }),
  };
}

export async function getAttendance(req: AuthRequest, res: Response) {
  const range = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() }).parse(req.query);
  const filter: any = { employee: req.auth!.userId };
  if (range.from || range.to) filter.date = { ...(range.from ? { $gte: range.from } : {}), ...(range.to ? { $lt: range.to } : {}) };
  const records = await Attendance.find(filter).sort({ date: -1 }).limit(370);
  res.json({ records, insights: attendanceInsights(records) });
}

export async function checkIn(req: AuthRequest, res: Response) {
  const { start, end } = dayBounds();
  const existing = await Attendance.findOne({ employee: req.auth!.userId, date: { $gte: start, $lt: end } });
  if (existing?.checkIn) return res.status(409).json({ error: 'You are already checked in today' });
  const record = existing ?? new Attendance({ employee: req.auth!.userId, date: start, status: 'Present' });
  record.checkIn = new Date();
  record.status = 'Present';
  await record.save();
  await AuditLog.create({ actor: req.auth!.userId, action: 'attendance.modified', entity: 'Attendance', entityId: record._id, newValue: record.toObject() });
  res.status(existing ? 200 : 201).json({ record });
}

export async function checkOut(req: AuthRequest, res: Response) {
  const { start, end } = dayBounds();
  const record = await Attendance.findOne({ employee: req.auth!.userId, date: { $gte: start, $lt: end } });
  if (!record?.checkIn) return res.status(409).json({ error: 'Check in before checking out' });
  if (record.checkOut) return res.status(409).json({ error: 'You are already checked out today' });
  const previous = record.toObject();
  record.checkOut = new Date();
  record.workingHours = Math.round(((record.checkOut.getTime() - record.checkIn.getTime()) / 3600000) * 100) / 100;
  await record.save();
  await AuditLog.create({ actor: req.auth!.userId, action: 'attendance.modified', entity: 'Attendance', entityId: record._id, previousValue: previous, newValue: record.toObject() });
  res.json({ record });
}

export async function getLeave(req: AuthRequest, res: Response) {
  const [requests, balances] = await Promise.all([LeaveRequest.find({ employee: req.auth!.userId }).sort({ createdAt: -1 }), calculateLeaveBalances(req.auth!.userId)]);
  res.json({ requests, balances });
}

export async function applyLeave(req: AuthRequest, res: Response) {
  const input = leaveInput.parse(req.body);
  if (await hasOverlappingLeave(req.auth!.userId, input.startDate, input.endDate)) return res.status(409).json({ error: 'This date range overlaps an existing leave request' });
  const balances = await calculateLeaveBalances(req.auth!.userId);
  const balance = balances[input.leaveType];
  const requestedDays = leaveDays(input.startDate, input.endDate);
  if (balance.available !== null && requestedDays > balance.available) return res.status(400).json({ error: `You only have ${balance.available} ${input.leaveType.toLowerCase()} leave day(s) available` });
  const request = await LeaveRequest.create({ ...input, employee: req.auth!.userId });
  const hrUsers = await User.find({ role: 'hr', status: 'active' }).select('_id');
  if (hrUsers.length) await Notification.insertMany(hrUsers.map((hr) => ({ recipient: hr._id, title: 'New leave request', message: `A new ${request.leaveType.toLowerCase()} leave request needs review.`, type: 'action' })));
  res.status(201).json({ request, balances: await calculateLeaveBalances(req.auth!.userId) });
}

export async function getPayroll(req: AuthRequest, res: Response) { res.json({ records: await Payroll.find({ employee: req.auth!.userId }).sort({ effectiveDate: -1 }) }); }

export async function getNotifications(req: AuthRequest, res: Response) {
  const notifications = await Notification.find({ recipient: req.auth!.userId }).sort({ timestamp: -1 });
  res.json({ notifications, unreadCount: notifications.filter((notification) => !notification.read).length });
}
