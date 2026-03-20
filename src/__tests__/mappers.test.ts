import { mapPatient, mapTask, safeMapTasks, safeMapPatients } from "../utils/mappers";
import type { PatientDTO, TaskDTO } from "../types";

const validTaskDTO: TaskDTO = {
  id: "t1",
  patient_id: "p1",
  title: "Monthly Labs",
  category: "lab_work",
  status: "upcoming",
  assigned_role: "nurse",
  due_date: "2025-07-15",
  created_at: "2025-06-01T10:00:00Z",
  updated_at: "2025-06-01T10:00:00Z",
  is_recurring: true,
  recurring_interval_days: 30,
};

const validPatientDTO: PatientDTO = {
  id: "p1",
  name: "Ranjit Kumar",
  date_of_birth: "1955-03-14",
  mrn: "MRN-00421",
  dialysis_start_date: "2021-06-01",
  primary_nurse: "Priya Nair",
};

// ─── mapTask ──────────────────────────────────────────────────────────────────

describe("mapTask", () => {
  it("maps snake_case DTO fields to camelCase domain model", () => {
    const task = mapTask(validTaskDTO);
    expect(task.id).toBe("t1");
    expect(task.patientId).toBe("p1");
    expect(task.assignedRole).toBe("nurse");
    expect(task.dueDate).toBe("2025-07-15");
    expect(task.isRecurring).toBe(true);
    expect(task.recurringIntervalDays).toBe(30);
  });

  it("sets optional fields to undefined when absent from DTO", () => {
    const task = mapTask({ ...validTaskDTO, assignee_name: undefined, notes: undefined });
    expect(task.assigneeName).toBeUndefined();
    expect(task.notes).toBeUndefined();
  });
});

// ─── mapPatient ───────────────────────────────────────────────────────────────

describe("mapPatient", () => {
  it("maps patient DTO correctly", () => {
    const patient = mapPatient(validPatientDTO);
    expect(patient.id).toBe("p1");
    expect(patient.name).toBe("Ranjit Kumar");
    expect(patient.primaryNurse).toBe("Priya Nair");
    expect(patient.tags).toEqual([]);
  });

  it("preserves optional dietician and social_worker fields", () => {
    const dto = { ...validPatientDTO, dietician: "Anitha Rao", social_worker: "Salim" };
    const patient = mapPatient(dto);
    expect(patient.dietician).toBe("Anitha Rao");
    expect(patient.socialWorker).toBe("Salim");
  });
});

// ─── safeMapTasks ─────────────────────────────────────────────────────────────

describe("safeMapTasks", () => {
  it("maps an array of valid DTOs", () => {
    const tasks = safeMapTasks([validTaskDTO]);
    expect(tasks).toHaveLength(1);
  });

  it("skips malformed entries without throwing", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const tasks = safeMapTasks([
      validTaskDTO,
      { broken: true },         // missing required fields
      null,                      // null entry
      { id: "t2" },              // missing patient_id, title, etc.
    ] as unknown[]);

    expect(tasks).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns empty array for empty input", () => {
    expect(safeMapTasks([])).toEqual([]);
  });
});

// ─── safeMapPatients ──────────────────────────────────────────────────────────

describe("safeMapPatients", () => {
  it("skips invalid entries gracefully", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const patients = safeMapPatients([
      validPatientDTO,
      { id: 123 },  // id is not a string
    ] as unknown[]);

    expect(patients).toHaveLength(1);
    consoleSpy.mockRestore();
  });
});
