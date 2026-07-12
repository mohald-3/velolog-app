import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppSettingsUpdate } from '../../../domain/types';
import { appSettingsRepository } from '../../../data/repositories/appSettingsRepository';
import { queryKeys } from '../../queryKeys';

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.appSettings,
    queryFn: () => appSettingsRepository.get(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: AppSettingsUpdate) => appSettingsRepository.update(changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appSettings });
    },
  });
}
