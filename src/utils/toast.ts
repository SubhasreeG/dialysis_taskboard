type ToastType = "success" | "error" | "info";

interface ToastEvent {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (event: ToastEvent) => void;

const listeners: Set<Listener> = new Set();

let counter = 0;

function emit(type: ToastType, message: string) {
  const event: ToastEvent = { id: `toast-${counter++}`, type, message };
  listeners.forEach((l) => l(event));
}

export const toast = {
  success: (message: string) => emit("success", message),
  error: (message: string) => emit("error", message),
  info: (message: string) => emit("info", message),
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export type { ToastEvent, ToastType };
