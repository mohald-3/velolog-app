import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ComponentUpdate, NewComponent } from '../../../domain/types';
import { componentRepository } from '../../../data/repositories/componentRepository';

const componentsKey = (bikeId: string) => ['bikes', bikeId, 'components'] as const;
const componentKey = (id: string) => ['components', id] as const;

export function useComponents(bikeId: string) {
  return useQuery({
    queryKey: componentsKey(bikeId),
    queryFn: () => componentRepository.listByBike(bikeId),
  });
}

export function useComponent(id: string | undefined) {
  return useQuery({
    queryKey: componentKey(id ?? ''),
    queryFn: () => componentRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewComponent) => componentRepository.create(input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: componentsKey(created.bikeId) });
    },
  });
}

export function useUpdateComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: ComponentUpdate }) =>
      componentRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: componentsKey(updated.bikeId) });
      queryClient.invalidateQueries({ queryKey: componentKey(updated.id) });
    },
  });
}

export function useRetireComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (component: { id: string; bikeId: string }) =>
      componentRepository.retire(component.id),
    onSuccess: (_result, component) => {
      queryClient.invalidateQueries({ queryKey: componentsKey(component.bikeId) });
      queryClient.invalidateQueries({ queryKey: componentKey(component.id) });
    },
  });
}
