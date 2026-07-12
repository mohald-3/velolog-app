import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppSettingsUpdate } from '../../../domain/types';
import { appSettingsRepository } from '../../../data/repositories/appSettingsRepository';

const settingsKey = ['app-settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => appSettingsRepository.get(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: AppSettingsUpdate) => appSettingsRepository.update(changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKey });
    },
  });
}
