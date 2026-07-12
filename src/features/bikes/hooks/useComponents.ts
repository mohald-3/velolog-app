import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { maintenanceRuleRepository } from '../../../data/repositories/maintenanceRuleRepository';
import type { Component, ComponentUpdate, NewComponent } from '../../../domain/types';
import { componentRepository } from '../../../data/repositories/componentRepository';

const componentsKey = (bikeId: string) => ['bikes', bikeId, 'components'] as const;
const componentKey = (id: string) => ['components', id] as const;
const rulesKey = (componentId: string) => ['components', componentId, 'maintenanceRules'] as const;

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

/** Retires the old component and installs a fresh one of the same type/name at the bike's
 * current odometer. Active maintenance rules move to the new component with their counter reset
 * to that odometer, since a replaced part's own service history doesn't apply to the new one. */
export function useReplaceComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      oldComponent,
      currentOdometerM,
    }: {
      oldComponent: Component;
      currentOdometerM: number;
    }) => {
      await componentRepository.retire(oldComponent.id);
      const newComponent = await componentRepository.create({
        bikeId: oldComponent.bikeId,
        type: oldComponent.type,
        name: oldComponent.name,
        installedAtOdometerM: currentOdometerM,
        installedDate: new Date(),
        expectedLifetimeKm: oldComponent.expectedLifetimeKm,
        notes: oldComponent.notes,
      });

      const rules = await maintenanceRuleRepository.listByComponent(oldComponent.id);
      for (const rule of rules) {
        await maintenanceRuleRepository.update(rule.id, {
          componentId: newComponent.id,
          lastPerformedAtOdometerM: currentOdometerM,
        });
      }

      return { oldComponent, newComponent };
    },
    onSuccess: ({ oldComponent, newComponent }) => {
      queryClient.invalidateQueries({ queryKey: componentsKey(oldComponent.bikeId) });
      queryClient.invalidateQueries({ queryKey: componentKey(oldComponent.id) });
      queryClient.invalidateQueries({ queryKey: rulesKey(oldComponent.id) });
      queryClient.invalidateQueries({ queryKey: rulesKey(newComponent.id) });
    },
  });
}
