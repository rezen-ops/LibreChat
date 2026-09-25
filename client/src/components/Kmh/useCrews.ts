import { request } from 'librechat-data-provider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Data layer for the KMH admin panel.
 *
 * Kept in its own file — and talking to `/api/admin/crews` directly rather than
 * going through librechat-data-provider's dataService — so none of it lands in
 * upstream's shared modules. The whole feature is two client files plus one
 * server route, which is what keeps merging upstream cheap.
 */

export interface Crew {
  value: string;
  label: string;
  color: string;
  order: number;
  isActive: boolean;
  agentCount: number;
}

export interface CrewAgent {
  id: string;
  name: string;
  category: string;
  provider: string;
  model: string;
  updatedAt?: string;
}

const PODS_KEY = ['kmh', 'crews'];
const AGENTS_KEY = ['kmh', 'crews', 'agents'];

export function useCrewsQuery(enabled: boolean) {
  return useQuery<Crew[]>({
    queryKey: PODS_KEY,
    queryFn: () => request.get('/api/admin/crews'),
    enabled,
    staleTime: 30_000,
  });
}

export function useCrewAgentsQuery(enabled: boolean) {
  return useQuery<CrewAgent[]>({
    queryKey: AGENTS_KEY,
    queryFn: () => request.get('/api/admin/crews/agents'),
    enabled,
    staleTime: 30_000,
  });
}

/** Anything that changes a crew or an assignment invalidates the same three
 *  caches: the admin lists, and the marketplace's own category query so the
 *  agent list repaints without a reload. */
function useInvalidateCrews() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: PODS_KEY });
    queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
    queryClient.invalidateQueries({ queryKey: ['agentCategories'] });
    queryClient.invalidateQueries({ queryKey: ['marketplaceAgents'] });
  };
}

export function useCreateCrew() {
  const invalidate = useInvalidateCrews();
  return useMutation({
    mutationFn: (body: { label: string; color: string }) =>
      request.post('/api/admin/crews', body) as Promise<Crew>,
    onSuccess: invalidate,
  });
}

export function useUpdateCrew() {
  const invalidate = useInvalidateCrews();
  return useMutation({
    mutationFn: ({ value, ...body }: { value: string } & Partial<Omit<Crew, 'value'>>) =>
      request.patch(`/api/admin/crews/${encodeURIComponent(value)}`, body) as Promise<Crew>,
    onSuccess: invalidate,
  });
}

export function useDeleteCrew() {
  const invalidate = useInvalidateCrews();
  return useMutation({
    mutationFn: (value: string) =>
      request.delete(`/api/admin/crews/${encodeURIComponent(value)}`) as Promise<{
        value: string;
        movedAgents: number;
      }>,
    onSuccess: invalidate,
  });
}

export function useAssignAgents() {
  const invalidate = useInvalidateCrews();
  return useMutation({
    mutationFn: (body: { agentIds: string[]; crew: string }) =>
      request.post('/api/admin/crews/assign', body) as Promise<{ crew: string; updated: number }>,
    onSuccess: invalidate,
  });
}
