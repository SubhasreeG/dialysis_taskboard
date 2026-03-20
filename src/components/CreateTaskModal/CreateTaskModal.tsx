import React, { useState } from "react";
import { format, addDays } from "date-fns";
import type { CreateTaskPayload, TaskCategory, Role } from "../../types";
import { useCreateTask } from "../../hooks/useTasks";
import { CATEGORY_LABELS, ROLE_LABELS } from "../../utils/filters";

interface Props {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

const ROLES: Role[] = ["nurse", "dietician", "social_worker"];
const CATEGORIES: TaskCategory[] = [
  "lab_work", "access_check", "diet_counseling", "vaccination",
  "social_work", "medication_review", "follow_up", "other",
];

export const CreateTaskModal: React.FC<Props> = ({ patientId, patientName, onClose }) => {
  const { mutate: createTask, isPending } = useCreateTask(patientId);

  const [form, setForm] = useState<CreateTaskPayload>({
    title: "",
    category: "follow_up",
    assigned_role: "nurse",
    due_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    is_recurring: false,
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CreateTaskPayload>(key: K, value: CreateTaskPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }
    setError(null);
    createTask(form, {
      onSuccess: onClose,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">New Task</h2>
          <p className="modal__subtitle">for {patientName}</p>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__body">
          <label className="field">
            <span className="field__label">Title *</span>
            <input
              className="field__input"
              placeholder="e.g. Monthly CBC Labs"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              autoFocus
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Category</span>
              <select
                className="field__input"
                value={form.category}
                onChange={(e) => set("category", e.target.value as TaskCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Assigned Role</span>
              <select
                className="field__input"
                value={form.assigned_role}
                onChange={(e) => set("assigned_role", e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Assignee Name</span>
              <input
                className="field__input"
                placeholder="Optional"
                value={form.assignee_name ?? ""}
                onChange={(e) => set("assignee_name", e.target.value || undefined)}
              />
            </label>

            <label className="field">
              <span className="field__label">Due Date</span>
              <input
                className="field__input"
                type="date"
                value={form.due_date}
                onChange={(e) => set("due_date", e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Notes</span>
            <textarea
              className="field__input field__input--textarea"
              placeholder="Optional context..."
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value || undefined)}
              rows={3}
            />
          </label>

          <label className="field field--checkbox">
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(e) => set("is_recurring", e.target.checked)}
            />
            <span className="field__label">Recurring task</span>
            {form.is_recurring && (
              <input
                className="field__input field__input--small"
                type="number"
                min={1}
                placeholder="Every N days"
                value={form.recurring_interval_days ?? ""}
                onChange={(e) =>
                  set("recurring_interval_days", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            )}
          </label>

          {error && <p className="modal__error">{error}</p>}
        </div>

        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Creating…" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
};
