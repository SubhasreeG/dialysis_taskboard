import React from "react";
import type { Task } from "../../types";
import { STATUS_LABELS } from "../../utils/filters";

interface Props {
  status: Task["status"];
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = "" }) => {
  return (
    <span className={`status-badge status-badge--${status} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
};
