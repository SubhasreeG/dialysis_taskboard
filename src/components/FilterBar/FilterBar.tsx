import React from "react";
import type { FilterState } from "../../types";

interface Props {
  filters: FilterState;
  onRoleChange: (role: FilterState["role"]) => void;
  onTimeFilterChange: (t: FilterState["timeFilter"]) => void;
  onSearchChange: (q: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  taskSummary: { overdue: number; inProgress: number; upcoming: number; completed: number };
}

const ROLES: { value: FilterState["role"]; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "nurse", label: "Nurse" },
  { value: "dietician", label: "Dietician" },
  { value: "social_worker", label: "Social Worker" },
];

const TIME_FILTERS: { value: FilterState["timeFilter"]; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "overdue", label: "Overdue" },
  { value: "due_today", label: "Due Today" },
  { value: "upcoming", label: "Upcoming" },
];

export const FilterBar: React.FC<Props> = ({
  filters,
  onRoleChange,
  onTimeFilterChange,
  onSearchChange,
  onReset,
  hasActiveFilters,
  taskSummary,
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-bar__stats">
        <span className="stat stat--overdue">
          <span className="stat__num">{taskSummary.overdue}</span>
          <span className="stat__label">Overdue</span>
        </span>
        <span className="stat stat--progress">
          <span className="stat__num">{taskSummary.inProgress}</span>
          <span className="stat__label">Today</span>
        </span>
        <span className="stat stat--upcoming">
          <span className="stat__num">{taskSummary.upcoming}</span>
          <span className="stat__label">Upcoming</span>
        </span>
        <span className="stat stat--done">
          <span className="stat__num">{taskSummary.completed}</span>
          <span className="stat__label">Done</span>
        </span>
      </div>

      <div className="filter-bar__controls">
        <div className="filter-group">
          {ROLES.map((r) => (
            <button
              key={r.value}
              className={`filter-pill ${filters.role === r.value ? "filter-pill--active" : ""}`}
              onClick={() => onRoleChange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="filter-group">
          {TIME_FILTERS.map((t) => (
            <button
              key={t.value}
              className={`filter-pill ${filters.timeFilter === t.value ? "filter-pill--active" : ""}`}
              onClick={() => onTimeFilterChange(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="filter-search">
          <input
            className="search-input"
            type="search"
            placeholder="Search tasks, assignees…"
            value={filters.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tasks"
          />
          {hasActiveFilters && (
            <button className="btn-reset" onClick={onReset} title="Clear filters">
              ✕ Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
