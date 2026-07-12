import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Component, ComponentUpdate, NewComponent } from '../../../domain/types';
import { componentRepository } from '../../../data/repositories/componentRepository';
import { queryKeys } from '../../queryKeys';

export function useComponents(bikeId: string) {
  return useQuery({
    queryKey: queryKeys.components(bikeId),
    queryFn: () => componentRepository.listByBike(bikeId),
  });
}

export function useComponent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.component(id ?? ''),
    queryFn: () => componentRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewComponent) => componentRepository.create(input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.components(created.bikeId) });
    },
  });
}

export function useUpdateComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: ComponentUpdate }) =>
      componentRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.components(updated.bikeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.component(updated.id) });
    },
  });
}

export function useRetireComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (component: { id: string; bikeId: string }) =>
      componentRepository.retire(component.id),
    onSuccess: (_result, component) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.components(component.bikeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.component(component.id) });
    },
  });
}

/** Retires the old component and installs a fresh one of the same type/name at the bike's
 * current odometer. Active maintenance rules move to the new component with their counter reset
 * to that odometer, since a replaced part's own service history doesn't apply to the new one.
 * The whole swap is a single transaction in the repository. */
export function useReplaceComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      oldComponent,
      currentOdometerM,
    }: {
      oldComponent: Component;
      currentOdometerM: number;
    }) => ({
      oldComponent,
      newComponent: await componentRepository.replace(oldComponent, currentOdometerM),
    }),
    onSuccess: ({ oldComponent, newComponent }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.components(oldComponent.bikeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.component(oldComponent.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRules(oldComponent.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRules(newComponent.id) });
    },
  });
}
