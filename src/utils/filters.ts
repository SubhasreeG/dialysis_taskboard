import { isToday, isPast, parseISO, differenceInDays } from "date-fns";
import type { Task, FilterState } from "../types";

export function deriveTaskStatus(task: Task): Task["status"] {
  if (task.status === "completed") return "completed";
  if (task.status === "in_progress") return "in_progress";

  const due = parseISO(task.dueDate);
  if (isPast(due) && !isToday(due)) return "overdue";
  if (isToday(due)) return "in_progress";
  return "upcoming";
}

export function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  return tasks.filter((task) => {
    // Role filter
    if (filters.role !== "all" && task.assignedRole !== filters.role) {
      return false;
    }

    // Time filter
    if (filters.timeFilter !== "all") {
      const derived = deriveTaskStatus(task);
      if (filters.timeFilter === "overdue" && derived !== "overdue") return false;
      if (filters.timeFilter === "due_today" && derived !== "in_progress") return false;
      if (filters.timeFilter === "upcoming" && derived !== "upcoming") return false;
    }

    // Search query — matches patient, title, or assignee
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const haystack = [task.title, task.assigneeName ?? "", task.notes ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export function groupTasksByStatus(tasks: Task[]): Record<Task["status"], Task[]> {
  return {
    overdue: tasks.filter((t) => deriveTaskStatus(t) === "overdue"),
    in_progress: tasks.filter((t) => deriveTaskStatus(t) === "in_progress"),
    upcoming: tasks.filter((t) => deriveTaskStatus(t) === "upcoming"),
    completed: tasks.filter((t) => t.status === "completed"),
  };
}

export const STATUS_LABELS: Record<Task["status"], string> = {
  overdue: "Overdue",
  in_progress: "In Progress",
  upcoming: "Upcoming",
  completed: "Completed",
};

export const ROLE_LABELS: Record<string, string> = {
  all: "All Roles",
  nurse: "Nurse",
  dietician: "Dietician",
  social_worker: "Social Worker",
};

export const CATEGORY_LABELS: Record<string, string> = {
  lab_work: "Lab Work",
  access_check: "Access Check",
  diet_counseling: "Diet Counseling",
  vaccination: "Vaccination",
  social_work: "Social Work",
  medication_review: "Medication Review",
  follow_up: "Follow-up",
  other: "Other",
};

export const CATEGORY_ICONS: Record<string, string> = {
  lab_work: "LAB",
  access_check: "ACC",
  diet_counseling: "DIET",
  vaccination: "VAC",
  social_work: "SOC",
  medication_review: "MED",
  follow_up: "FUP",
  other: "OTH",
};



// ─── Risk Score ───────────────────────────────────────────────────────────────

const CATEGORY_WEIGHT: Record<string, number> = {
  lab_work:          3,
  access_check:      4,
  medication_review: 4,
  vaccination:       2,
  diet_counseling:   2,
  social_work:       1,
  follow_up:         1,
  other:             1,
};

export function computeRiskScore(tasks: Task[]): number {
  let score = 0;
  for (const task of tasks) {
    if (task.status === "completed") continue;
    const derived = deriveTaskStatus(task);
    if (derived === "overdue") {
      const daysOverdue = differenceInDays(new Date(), parseISO(task.dueDate));
      const weight = CATEGORY_WEIGHT[task.category] ?? 1;
      score += weight * (1 + daysOverdue * 0.5);
    } else if (derived === "in_progress") {
      score += CATEGORY_WEIGHT[task.category] ?? 1;
    }
  }
  return Math.round(score);
}

export function getRiskLevel(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 15) return "critical";
  if (score >= 8)  return "high";
  if (score >= 3)  return "medium";
  return "low";
}

export const RISK_LABELS: Record<string, string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
};

export const RISK_COLORS: Record<string, string> = {
  critical: "#ff4d4d",
  high:     "#f5a623",
  medium:   "#4a9eff",
  low:      "#3ed68a",
};