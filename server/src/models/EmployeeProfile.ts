import { model, Schema, type InferSchemaType } from 'mongoose';

const employeeProfileSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  personalDetails: {
    firstName: { type: String, trim: true, maxlength: 80 },
    lastName: { type: String, trim: true, maxlength: 80 },
    dateOfBirth: { type: Date },
    gender: { type: String, trim: true, maxlength: 40 },
  },
  phone: { type: String, trim: true, maxlength: 30 },
  address: {
    line1: { type: String, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 80 },
  },
  profilePicture: { type: String, trim: true, maxlength: 500 },
  department: { type: String, trim: true, maxlength: 100, index: true },
  position: { type: String, trim: true, maxlength: 120 },
  joiningDate: { type: Date },
  manager: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  employmentStatus: { type: String, enum: ['active', 'inactive', 'on_leave', 'terminated'], default: 'active', index: true },
  documents: [{ name: { type: String, required: true, trim: true, maxlength: 120 }, url: { type: String, required: true, trim: true, maxlength: 500 }, uploadedAt: { type: Date, default: Date.now } }],
  // Bio fields
  about: { type: String, trim: true, maxlength: 2000 },
  whatILove: { type: String, trim: true, maxlength: 2000 },
  interests: { type: String, trim: true, maxlength: 2000 },
  // Skills & Certifications
  skills: [{ type: String, trim: true, maxlength: 80 }],
  certifications: [{ type: String, trim: true, maxlength: 120 }],
  // Additional info
  company: { type: String, trim: true, maxlength: 120 },
  location: { type: String, trim: true, maxlength: 120 },
}, { timestamps: true });

export type EmployeeProfileDocument = InferSchemaType<typeof employeeProfileSchema>;
export const EmployeeProfile = model('EmployeeProfile', employeeProfileSchema);
