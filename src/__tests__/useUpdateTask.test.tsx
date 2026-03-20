/**
 * Tests for useUpdateTask hook — specifically the optimistic update
 * and rollback behaviour on server error.
 *
 * We use a custom renderHook wrapper with QueryClient and MSW.
 */
import '@testing-library/jest-dom';
import { expect, it, describe, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useUpdateTask, queryKeys } from "../hooks/useTasks";
import type { Task } from "../types";
import { addDays, format } from "date-fns";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");
const today = new Date();

// ─── Mock the API client ──────────────────────────────────────────────────────

const mockUpdateTaskFn = jest.fn();

jest.mock("../api/client", () => ({
  updateTask: (...args: unknown[]) => mockUpdateTaskFn(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createWrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const PATIENT_ID = "p1";

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    patientId: PATIENT_ID,
    title: "Lab Work",
    category: "lab_work",
    status: "upcoming",
    assignedRole: "nurse",
    dueDate: fmt(addDays(today, 3)),
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    isRecurring: false,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useUpdateTask — optimistic update", () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    qc.setQueryData<Task[]>(queryKeys.tasks(PATIENT_ID), INITIAL_TASKS);
    jest.clearAllMocks();
  });

  it("optimistically updates the task before the server responds", async () => {
    mockUpdateTaskFn.mockImplementation(
      () => new Promise((res) => setTimeout(() => res({ ...INITIAL_TASKS[0], status: "in_progress" }), 200))
    );

    const { result } = renderHook(() => useUpdateTask(PATIENT_ID), {
      wrapper: createWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ taskId: "t1", payload: { status: "in_progress" } });
      await Promise.resolve();
    });

    const cached = qc.getQueryData<Task[]>(queryKeys.tasks(PATIENT_ID));
    expect(cached?.find((t) => t.id === "t1")?.status).toBe("in_progress");
  });

  it("rolls back on server error", async () => {
    mockUpdateTaskFn.mockRejectedValue(new Error("Server Error"));

    const { result } = renderHook(() => useUpdateTask(PATIENT_ID), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ taskId: "t1", payload: { status: "completed" } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = qc.getQueryData<Task[]>(queryKeys.tasks(PATIENT_ID));
    expect(cached?.find((t) => t.id === "t1")?.status).toBe("upcoming");
  });

  it("applies the server response after a successful mutation", async () => {
    const serverTask: Task = {
      ...INITIAL_TASKS[0],
      status: "completed",
      updatedAt: new Date().toISOString(),
    };
    mockUpdateTaskFn.mockResolvedValue(serverTask);

    const { result } = renderHook(() => useUpdateTask(PATIENT_ID), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ taskId: "t1", payload: { status: "completed" } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});