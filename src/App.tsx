import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TaskBoard } from "./components/TaskBoard/TaskBoard";
import { ToastContainer } from "./components/common/ToastContainer";
import "./styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 8000),
      staleTime: 60 * 1000,
    },
  },
});

function App() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (isLight) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [isLight]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <header className="app-header">
          <div className="app-header__brand">
            <span className="app-header__logo">◈</span>
            <div>
              <h1 className="app-header__title">NephroTrack</h1>
              <span className="app-header__subtitle">Dialysis Care Task Management</span>
            </div>
          </div>
          <div className="app-header__meta">
            <span className="app-header__date">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        <main className="app-main">
          <TaskBoard />
        </main>
      </div>

      {/* Theme toggle — bottom left */}
      <button
        className="theme-toggle"
        onClick={() => setIsLight((v) => !v)}
        title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      >
        {isLight ? "🌙" : "☀️"}
      </button>

      <ToastContainer />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;