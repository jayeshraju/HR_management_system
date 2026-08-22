import { model, Schema, type InferSchemaType } from 'mongoose';

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  type: { type: String, required: true, enum: ['info', 'success', 'warning', 'action'], index: true },
  read: { type: Boolean, default: false, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, timestamp: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = model('Notification', notificationSchema);
