import { useMutation, useQuery } from '@tanstack/react-query';
import { intelligenceService } from '../services/intelligence';
export function useAnalytics() { return useQuery({ queryKey: ['analytics'], queryFn: intelligenceService.analytics }); }
export function useAssistant() { return useMutation({ mutationFn: intelligenceService.ask }); }
