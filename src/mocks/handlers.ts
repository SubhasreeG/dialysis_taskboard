import { http, HttpResponse, delay } from "msw";
import type { PatientDTO, TaskDTO } from "../types";
import { addDays, subDays, format } from "date-fns";

const today = new Date();
const fmt = (d: Date) => format(d, "yyyy-MM-dd");
const ts = (d: Date) => d.toISOString();

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const MOCK_PATIENTS: PatientDTO[] = [
  {
    id: "p1",
    name: "Ranjit Kumar",
    date_of_birth: "1955-03-14",
    mrn: "MRD-00421",
    dialysis_start_date: "2021-06-01",
    primary_nurse: "Priya Nair",
    dietician: "Anita Rao",
    social_worker: "Mohammed Salim",
    tags: ["high priority"],
  },
  {
    id: "p2",
    name: "Sulochana Venkat",
    date_of_birth: "1962-11-28",
    mrn: "MRD-00588",
    dialysis_start_date: "2023-01-15",
    primary_nurse: "Priya Nair",
    dietician: "Anitha Rao",
    tags: ["new patient"],
  },
  {
    id: "p3",
    name: "David Raj",
    date_of_birth: "1948-07-04",
    mrn: "MRD-00193",
    dialysis_start_date: "2019-09-20",
    primary_nurse: "Samuel George",
    social_worker: "Mohammed Salim",
  },
  {
    id: "p4",
    name: "Meenakshi Iyer",
    date_of_birth: "1970-02-19",
    mrn: "MRD-00712",
    dialysis_start_date: "2022-11-03",
    primary_nurse: "Samuel George",
    dietician: "Anitha Rao",
  },
  {
    id: "p5",
    name: "Thomas Mathew",
    date_of_birth: "1959-08-30",
    mrn: "MRD-00334",
    dialysis_start_date: "2020-04-10",
    primary_nurse: "Priya Nair",
    social_worker: "Mohammed Salim",
    tags: ["requires transport"],
  },
];

let taskIdCounter = 100;
const genId = () => `t${taskIdCounter++}`;

function makeTask(overrides: Partial<TaskDTO> & Pick<TaskDTO, "patient_id" | "title" | "status" | "assigned_role" | "due_date" | "category">): TaskDTO {
  return {
    id: genId(),
    description: undefined,
    assignee_name: undefined,
    notes: undefined,
    is_recurring: false,
    recurring_interval_days: undefined,
    created_at: ts(subDays(today, 30)),
    updated_at: ts(today),
    ...overrides,
  };
}

// In-memory task store (mutable for PATCH)
let MOCK_TASKS: TaskDTO[] = [
  // ── Patient 1 ──
  makeTask({ patient_id: "p1", title: "Monthly CBC & BMP Labs", category: "lab_work", status: "overdue", assigned_role: "nurse", assignee_name: "Priya Nair", due_date: fmt(subDays(today, 5)), is_recurring: true, recurring_interval_days: 30 }),
  makeTask({ patient_id: "p1", title: "Vascular Access Site Check", category: "access_check", status: "in_progress", assigned_role: "nurse", assignee_name: "Priya Nair", due_date: fmt(today) }),
  makeTask({ patient_id: "p1", title: "Dietary Phosphorus Review", category: "diet_counseling", status: "upcoming", assigned_role: "dietician", assignee_name: "Anitha Rao", due_date: fmt(addDays(today, 3)) }),
  makeTask({ patient_id: "p1", title: "Social Work Check-in", category: "social_work", status: "overdue", assigned_role: "social_worker", assignee_name: "Mohammed Salim", due_date: fmt(subDays(today, 2)) }),
  makeTask({ patient_id: "p1", title: "Hepatitis B Booster", category: "vaccination", status: "upcoming", assigned_role: "nurse", assignee_name: "Priya Nair", due_date: fmt(addDays(today, 14)) }),
  makeTask({ patient_id: "p1", title: "Medication Reconciliation", category: "medication_review", status: "completed", assigned_role: "nurse", assignee_name: "Priya Nair", due_date: fmt(subDays(today, 10)) }),

  // ── Patient 2 ──
  makeTask({ patient_id: "p2", title: "Initial Nutrition Assessment", category: "diet_counseling", status: "overdue", assigned_role: "dietician", assignee_name: "Anitha Rao", due_date: fmt(subDays(today, 1)) }),
  makeTask({ patient_id: "p2", title: "Dialysis Adequacy (Kt/V)", category: "lab_work", status: "in_progress", assigned_role: "nurse", assignee_name: "Priya Nair", due_date: fmt(today), is_recurring: true, recurring_interval_days: 30 }),
  makeTask({ patient_id: "p2", title: "New Patient Orientation", category: "follow_up", status: "completed", assigned_role: "social_worker", due_date: fmt(subDays(today, 7)) }),

  // ── Patient 3 ──
  makeTask({ patient_id: "p3", title: "Iron Studies Panel", category: "lab_work", status: "in_progress", assigned_role: "nurse", assignee_name: "Samuel George", due_date: fmt(today), is_recurring: true, recurring_interval_days: 90 }),
  makeTask({ patient_id: "p3", title: "Transport Assistance Review", category: "social_work", status: "upcoming", assigned_role: "social_worker", assignee_name: "Mohammed Salim", due_date: fmt(addDays(today, 5)) }),
  makeTask({ patient_id: "p3", title: "Blood Pressure Management", category: "follow_up", status: "overdue", assigned_role: "nurse", assignee_name: "Samuel George", due_date: fmt(subDays(today, 3)) }),

  // ── Patient 4 ──
  makeTask({ patient_id: "p4", title: "Calcium-Phosphorus Ratio Review", category: "diet_counseling", status: "upcoming", assigned_role: "dietician", assignee_name: "Anitha Rao", due_date: fmt(addDays(today, 7)), is_recurring: true, recurring_interval_days: 30 }),
  makeTask({ patient_id: "p4", title: "Fistula Maturity Assessment", category: "access_check", status: "in_progress", assigned_role: "nurse", assignee_name: "Samuel George", due_date: fmt(today) }),
  makeTask({ patient_id: "p4", title: "Flu Vaccination", category: "vaccination", status: "completed", assigned_role: "nurse", due_date: fmt(subDays(today, 20)) }),

  // ── Patient 5 ──
  makeTask({ patient_id: "p5", title: "PTH & Vitamin D Levels", category: "lab_work", status: "overdue", assigned_role: "nurse", assignee_name: "Priya Nair", due_date: fmt(subDays(today, 4)), is_recurring: true, recurring_interval_days: 90 }),
  makeTask({ patient_id: "p5", title: "Housing Stability Follow-up", category: "social_work", status: "upcoming", assigned_role: "social_worker", assignee_name: "Mohammed Salim", due_date: fmt(addDays(today, 10)) }),
  makeTask({ patient_id: "p5", title: "Protein Intake Counseling", category: "diet_counseling", status: "upcoming", assigned_role: "dietician", assignee_name: "Anitha Rao", due_date: fmt(addDays(today, 6)) }),
];

// ─── Simulate intermittent network failure (5% chance) ───────────────────────
function maybeNetworkError() {
  if (Math.random() < 0.05) {
    throw new Error("Simulated network error");
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  http.get("/patients", async () => {
    await delay(250);
    try {
      maybeNetworkError();
      return HttpResponse.json({ data: MOCK_PATIENTS });
    } catch {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  }),

  http.get("/patients/:patientId/tasks", async ({ params }) => {
    await delay(200);
    try {
      maybeNetworkError();
      const tasks = MOCK_TASKS.filter((t) => t.patient_id === params.patientId);
      return HttpResponse.json({ data: tasks });
    } catch {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  }),

  http.post("/patients/:patientId/tasks", async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as Record<string, unknown>;
    const newTask: TaskDTO = {
      id: genId(),
      patient_id: params.patientId as string,
      title: String(body.title ?? "Untitled Task"),
      description: body.description as string | undefined,
      category: (body.category as TaskDTO["category"]) ?? "other",
      status: "upcoming",
      assigned_role: (body.assigned_role as TaskDTO["assigned_role"]) ?? "nurse",
      assignee_name: body.assignee_name as string | undefined,
      due_date: String(body.due_date ?? fmt(addDays(today, 7))),
      notes: body.notes as string | undefined,
      is_recurring: Boolean(body.is_recurring),
      recurring_interval_days: body.recurring_interval_days as number | undefined,
      created_at: ts(today),
      updated_at: ts(today),
    };
    MOCK_TASKS.push(newTask);
    return HttpResponse.json({ data: newTask }, { status: 201 });
  }),

  http.patch("/tasks/:taskId", async ({ params, request }) => {
    await delay(250);
    // Simulate a 10% server error to demonstrate rollback
    if (Math.random() < 0.10) {
      return HttpResponse.json({ message: "Server error" }, { status: 500 });
    }
    const body = await request.json() as Record<string, unknown>;
    const idx = MOCK_TASKS.findIndex((t) => t.id === params.taskId);
    if (idx === -1) {
      return HttpResponse.json({ message: "Task not found" }, { status: 404 });
    }
    MOCK_TASKS[idx] = {
      ...MOCK_TASKS[idx],
      ...body,
      updated_at: ts(today),
    };
    return HttpResponse.json({ data: MOCK_TASKS[idx] });
  }),
];
