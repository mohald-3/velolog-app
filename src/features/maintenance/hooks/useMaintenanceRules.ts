import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MaintenanceRuleUpdate, NewMaintenanceRule } from '../../../domain/types';
import { maintenanceRuleRepository } from '../../../data/repositories/maintenanceRuleRepository';
import { queryKeys } from '../../queryKeys';

export function useMaintenanceRules(componentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.maintenanceRules(componentId ?? ''),
    queryFn: () => maintenanceRuleRepository.listByComponent(componentId as string),
    enabled: Boolean(componentId),
  });
}

export function useMaintenanceRule(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.maintenanceRule(id ?? ''),
    queryFn: () => maintenanceRuleRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateMaintenanceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewMaintenanceRule) => maintenanceRuleRepository.create(input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRules(created.componentId) });
    },
  });
}

export function useUpdateMaintenanceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: MaintenanceRuleUpdate }) =>
      maintenanceRuleRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRules(updated.componentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRule(updated.id) });
    },
  });
}

export function useArchiveMaintenanceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: { id: string; componentId: string }) => maintenanceRuleRepository.archive(rule.id),
    onSuccess: (_result, rule) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRules(rule.componentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRule(rule.id) });
    },
  });
}
