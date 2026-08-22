import mongoose from 'mongoose';
import { User } from '../dist/models/User.js';
import { EmployeeProfile } from '../dist/models/EmployeeProfile.js';
import { Attendance } from '../dist/models/Attendance.js';
import { LeaveRequest } from '../dist/models/LeaveRequest.js';
import { Payroll } from '../dist/models/Payroll.js';
import { Notification } from '../dist/models/Notification.js';
import { AuditLog } from '../dist/models/AuditLog.js';

const suffix = String(Date.now());
const date = new Date('2026-08-22T00:00:00.000Z');
let user;
let profile;

try {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dayflow');
  await Promise.all([User, EmployeeProfile, Attendance, LeaveRequest, Payroll, Notification, AuditLog].map((model) => model.init()));
  user = await User.create({ name: 'Model Test', employeeId: `MODEL-${suffix}`, email: `model-${suffix}@example.com`, passwordHash: 'test-hash', role: 'employee' });
  profile = await EmployeeProfile.create({ employee: user._id, department: 'Engineering', position: 'Tester', joiningDate: new Date() });
  const attendance = await Attendance.create({ employee: user._id, date, checkIn: new Date('2026-08-22T09:00:00Z'), checkOut: new Date('2026-08-22T17:00:00Z'), workingHours: 8, status: 'Present' });
  const leave = await LeaveRequest.create({ employee: user._id, leaveType: 'Paid', startDate: date, endDate: date, reason: 'Model verification' });
  const payroll = await Payroll.create({ employee: user._id, basicSalary: 1000, allowances: 100, deductions: 50, grossSalary: 1100, netSalary: 1050, effectiveDate: date });
  const notification = await Notification.create({ recipient: user._id, title: 'Model test', message: 'Verification', type: 'info' });
  const audit = await AuditLog.create({ actor: user._id, action: 'model.test', entity: 'User', entityId: user._id, newValue: { verified: true } });
  const populated = await EmployeeProfile.findById(profile._id).populate('employee', 'employeeId');
  let invalidDate = false;
  try { await Attendance.create({ employee: user._id, date: new Date('2026-08-23'), checkIn: new Date('2026-08-23T17:00:00Z'), checkOut: new Date('2026-08-23T09:00:00Z'), status: 'Present' }); } catch { invalidDate = true; }
  let duplicate = false;
  try { await Attendance.create({ employee: user._id, date, status: 'Absent' }); } catch { duplicate = true; }
  const timestamps = Boolean(user.createdAt && profile.createdAt && attendance.createdAt && leave.createdAt && payroll.createdAt && notification.timestamp && audit.timestamp);
  if (!timestamps || !invalidDate || !duplicate || populated.employee.employeeId !== user.employeeId) throw new Error('Model smoke assertion failed');
  console.log(JSON.stringify({ created: 7, timestamps, populatedReference: true, invalidDate, duplicate }));
} finally {
  if (user) {
    await Promise.all([
      EmployeeProfile.deleteOne({ _id: profile._id }),
      Attendance.deleteMany({ employee: user._id }),
      LeaveRequest.deleteMany({ employee: user._id }),
      Payroll.deleteMany({ employee: user._id }),
      Notification.deleteMany({ recipient: user._id }),
      AuditLog.deleteMany({ actor: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);
  }
  await mongoose.disconnect();
}
