import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { operationsService } from '../services/operations';
export function useNotificationsCenter() { return useQuery({ queryKey: ['notifications-center'], queryFn: operationsService.notifications }); }
export function useNotificationActions() { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, all }: { id?: string; all?: boolean }) => all ? operationsService.readAll() : operationsService.readNotification(id!), onSuccess: () => void client.invalidateQueries({ queryKey: ['notifications-center'] }) }); }
export function useAudit(query = '') { return useQuery({ queryKey: ['audit', query], queryFn: () => operationsService.audit(query) }); }
export function useGlobalSearch(query: string) { return useQuery({ queryKey: ['global-search', query], queryFn: () => operationsService.search(query), enabled: query.length > 1 }); }
export function useDemoMutation() { const client = useQueryClient(); return useMutation({ mutationFn: (action: 'seed' | 'reset') => action === 'seed' ? operationsService.seedDemo() : operationsService.resetDemo(), onSuccess: () => { void client.invalidateQueries(); window.dispatchEvent(new CustomEvent('dayflow:toast', { detail: 'Demo data updated.' })); } }); }
