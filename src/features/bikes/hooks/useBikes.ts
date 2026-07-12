import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BikeUpdate, NewBike } from '../../../domain/types';
import { bikeRepository } from '../../../data/repositories/bikeRepository';
import { queryKeys } from '../../queryKeys';

export function useBikes() {
  return useQuery({
    queryKey: queryKeys.bikes,
    queryFn: () => bikeRepository.list(),
  });
}

export function useBike(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bike(id ?? ''),
    queryFn: () => bikeRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateBike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBike) => bikeRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bikes });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useUpdateBike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: BikeUpdate }) =>
      bikeRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bikes });
      queryClient.invalidateQueries({ queryKey: queryKeys.bike(updated.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}

export function useArchiveBike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bikeRepository.archive(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bikes });
      queryClient.invalidateQueries({ queryKey: queryKeys.bike(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
    },
  });
}
