import { applyFilters, deriveTaskStatus, groupTasksByStatus } from "../utils/filters";
import type { Task, FilterState } from "../types";
import { addDays, subDays, format } from "date-fns";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");
const today = new Date();

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    patientId: "p1",
    title: "Test Task",
    category: "lab_work",
    status: "upcoming",
    assignedRole: "nurse",
    dueDate: fmt(addDays(today, 7)),
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    isRecurring: false,
    ...overrides,
  };
}

const DEFAULT_FILTERS: FilterState = {
  role: "all",
  timeFilter: "all",
  searchQuery: "",
};

// ─── deriveTaskStatus ─────────────────────────────────────────────────────────

describe("deriveTaskStatus", () => {
  it("returns 'completed' for completed tasks regardless of due date", () => {
    const task = makeTask({ status: "completed", dueDate: fmt(subDays(today, 10)) });
    expect(deriveTaskStatus(task)).toBe("completed");
  });

  it("returns 'overdue' when due date is in the past", () => {
    const task = makeTask({ status: "upcoming", dueDate: fmt(subDays(today, 3)) });
    expect(deriveTaskStatus(task)).toBe("overdue");
  });

  it("returns 'in_progress' when due today", () => {
    const task = makeTask({ status: "upcoming", dueDate: fmt(today) });
    expect(deriveTaskStatus(task)).toBe("in_progress");
  });

  it("returns 'upcoming' when due in the future", () => {
    const task = makeTask({ status: "upcoming", dueDate: fmt(addDays(today, 5)) });
    expect(deriveTaskStatus(task)).toBe("upcoming");
  });

  it("returns 'in_progress' for in_progress tasks with future due date", () => {
    const task = makeTask({ status: "in_progress", dueDate: fmt(addDays(today, 2)) });
    expect(deriveTaskStatus(task)).toBe("in_progress");
  });
});

// ─── applyFilters ─────────────────────────────────────────────────────────────

describe("applyFilters", () => {
  const tasks: Task[] = [
    makeTask({ id: "t1", assignedRole: "nurse",        dueDate: fmt(subDays(today, 2)), title: "Blood Draw" }),
    makeTask({ id: "t2", assignedRole: "dietician",    dueDate: fmt(addDays(today, 5)), title: "Diet Review" }),
    makeTask({ id: "t3", assignedRole: "social_worker",dueDate: fmt(today),             title: "Housing Check", assigneeName: "Salim" }),
    makeTask({ id: "t4", assignedRole: "nurse",        dueDate: fmt(addDays(today, 3)), title: "Vaccine", status: "completed" }),
  ];

  it("returns all tasks when no filters applied", () => {
    expect(applyFilters(tasks, DEFAULT_FILTERS)).toHaveLength(4);
  });

  it("filters by role correctly", () => {
    const result = applyFilters(tasks, { ...DEFAULT_FILTERS, role: "nurse" });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.assignedRole === "nurse")).toBe(true);
  });

  it("filters overdue tasks by timeFilter", () => {
    const result = applyFilters(tasks, { ...DEFAULT_FILTERS, timeFilter: "overdue" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t1");
  });

  it("filters due-today tasks by timeFilter", () => {
    const result = applyFilters(tasks, { ...DEFAULT_FILTERS, timeFilter: "due_today" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t3");
  });

  it("filters by search query matching title", () => {
    const result = applyFilters(tasks, { ...DEFAULT_FILTERS, searchQuery: "diet" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t2");
  });

  it("filters by search query matching assignee name", () => {
    const result = applyFilters(tasks, { ...DEFAULT_FILTERS, searchQuery: "salim" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t3");
  });

  it("returns empty array when no tasks match", () => {
    const result = applyFilters(tasks, { ...DEFAULT_FILTERS, searchQuery: "xyznotfound" });
    expect(result).toHaveLength(0);
  });

  it("combines role and time filters (AND logic)", () => {
    const result = applyFilters(tasks, { ...DEFAULT_FILTERS, role: "nurse", timeFilter: "overdue" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t1");
  });
});

// ─── groupTasksByStatus ───────────────────────────────────────────────────────

describe("groupTasksByStatus", () => {
  it("correctly groups tasks into status buckets", () => {
    const tasks: Task[] = [
      makeTask({ id: "t1", dueDate: fmt(subDays(today, 1)) }),
      makeTask({ id: "t2", dueDate: fmt(today) }),
      makeTask({ id: "t3", dueDate: fmt(addDays(today, 7)) }),
      makeTask({ id: "t4", status: "completed" }),
    ];

    const groups = groupTasksByStatus(tasks);
    expect(groups.overdue).toHaveLength(1);
    expect(groups.in_progress).toHaveLength(1);
    expect(groups.upcoming).toHaveLength(1);
    expect(groups.completed).toHaveLength(1);
  });
});
