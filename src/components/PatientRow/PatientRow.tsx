import React, { useState } from "react";
import type { Patient, Task, FilterState } from "../../types";
import { TaskCard } from "../TaskCard/TaskCard";
import { CreateTaskModal } from "../CreateTaskModal/CreateTaskModal";
import { useTasks } from "../../hooks/useTasks";
import {
  applyFilters,
  groupTasksByStatus,
  STATUS_LABELS,
  computeRiskScore,
  getRiskLevel,
  RISK_LABELS,
  RISK_COLORS,
} from "../../utils/filters";

interface Props {
  patient: Patient;
  filters: FilterState;
}

function RiskRing({ score, level }: { score: number; level: string }) {
  const color = RISK_COLORS[level];
  const max = 30;
  const clamped = Math.min(score, max);
  const pct = clamped / max;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="risk-ring" title={`Risk Score: ${score} — ${RISK_LABELS[level]}`}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        {/* Background track */}
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth="3"
        />
        {/* Filled arc */}
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span className="risk-ring__score" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export const PatientRow: React.FC<Props> = ({ patient, filters }) => {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const { data: tasks, isLoading, isError, error, refetch } = useTasks(patient.id);

  const filteredTasks = tasks ? applyFilters(tasks, filters) : [];
  const grouped = groupTasksByStatus(filteredTasks);
  const statusOrder: Task["status"][] = ["overdue", "in_progress", "upcoming", "completed"];

  const totalOverdue = tasks?.filter((t) => t.status === "overdue").length ?? 0;
  const riskScore = tasks ? computeRiskScore(tasks) : 0;
  const riskLevel = getRiskLevel(riskScore);

  return (
    <div className={`patient-row patient-row--${riskLevel} ${!expanded ? "patient-row--collapsed" : ""}`}>
      <div className="patient-row__header">
        <button
          className="patient-row__toggle"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <span className={`chevron ${expanded ? "chevron--down" : ""}`}>›</span>
        </button>

        <RiskRing score={riskScore} level={riskLevel} />

        <div className="patient-row__info">
          <h3 className="patient-row__name">{patient.name}</h3>
          <span className="patient-row__mrn">{patient.mrn}</span>
          <span
            className="patient-row__risk-label"
            style={{ color: RISK_COLORS[riskLevel] }}
          >
            {RISK_LABELS[riskLevel]} Risk
          </span>
          {patient.tags?.map((tag) => (
            <span key={tag} className="patient-row__tag">{tag}</span>
          ))}
        </div>

        <div className="patient-row__counts">
          {isLoading && <span className="loading-dots">Loading</span>}
          {!isLoading && (
            <>
              {totalOverdue > 0 && (
                <span className="count-badge count-badge--overdue">{totalOverdue} overdue</span>
              )}
              <span className="count-badge count-badge--total">
                {tasks?.length ?? 0} tasks
              </span>
            </>
          )}
        </div>

        <button
          className="btn btn--small btn--add"
          onClick={() => setShowModal(true)}
          title="Add task"
        >
          + Add Task
        </button>
      </div>

      {expanded && (
        <div className="patient-row__body">
          {isError && (
            <div className="inline-error">
              <span>Failed to load tasks — {(error as Error)?.message}</span>
              <button className="btn btn--ghost btn--small" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          )}

          {isLoading && (
            <div className="task-skeleton-row">
              {[1, 2, 3].map((i) => (
                <div key={i} className="task-skeleton" />
              ))}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="task-columns">
              {statusOrder.map((status) => {
                const colTasks = grouped[status];
                return (
                  <div key={status} className={`task-col task-col--${status}`}>
                    <div className="task-col__header">
                      <span className="task-col__label">{STATUS_LABELS[status]}</span>
                      <span className="task-col__count">{colTasks.length}</span>
                    </div>
                    <div className="task-col__cards">
                      {colTasks.length === 0 ? (
                        <div className="task-col__empty">—</div>
                      ) : (
                        colTasks.map((task) => (
                          <TaskCard key={task.id} task={task} patientId={patient.id} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && !isError && filteredTasks.length === 0 && tasks && tasks.length > 0 && (
            <p className="no-results">No tasks match your current filters.</p>
          )}
        </div>
      )}

      {showModal && (
        <CreateTaskModal
          patientId={patient.id}
          patientName={patient.name}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};