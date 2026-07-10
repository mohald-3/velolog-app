import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BikeUpdate, NewBike } from '../../../domain/types';
import { bikeRepository } from '../../../data/repositories/bikeRepository';

const bikesKey = ['bikes'] as const;
const bikeKey = (id: string) => ['bikes', id] as const;

export function useBikes() {
  return useQuery({
    queryKey: bikesKey,
    queryFn: () => bikeRepository.list(),
  });
}

export function useBike(id: string | undefined) {
  return useQuery({
    queryKey: bikeKey(id ?? ''),
    queryFn: () => bikeRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateBike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewBike) => bikeRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bikesKey });
    },
  });
}

export function useUpdateBike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: BikeUpdate }) =>
      bikeRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: bikesKey });
      queryClient.invalidateQueries({ queryKey: bikeKey(updated.id) });
    },
  });
}

export function useArchiveBike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bikeRepository.archive(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: bikesKey });
      queryClient.invalidateQueries({ queryKey: bikeKey(id) });
    },
  });
}
