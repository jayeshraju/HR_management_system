const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error ?? 'Unable to load HR data.');
  return body as T;
}
export const hrService = {
  dashboard: () => request<any>('/hr/dashboard'),
  employees: (query = '') => request<any>(`/hr/employees${query}`),
  employee: (id: string) => request<any>(`/hr/employees/${id}`),
  updateEmployee: (id: string, data: unknown) => request<any>(`/hr/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  payroll: (employeeId = '') => request<any>(`/hr/payroll${employeeId ? `?employeeId=${employeeId}` : ''}`),
  updatePayroll: (employeeId: string, data: unknown) => request<any>(`/hr/payroll/${employeeId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateSalaryInfo: (employeeId: string, data: unknown) => request<any>(`/hr/payroll/${employeeId}/salary-info`, { method: 'PUT', body: JSON.stringify(data) }),
  employeeStatus: () => request<{ presentIds: string[]; onLeaveIds: string[] }>('/hr/employee-status'),
  hrAttendance: (query = '') => request<any>(`/hr/attendance${query}`),
  leaveRequests: (query = '') => request<any>(`/hr/leave${query}`),
  decideLeave: (id: string, data: unknown) => request<any>(`/hr/leave/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
