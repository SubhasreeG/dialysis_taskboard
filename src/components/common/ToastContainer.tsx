import React, { useState, useEffect } from "react";
import { toast as toastBus } from "../../utils/toast";
import type { ToastEvent } from "../../utils/toast";

interface ActiveToast extends ToastEvent {
  exiting: boolean;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const unsub = toastBus.subscribe((event) => {
      const active: ActiveToast = { ...event, exiting: false };
      setToasts((prev) => [...prev, active]);

      // Begin exit animation after 3.5s
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === active.id ? { ...t, exiting: true } : t))
        );
      }, 3500);

      // Remove from DOM after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== active.id));
      }, 4000);
    });
    return () => { unsub(); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type} ${t.exiting ? "toast--exit" : "toast--enter"}`}
        >
          <span className="toast__icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span className="toast__message">{t.message}</span>
        </div>
      ))}
    </div>
  );
};
