import { model, Schema, type InferSchemaType } from 'mongoose';
const userSchema = new Schema({
	name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
	employeeId: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 30 },
	email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
	passwordHash: { type: String, required: true, select: false },
	role: { type: String, enum: ['employee', 'hr'], required: true, default: 'employee', index: true },
	status: { type: String, enum: ['active', 'inactive', 'suspended'], required: true, default: 'active', index: true },
}, { timestamps: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ employeeId: 1 }, { unique: true });
export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
