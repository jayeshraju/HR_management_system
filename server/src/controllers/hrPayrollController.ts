import type { Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { AuditLog } from '../models/AuditLog.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Payroll } from '../models/Payroll.js';
import { User } from '../models/User.js';
import type { AuthRequest } from '../middleware/auth.js';

const payrollInput = z.object({
  basicSalary: z.coerce.number().min(0).max(100000000),
  allowances: z.coerce.number().min(0).max(100000000),
  deductions: z.coerce.number().min(0).max(100000000),
  effectiveDate: z.coerce.date(),
}).refine((value) => value.basicSalary + value.allowances >= value.deductions, { message: 'Deductions cannot exceed gross salary', path: ['deductions'] });

const salaryInfoInput = z.object({
  monthlyWage: z.coerce.number().min(0).max(100000000),
  workingDaysPerWeek: z.coerce.number().min(1).max(7).default(5),
  breakTimeHrs: z.coerce.number().min(0).max(24).default(1),
  effectiveDate: z.coerce.date(),
});

function calcSalaryComponents(monthlyWage: number) {
  const basic = Math.round(monthlyWage * 0.5);
  const hra = Math.round(basic * 0.5);
  const standardAllowance = 4167;
  const performanceBonus = Math.round(basic * 0.0833);
  const lta = Math.round(basic * 0.0833);
  const grossBeforeFixed = basic + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, monthlyWage - grossBeforeFixed);
  const employeePf = Math.round(basic * 0.12);
  const employerPf = Math.round(basic * 0.12);
  const professionalTax = 200;
  const grossSalary = monthlyWage;
  const netSalary = grossSalary - employeePf - professionalTax;
  return { basic, hra, standardAllowance, performanceBonus, lta, fixedAllowance, employeePf, employerPf, professionalTax, grossSalary, netSalary };
}

export async function listPayroll(req: AuthRequest, res: Response) {
  const employee = req.query.employeeId
    ? await User.findOne({ employeeId: String(req.query.employeeId).toUpperCase(), role: 'employee' }).select('_id')
    : null;
  if (req.query.employeeId && !employee) return res.json({ records: [] });
  const records = await Payroll.find(employee ? { employee: employee._id } : {}).populate('employee', 'name employeeId email').sort({ effectiveDate: -1 }).limit(2000);
  res.json({ records });
}

export async function updatePayroll(req: AuthRequest, res: Response) {
  const input = payrollInput.parse(req.body);
  const identifier = String(req.params.employeeId);
  const employee = await User.findOne({
    role: 'employee',
    ...(Types.ObjectId.isValid(identifier)
      ? { $or: [{ _id: identifier }, { employeeId: identifier.toUpperCase() }] }
      : { employeeId: identifier.toUpperCase() }),
  });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  const grossSalary = input.basicSalary + input.allowances;
  const netSalary = grossSalary - input.deductions;
  const previous = await Payroll.findOne({ employee: employee._id }).sort({ effectiveDate: -1 }).lean();
  const record = await Payroll.findOneAndUpdate(
    { employee: employee._id, effectiveDate: input.effectiveDate },
    { $set: { ...input, employee: employee._id, grossSalary, netSalary } },
    { new: true, upsert: true, runValidators: true }
  );
  await AuditLog.create({ actor: req.auth!.userId, action: 'payroll.modified', entity: 'Payroll', entityId: record._id, previousValue: previous ?? undefined, newValue: record.toObject() });
  res.json({ record });
}

export async function updateSalaryInfo(req: AuthRequest, res: Response) {
  const input = salaryInfoInput.parse(req.body);
  const identifier = String(req.params.employeeId);
  const employee = await User.findOne({
    role: 'employee',
    ...(Types.ObjectId.isValid(identifier)
      ? { $or: [{ _id: identifier }, { employeeId: identifier.toUpperCase() }] }
      : { employeeId: identifier.toUpperCase() }),
  });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  const comps = calcSalaryComponents(input.monthlyWage);
  const yearlyWage = input.monthlyWage * 12;
  const previous = await Payroll.findOne({ employee: employee._id }).sort({ effectiveDate: -1 }).lean();
  const record = await Payroll.findOneAndUpdate(
    { employee: employee._id, effectiveDate: input.effectiveDate },
    {
      $set: {
        employee: employee._id,
        effectiveDate: input.effectiveDate,
        monthlyWage: input.monthlyWage,
        yearlyWage,
        workingDaysPerWeek: input.workingDaysPerWeek,
        breakTimeHrs: input.breakTimeHrs,
        basicSalary: comps.basic,
        hra: comps.hra,
        standardAllowance: comps.standardAllowance,
        performanceBonus: comps.performanceBonus,
        lta: comps.lta,
        fixedAllowance: comps.fixedAllowance,
        employeePf: comps.employeePf,
        employerPf: comps.employerPf,
        professionalTax: comps.professionalTax,
        allowances: comps.hra + comps.standardAllowance + comps.performanceBonus + comps.lta + comps.fixedAllowance,
        deductions: comps.employeePf + comps.professionalTax,
        grossSalary: comps.grossSalary,
        netSalary: comps.netSalary,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );
  await AuditLog.create({ actor: req.auth!.userId, action: 'payroll.salary-info.updated', entity: 'Payroll', entityId: record._id, previousValue: previous ?? undefined, newValue: record.toObject() });
  res.json({ record, components: comps });
}

export async function getEmployeeStatus(req: AuthRequest, res: Response) {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const end = new Date(start.getTime() + 86400000);
  const [presentToday, onLeaveToday] = await Promise.all([
    Attendance.find({ date: { $gte: start, $lt: end }, status: { $in: ['Present', 'Half-day'] } }).distinct('employee'),
    LeaveRequest.find({ status: 'Approved', startDate: { $lte: start }, endDate: { $gte: start } }).distinct('employee'),
  ]);
  const presentSet = new Set(presentToday.map(String));
  const onLeaveSet = new Set(onLeaveToday.map(String));
  res.json({ presentIds: [...presentSet], onLeaveIds: [...onLeaveSet] });
}
