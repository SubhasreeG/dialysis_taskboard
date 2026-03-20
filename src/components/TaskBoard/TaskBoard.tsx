import React, { useMemo } from "react";
import { usePatients } from "../../hooks/useTasks";
import { useFilters } from "../../hooks/useFilters";
import { FilterBar } from "../FilterBar/FilterBar";
import { PatientRow } from "../PatientRow/PatientRow";

// We compute the task summary across all loaded tasks via React Query cache
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../hooks/useTasks";
import type { Task } from "../../types";
import { deriveTaskStatus } from "../../utils/filters";

export const TaskBoard: React.FC = () => {
  const { data: patients, isLoading, isError, error, refetch } = usePatients();
  const { filters, setRole, setTimeFilter, setSearchQuery, resetFilters, hasActiveFilters } =
    useFilters();
  const qc = useQueryClient();

  // Aggregate stats across all patients from cached task data
  const taskSummary = useMemo(() => {
    const summary = { overdue: 0, inProgress: 0, upcoming: 0, completed: 0 };
    if (!patients) return summary;
    for (const p of patients) {
      const tasks = qc.getQueryData<Task[]>(queryKeys.tasks(p.id)) ?? [];
      for (const t of tasks) {
        const s = deriveTaskStatus(t);
        if (s === "overdue") summary.overdue++;
        else if (s === "in_progress") summary.inProgress++;
        else if (s === "upcoming") summary.upcoming++;
        else if (s === "completed") summary.completed++;
      }
    }
    return summary;
  }, [patients, qc]);

  if (isLoading) {
    return (
      <div className="board-loading">
        <div className="spinner" />
        <p>Loading patient list…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="board-error">
        <div className="board-error__icon">⚠</div>
        <h2>Unable to load patients</h2>
        <p>{(error as Error)?.message ?? "An unknown error occurred."}</p>
        <button className="btn btn--primary" onClick={() => refetch()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="taskboard">
      <FilterBar
        filters={filters}
        onRoleChange={setRole}
        onTimeFilterChange={setTimeFilter}
        onSearchChange={setSearchQuery}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        taskSummary={taskSummary}
      />

      <div className="taskboard__body">
        {patients && patients.length === 0 && (
          <div className="board-empty">
            <p>No patients found.</p>
          </div>
        )}
        {patients?.map((patient) => (
          <PatientRow key={patient.id} patient={patient} filters={filters} />
        ))}
      </div>
    </div>
  );
};
