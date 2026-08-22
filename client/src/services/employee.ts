import { authService, type User } from './auth';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const body = await response.json();
  if (response.status === 401) { await authService.logout().catch(() => undefined); window.location.assign('/login'); }
  if (!response.ok) throw new Error(body?.error ?? 'Unable to load this page.');
  return body as T;
}
export type AttendanceRecord = { _id: string; date: string; checkIn?: string; checkOut?: string; workingHours?: number; status: string };
export type LeaveRequest = { _id: string; leaveType: string; startDate: string; endDate: string; reason: string; remarks?: string; status: string; hrComment?: string; createdAt: string };
export type LeaveBalance = { limit: number | null; used: number; available: number | null };
export type DashboardData = { user: User; attendance: { today: AttendanceRecord | null; workingHoursThisMonth: number }; leave: { approvedDaysThisMonth: number; balanceConfigured: boolean }; pendingRequests: number; salary: { grossSalary: number; netSalary: number; effectiveDate: string; monthlyWage?: number } | null; notifications: Array<{ _id: string; title: string; message: string; type: string; read: boolean; timestamp: string }>; recentActivity: LeaveRequest[] };
export const employeeService = {
  dashboard: () => request<DashboardData>('/employee/dashboard'),
  profile: () => request<{ user: User; profile: any; compensation: any }>('/employee/profile'),
  updateProfile: (data: any) => request<{ profile: any }>('/employee/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  attendance: (query = '') => request<{ records: AttendanceRecord[]; insights: any }>(`/employee/attendance${query}`),
  checkIn: () => request<{ record: AttendanceRecord }>('/employee/attendance/check-in', { method: 'POST' }),
  checkOut: () => request<{ record: AttendanceRecord }>('/employee/attendance/check-out', { method: 'POST' }),
  leave: () => request<{ requests: LeaveRequest[]; balances: Record<string, LeaveBalance> }>('/employee/leave'),
  applyLeave: (data: any) => request<{ request: LeaveRequest; balances: Record<string, LeaveBalance> }>('/employee/leave', { method: 'POST', body: JSON.stringify(data) }),
  payroll: () => request<{ records: any[] }>('/employee/payroll'),
  notifications: () => request<{ notifications: any[] }>('/employee/notifications'),
};
