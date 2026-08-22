import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employee';
export function useDashboard() { return useQuery({ queryKey: ['employee-dashboard'], queryFn: employeeService.dashboard }); }
export function useProfile() { return useQuery({ queryKey: ['employee-profile'], queryFn: employeeService.profile }); }
export function useAttendance(query = '') { return useQuery({ queryKey: ['employee-attendance', query], queryFn: () => employeeService.attendance(query) }); }
export function useLeave() { return useQuery({ queryKey: ['employee-leave'], queryFn: employeeService.leave }); }
export function usePayroll() { return useQuery({ queryKey: ['employee-payroll'], queryFn: employeeService.payroll }); }
export function useNotifications() { return useQuery({ queryKey: ['employee-notifications'], queryFn: employeeService.notifications }); }
export function useEmployeeMutation<T = void>(action: (input?: T) => Promise<unknown>, keys: string[][] = []) { const client = useQueryClient(); return useMutation({ mutationFn: action, onSuccess: () => { keys.forEach((key) => void client.invalidateQueries({ queryKey: key })); window.dispatchEvent(new CustomEvent('dayflow:toast', { detail: 'Changes saved.' })); } }); }
