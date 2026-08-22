import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../services/attendance';
export function useEmployeeAttendance(query = '') { return useQuery({ queryKey: ['employee-attendance', query], queryFn: () => attendanceService.employee(query) }); }
export function useHrAttendance(query = '') { return useQuery({ queryKey: ['hr-attendance', query], queryFn: () => attendanceService.hr(query) }); }
export function useHrEmployees() { return useQuery({ queryKey: ['hr-attendance-employees'], queryFn: attendanceService.employees }); }
