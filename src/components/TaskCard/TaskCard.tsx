import React from "react";
import { format, parseISO } from "date-fns";
import type { Task } from "../../types";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import { CATEGORY_LABELS, ROLE_LABELS, deriveTaskStatus } from "../../utils/filters";
import { useUpdateTask } from "../../hooks/useTasks";

interface Props {
  task: Task;
  patientId: string;
}

export const TaskCard: React.FC<Props> = ({ task, patientId }) => {
  const { mutate: updateTask, isPending } = useUpdateTask(patientId);
  const derivedStatus = deriveTaskStatus(task);

  const handleStatusCycle = () => {
    if (isPending) return;
    const next: Task["status"] =
      task.status === "upcoming"
        ? "in_progress"
        : task.status === "in_progress"
        ? "completed"
        : task.status === "overdue"
        ? "in_progress"
        : "upcoming";
    updateTask({ taskId: task.id, payload: { status: next } });
  };

  return (
    <div
      className={`task-card task-card--${derivedStatus} ${isPending ? "task-card--pending" : ""}`}
      data-testid={`task-card-${task.id}`}
    >
      <div className="task-card__header">
        <div className="task-card__title-group">
          <span className="task-card__title" title={CATEGORY_LABELS[task.category]}>
            {task.title}
          </span>
          {task.isRecurring && (
            <span className="task-card__recurring" title="Recurring task">↻</span>
          )}
        </div>
        <StatusBadge status={derivedStatus} />
      </div>

      <div className="task-card__meta">
        <span className="task-card__role">{ROLE_LABELS[task.assignedRole]}</span>
        {task.assigneeName && (
          <>
            <span className="task-card__dot">·</span>
            <span className="task-card__assignee">{task.assigneeName}</span>
          </>
        )}
      </div>

      <div className="task-card__footer">
        <span className={`task-card__due ${derivedStatus === "overdue" ? "task-card__due--overdue" : ""}`}>
          Due {format(parseISO(task.dueDate), "MMM d")}
        </span>
        <button
          className={`task-card__action ${isPending ? "task-card__action--loading" : ""}`}
          onClick={handleStatusCycle}
          disabled={isPending || task.status === "completed"}
          title={task.status === "completed" ? "Task complete" : "Advance status"}
        >
          {isPending ? "···" : task.status === "completed" ? "✓" : "→"}
        </button>
      </div>
    </div>
  );
};