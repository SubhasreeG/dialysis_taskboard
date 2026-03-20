import type { Patient, PatientDTO, Task, TaskDTO } from "../types";

export function mapPatient(dto: PatientDTO): Patient {
  return {
    id: dto.id,
    name: dto.name,
    dateOfBirth: dto.date_of_birth,
    mrn: dto.mrn,
    dialysisStartDate: dto.dialysis_start_date,
    primaryNurse: dto.primary_nurse,
    dietician: dto.dietician,
    socialWorker: dto.social_worker,
    tags: dto.tags ?? [],
  };
}

export function mapTask(dto: TaskDTO): Task {
  return {
    id: dto.id,
    patientId: dto.patient_id,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    status: dto.status,
    assignedRole: dto.assigned_role,
    assigneeName: dto.assignee_name,
    dueDate: dto.due_date,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    notes: dto.notes,
    isRecurring: dto.is_recurring,
    recurringIntervalDays: dto.recurring_interval_days,
  };
}

/**
 * Safely maps an array of DTOs, skipping malformed entries and logging them.
 * This is the key resilience point — the backend may return unexpected shapes.
 */
export function safeMapTasks(raw: unknown[]): Task[] {
  return raw.reduce<Task[]>((acc, item) => {
    try {
      if (!isTaskDTO(item)) {
        console.warn("[TaskMapper] Skipping malformed task DTO:", item);
        return acc;
      }
      acc.push(mapTask(item));
    } catch (e) {
      console.error("[TaskMapper] Failed to map task:", item, e);
    }
    return acc;
  }, []);
}

export function safeMapPatients(raw: unknown[]): Patient[] {
  return raw.reduce<Patient[]>((acc, item) => {
    try {
      if (!isPatientDTO(item)) {
        console.warn("[PatientMapper] Skipping malformed patient DTO:", item);
        return acc;
      }
      acc.push(mapPatient(item));
    } catch (e) {
      console.error("[PatientMapper] Failed to map patient:", item, e);
    }
    return acc;
  }, []);
}

// ─── Runtime type guards ──────────────────────────────────────────────────────

function isTaskDTO(v: unknown): v is TaskDTO {
  if (typeof v !== "object" || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.patient_id === "string" &&
    typeof t.title === "string" &&
    typeof t.status === "string" &&
    typeof t.assigned_role === "string" &&
    typeof t.due_date === "string"
  );
}

function isPatientDTO(v: unknown): v is PatientDTO {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.mrn === "string"
  );
}
