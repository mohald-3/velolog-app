import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { maintenanceRecordRepository } from '../../../data/repositories/maintenanceRecordRepository';
import type { MaintenanceRule } from '../../../domain/types';

const recordsKey = (componentId: string) => ['components', componentId, 'maintenanceRecords'] as const;
const rulesKey = (componentId: string) => ['components', componentId, 'maintenanceRules'] as const;
const ruleKey = (id: string) => ['maintenanceRules', id] as const;

export function useMaintenanceRecords(componentId: string | undefined) {
  return useQuery({
    queryKey: recordsKey(componentId ?? ''),
    queryFn: () => maintenanceRecordRepository.listByComponent(componentId as string),
    enabled: Boolean(componentId),
  });
}

interface MarkRuleAsDoneInput {
  rule: MaintenanceRule;
  currentOdometerM: number;
  cost?: number | null;
  notes?: string | null;
}

/** Creates a MaintenanceRecord for the rule's action and resets the rule's counter to the
 * bike's current odometer — the rule is immediately back to OK. Record + reset run as a single
 * transaction in the repository. */
export function useMarkRuleAsDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rule, currentOdometerM, cost, notes }: MarkRuleAsDoneInput) =>
      maintenanceRecordRepository.markRuleAsDone({
        rule,
        performedAtOdometerM: currentOdometerM,
        cost,
        notes,
      }),
    onSuccess: (updatedRule) => {
      queryClient.invalidateQueries({ queryKey: recordsKey(updatedRule.componentId) });
      queryClient.invalidateQueries({ queryKey: rulesKey(updatedRule.componentId) });
      queryClient.invalidateQueries({ queryKey: ruleKey(updatedRule.id) });
    },
  });
}
