import { model, Schema, type InferSchemaType } from 'mongoose';

const leaveRequestSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  leaveType: { type: String, enum: ['Paid', 'Sick', 'Unpaid'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  remarks: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  hrComment: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

leaveRequestSchema.index({ employee: 1, startDate: -1 });
leaveRequestSchema.index({ status: 1, startDate: 1 });
leaveRequestSchema.pre('validate', function validateDateRange(next) { if (this.endDate < this.startDate) this.invalidate('endDate', 'End date cannot be before start date'); next(); });

export type LeaveRequestDocument = InferSchemaType<typeof leaveRequestSchema>;
export const LeaveRequest = model('LeaveRequest', leaveRequestSchema);
