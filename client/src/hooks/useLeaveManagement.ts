import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '../services/leave';
export function useHrLeave(query = '') { return useQuery({ queryKey: ['hr-leave', query], queryFn: () => leaveService.hrList(query) }); }
export function useLeaveDecision() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, status, hrComment }: { id: string; status: 'Approved' | 'Rejected'; hrComment?: string }) => leaveService.decide(id, status, hrComment), onSuccess: () => { void client.invalidateQueries({ queryKey: ['hr-leave'] }); window.dispatchEvent(new CustomEvent('dayflow:toast', { detail: 'Leave request updated.' })); } }); }
