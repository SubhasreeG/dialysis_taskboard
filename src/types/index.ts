// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Role = "nurse" | "dietician" | "social_worker";

export type TaskStatus = "overdue" | "in_progress" | "completed" | "upcoming";

export type TaskCategory =
  | "lab_work"
  | "access_check"
  | "diet_counseling"
  | "vaccination"
  | "social_work"
  | "medication_review"
  | "follow_up"
  | "other";

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date string
  mrn: string; // Medical Record Number
  dialysisStartDate: string; // ISO date string
  primaryNurse: string;
  dietician?: string;
  socialWorker?: string;
  tags?: string[]; // e.g. ["high-priority", "new-patient"]
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  assignedRole: Role;
  assigneeName?: string;
  dueDate: string; // ISO date string
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  notes?: string;
  isRecurring: boolean;
  recurringIntervalDays?: number; // e.g. 30 for monthly
}

// ─── DTOs (what the API sends / receives) ────────────────────────────────────

/** What we receive from GET /patients */
export interface PatientDTO {
  id: string;
  name: string;
  date_of_birth: string;
  mrn: string;
  dialysis_start_date: string;
  primary_nurse: string;
  dietician?: string;
  social_worker?: string;
  tags?: string[];
}

/** What we receive from GET /patients/:id/tasks */
export interface TaskDTO {
  id: string;
  patient_id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  assigned_role: Role;
  assignee_name?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  is_recurring: boolean;
  recurring_interval_days?: number;
}

/** Body for POST /patients/:id/tasks */
export interface CreateTaskPayload {
  title: string;
  description?: string;
  category: TaskCategory;
  assigned_role: Role;
  assignee_name?: string;
  due_date: string;
  notes?: string;
  is_recurring: boolean;
  recurring_interval_days?: number;
}

/** Body for PATCH /tasks/:id */
export interface UpdateTaskPayload {
  status?: TaskStatus;
  assignee_name?: string;
  due_date?: string;
  notes?: string;
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export interface FilterState {
  role: Role | "all";
  timeFilter: "all" | "overdue" | "due_today" | "upcoming";
  searchQuery: string;
}

export interface OptimisticUpdate {
  taskId: string;
  previousTask: Task;
  pendingTask: Task;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}
