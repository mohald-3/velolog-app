import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MaintenanceRuleUpdate, NewMaintenanceRule } from '../../../domain/types';
import { maintenanceRuleRepository } from '../../../data/repositories/maintenanceRuleRepository';

const rulesKey = (componentId: string) => ['components', componentId, 'maintenanceRules'] as const;
const ruleKey = (id: string) => ['maintenanceRules', id] as const;

export function useMaintenanceRules(componentId: string | undefined) {
  return useQuery({
    queryKey: rulesKey(componentId ?? ''),
    queryFn: () => maintenanceRuleRepository.listByComponent(componentId as string),
    enabled: Boolean(componentId),
  });
}

export function useMaintenanceRule(id: string | undefined) {
  return useQuery({
    queryKey: ruleKey(id ?? ''),
    queryFn: () => maintenanceRuleRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateMaintenanceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewMaintenanceRule) => maintenanceRuleRepository.create(input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: rulesKey(created.componentId) });
    },
  });
}

export function useUpdateMaintenanceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: MaintenanceRuleUpdate }) =>
      maintenanceRuleRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: rulesKey(updated.componentId) });
      queryClient.invalidateQueries({ queryKey: ruleKey(updated.id) });
    },
  });
}

export function useArchiveMaintenanceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: { id: string; componentId: string }) => maintenanceRuleRepository.archive(rule.id),
    onSuccess: (_result, rule) => {
      queryClient.invalidateQueries({ queryKey: rulesKey(rule.componentId) });
      queryClient.invalidateQueries({ queryKey: ruleKey(rule.id) });
    },
  });
}
