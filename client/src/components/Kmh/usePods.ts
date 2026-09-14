import { request } from 'librechat-data-provider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Data layer for the KMH admin panel.
 *
 * Kept in its own file — and talking to `/api/admin/pods` directly rather than
 * going through librechat-data-provider's dataService — so none of it lands in
 * upstream's shared modules. The whole feature is two client files plus one
 * server route, which is what keeps merging upstream cheap.
 */

export interface Pod {
  value: string;
  label: string;
  color: string;
  order: number;
  isActive: boolean;
  agentCount: number;
}

export interface PodAgent {
  id: string;
  name: string;
  category: string;
  provider: string;
  model: string;
  updatedAt?: string;
}

const PODS_KEY = ['kmh', 'pods'];
const AGENTS_KEY = ['kmh', 'pods', 'agents'];

export function usePodsQuery(enabled: boolean) {
  return useQuery<Pod[]>({
    queryKey: PODS_KEY,
    queryFn: () => request.get('/api/admin/pods'),
    enabled,
    staleTime: 30_000,
  });
}

export function usePodAgentsQuery(enabled: boolean) {
  return useQuery<PodAgent[]>({
    queryKey: AGENTS_KEY,
    queryFn: () => request.get('/api/admin/pods/agents'),
    enabled,
    staleTime: 30_000,
  });
}

/** Anything that changes a pod or an assignment invalidates the same three
 *  caches: the admin lists, and the marketplace's own category query so the
 *  agent list repaints without a reload. */
function useInvalidatePods() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: PODS_KEY });
    queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
    queryClient.invalidateQueries({ queryKey: ['agentCategories'] });
    queryClient.invalidateQueries({ queryKey: ['marketplaceAgents'] });
  };
}

export function useCreatePod() {
  const invalidate = useInvalidatePods();
  return useMutation({
    mutationFn: (body: { label: string; color: string }) =>
      request.post('/api/admin/pods', body) as Promise<Pod>,
    onSuccess: invalidate,
  });
}

export function useUpdatePod() {
  const invalidate = useInvalidatePods();
  return useMutation({
    mutationFn: ({ value, ...body }: { value: string } & Partial<Omit<Pod, 'value'>>) =>
      request.patch(`/api/admin/pods/${encodeURIComponent(value)}`, body) as Promise<Pod>,
    onSuccess: invalidate,
  });
}

export function useDeletePod() {
  const invalidate = useInvalidatePods();
  return useMutation({
    mutationFn: (value: string) =>
      request.delete(`/api/admin/pods/${encodeURIComponent(value)}`) as Promise<{
        value: string;
        movedAgents: number;
      }>,
    onSuccess: invalidate,
  });
}

export function useAssignAgents() {
  const invalidate = useInvalidatePods();
  return useMutation({
    mutationFn: (body: { agentIds: string[]; pod: string }) =>
      request.post('/api/admin/pods/assign', body) as Promise<{ pod: string; updated: number }>,
    onSuccess: invalidate,
  });
}
