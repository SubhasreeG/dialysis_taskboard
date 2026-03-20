import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { fetchPatients, fetchTasksForPatient, createTask, updateTask } from "../api/client";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "../types";
import { toast } from "../utils/toast";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  patients: ["patients"] as const,
  tasks: (patientId: string) => ["tasks", patientId] as const,
  allTasks: ["tasks"] as const,
};

// ─── Patients ─────────────────────────────────────────────────────────────────

export function usePatients() {
  return useQuery({
    queryKey: queryKeys.patients,
    queryFn: fetchPatients,
    staleTime: 5 * 60 * 1000, // 5 minutes — patient list changes rarely
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

// ─── Tasks per patient ────────────────────────────────────────────────────────

export function useTasks(
  patientId: string,
  options?: Partial<UseQueryOptions<Task[]>>
) {
  return useQuery({
    queryKey: queryKeys.tasks(patientId),
    queryFn: () => fetchTasksForPatient(patientId),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
    ...options,
  });
}

// ─── Create Task ──────────────────────────────────────────────────────────────

export function useCreateTask(patientId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(patientId, payload),
    onSuccess: (newTask) => {
      // Append to the cached list optimistically
      qc.setQueryData<Task[]>(queryKeys.tasks(patientId), (old) =>
        old ? [...old, newTask] : [newTask]
      );
      toast.success("Task created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

// ─── Update Task (with optimistic update + rollback) ─────────────────────────

export function useUpdateTask(patientId: string) {
  const qc = useQueryClient();
  const queryKey = queryKeys.tasks(patientId);

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) =>
      updateTask(taskId, payload),

    onMutate: async ({ taskId, payload }) => {
      // Cancel outgoing refetches so they don't overwrite the optimistic update
      await qc.cancelQueries({ queryKey });

      // Snapshot previous value for rollback
      const previousTasks = qc.getQueryData<Task[]>(queryKey);

      // Optimistically update
      qc.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((t) =>
          t.id === taskId
            ? { ...t, ...payload, updatedAt: new Date().toISOString() }
            : t
        ) ?? []
      );

      return { previousTasks };
    },

    onError: (error: Error, _vars, context) => {
      // Roll back to snapshot
      if (context?.previousTasks) {
        qc.setQueryData(queryKey, context.previousTasks);
      }
      toast.error(`Update failed — changes rolled back. ${error.message}`);
    },

    onSettled: () => {
      // Always refetch to ensure server-client sync
      qc.invalidateQueries({ queryKey });
    },
  });
}
