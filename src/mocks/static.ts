import { MOCK_PATIENTS } from "./handlers";
import { safeMapPatients, safeMapTasks } from "../utils/mappers";

const taskMap: Record<string, unknown[]> = {};

async function loadTasks() {
  const { MOCK_TASKS } = await import("./handlers") as any;
  return MOCK_TASKS;
}

export function setupStaticHandlers() {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url === "/patients") {
      return new Response(JSON.stringify({ data: MOCK_PATIENTS }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const taskMatch = url.match(/\/patients\/(.+)\/tasks/);
    if (taskMatch && init?.method !== "POST" && !init?.method) {
      const { MOCK_TASKS } = await import("./handlers") as any;
      const tasks = MOCK_TASKS.filter((t: any) => t.patient_id === taskMatch[1]);
      return new Response(JSON.stringify({ data: tasks }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (taskMatch && init?.method === "POST") {
      const body = JSON.parse(init.body as string);
      const { MOCK_TASKS } = await import("./handlers") as any;
      const newTask = {
        id: `t${Date.now()}`,
        patient_id: taskMatch[1],
        status: "upcoming",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_recurring: false,
        ...body,
      };
      MOCK_TASKS.push(newTask);
      return new Response(JSON.stringify({ data: newTask }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    const patchMatch = url.match(/\/tasks\/(.+)/);
    if (patchMatch && init?.method === "PATCH") {
      const { MOCK_TASKS } = await import("./handlers") as any;
      const body = JSON.parse(init.body as string);
      const idx = MOCK_TASKS.findIndex((t: any) => t.id === patchMatch[1]);
      if (idx !== -1) {
        MOCK_TASKS[idx] = { ...MOCK_TASKS[idx], ...body, updated_at: new Date().toISOString() };
        return new Response(JSON.stringify({ data: MOCK_TASKS[idx] }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return originalFetch(input, init);
  };
}