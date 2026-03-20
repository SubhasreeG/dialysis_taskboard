import type {
  Patient,
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  PatientDTO,
  TaskDTO,
  ApiError,
} from "../types";
import { safeMapPatients, safeMapTasks, mapTask } from "../utils/mappers";

const BASE_URL = process.env.REACT_APP_API_URL ?? "";

class ApiClientError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      });

      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          message = body?.message ?? message;
        } catch {
          // body was not JSON — keep default message
        }

        const apiError: ApiError = { status: res.status, message };

        // Don't retry client errors (4xx)
        if (res.status >= 400 && res.status < 500) {
          throw new ApiClientError(apiError);
        }

        lastError = new ApiClientError(apiError);
        if (attempt < retries) {
          await delay(300 * 2 ** attempt); // exponential back-off: 300ms, 600ms
          continue;
        }
        throw lastError;
      }

      const json = await res.json();
      // Support both wrapped { data: ... } and bare array/object responses
      return (json?.data !== undefined ? json.data : json) as T;
    } catch (e) {
      if (e instanceof ApiClientError) throw e; // don't retry 4xx
      lastError = e;
      if (attempt < retries) {
        await delay(300 * 2 ** attempt);
      }
    }
  }
  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchPatients(): Promise<Patient[]> {
  const raw = await request<PatientDTO[]>("/patients");
  return safeMapPatients(raw as unknown[]);
}

export async function fetchTasksForPatient(patientId: string): Promise<Task[]> {
  const raw = await request<TaskDTO[]>(`/patients/${patientId}/tasks`);
  return safeMapTasks(raw as unknown[]);
}

export async function createTask(
  patientId: string,
  payload: CreateTaskPayload
): Promise<Task> {
  const dto = await request<TaskDTO>(`/patients/${patientId}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapTask(dto);
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload
): Promise<Task> {
  const dto = await request<TaskDTO>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapTask(dto);
}
