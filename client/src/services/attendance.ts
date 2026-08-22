import { authService } from './auth';
import type { AttendanceRecord } from './employee';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
export type AttendanceInsights = { attendancePercentage: number; averageArrivalTime: string | null; totalWorkingHours: number; lateArrivals: number; missingCheckouts: number };
async function request<T>(path: string): Promise<T> { const response = await fetch(`${API_URL}${path}`, { credentials: 'include' }); const body = await response.json(); if (response.status === 401) { await authService.logout().catch(() => undefined); window.location.assign('/login'); } if (!response.ok) throw new Error(body?.error ?? 'Unable to load attendance.'); return body as T; }
export const attendanceService = { employee: (query = '') => request<{ records: AttendanceRecord[]; insights: AttendanceInsights }>(`/employee/attendance${query}`), hr: (query = '') => request<{ records: Array<AttendanceRecord & { employee: { name: string; employeeId: string } }>; insights: AttendanceInsights }>(`/hr/attendance${query}`), employees: () => request<{ employees: Array<{ name: string; employeeId: string }> }>('/hr/attendance/employees') };
