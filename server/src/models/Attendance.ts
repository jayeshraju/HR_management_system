import { model, Schema, type InferSchemaType } from 'mongoose';

const attendanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workingHours: { type: Number, min: 0, max: 24 },
  status: { type: String, enum: ['Present', 'Absent', 'Half-day', 'Leave'], required: true, index: true },
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.pre('validate', function validateTimes(next) { if (this.checkIn && this.checkOut && this.checkOut < this.checkIn) this.invalidate('checkOut', 'Check-out cannot be before check-in'); next(); });

export type AttendanceDocument = InferSchemaType<typeof attendanceSchema>;
export const Attendance = model('Attendance', attendanceSchema);
