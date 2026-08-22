import { AuditLog } from '../models/AuditLog.js';
export function recordAudit(input: { actor: unknown; action: string; entity: string; entityId: unknown; previousValue?: unknown; newValue?: unknown }) { return AuditLog.create(input); }
