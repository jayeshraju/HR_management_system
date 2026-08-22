import { model, Schema, type InferSchemaType } from 'mongoose';

const auditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, trim: true, maxlength: 120 },
  entity: { type: String, required: true, trim: true, maxlength: 80, index: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  previousValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

auditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLog = model('AuditLog', auditLogSchema);
