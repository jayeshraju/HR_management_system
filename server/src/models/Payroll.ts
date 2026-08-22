import { model, Schema, type InferSchemaType } from 'mongoose';

const payrollSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  basicSalary: { type: Number, required: true, min: 0 },
  allowances: { type: Number, default: 0, min: 0 },
  deductions: { type: Number, default: 0, min: 0 },
  grossSalary: { type: Number, required: true, min: 0 },
  netSalary: { type: Number, required: true, min: 0 },
  effectiveDate: { type: Date, required: true, index: true },
  // INR salary breakdown
  monthlyWage: { type: Number, min: 0 },
  yearlyWage: { type: Number, min: 0 },
  workingDaysPerWeek: { type: Number, min: 1, max: 7, default: 5 },
  breakTimeHrs: { type: Number, min: 0, max: 24, default: 1 },
  // Calculated components
  hra: { type: Number, min: 0 },
  standardAllowance: { type: Number, min: 0 },
  performanceBonus: { type: Number, min: 0 },
  lta: { type: Number, min: 0 },
  fixedAllowance: { type: Number, min: 0 },
  employeePf: { type: Number, min: 0 },
  employerPf: { type: Number, min: 0 },
  professionalTax: { type: Number, min: 0 },
}, { timestamps: true });

payrollSchema.index({ employee: 1, effectiveDate: -1 }, { unique: true });

export type PayrollDocument = InferSchemaType<typeof payrollSchema>;
export const Payroll = model('Payroll', payrollSchema);
