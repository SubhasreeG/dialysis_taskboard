# NephroTrack - Dialysis Care Task Management

A production grade care plan taskboard for dialysis centre staff. Tracks recurring and ad-hoc tasks per patient across multiple clinical roles (nurse, dietician, social worker), with real-time status management, optimistic UI, and robust failure handling.

---

## Quick Start
```bash
git clone <repo-url>
cd dialysis-taskboard
npm install --legacy-peer-deps
npx msw init public/
npm start
```

Open [http://localhost:3000](http://localhost:3000). The app uses **MSW (Mock Service Worker)** to intercept API calls - no backend needed.

To run tests:
```bash
npm test
```
25 tests across 3 test files - all passed.

## Architecture Overview

```
src/
├── api/
│   └── client.ts          # Fetch wrapper with retry, error normalisation
├── types/
│   └── index.ts           # Domain models + DTOs + payload types
├── utils/
│   ├── mappers.ts         # DTO → domain model (with runtime validation)
│   ├── filters.ts         # Filter logic, status derivation, label maps
│   └── toast.ts           # Lightweight pub/sub toast bus
├── hooks/
│   ├── useTasks.ts        # React Query queries + mutations (optimistic update)
│   └── useFilters.ts      # Local filter state (role, time, search)
├── mocks/
│   ├── handlers.ts        # MSW handlers + seed data
│   └── browser.ts         # MSW worker setup
├── components/
│   ├── TaskBoard/         # Top-level board: patient list + FilterBar
│   ├── PatientRow/        # Collapsible row per patient, 4-column layout
│   ├── TaskCard/          # Single task with inline status cycling
│   ├── FilterBar/         # Role + time chips + search + aggregate stats
│   ├── CreateTaskModal/   # Controlled form for new tasks
│   ├── StatusBadge/       # Colour-coded status pill
│   └── common/
│       └── ToastContainer # Global notification layer
└── styles/
    └── global.css         # Full design system (CSS variables, no framework)
```

### Data Flow

```
MSW Intercepts HTTP
       ↓
  api/client.ts  ←-- retry + error normalisation
       ↓
  mappers.ts     ←-- DTO → domain model (runtime type guards)
       ↓
React Query Cache  ←-- stale-while-revalidate, optimistic updates
       ↓
  Components     ←-- read from cache, mutate via hooks
```

### State Management: React Query

I chose **TanStack React Query** over Redux/Zustand for this project for these reasons:

| Need | How React Query covers it |
|---|---|
| Server state (tasks, patients) | Automatic caching, background refetch, `staleTime` config |
| Optimistic updates | `onMutate` / `onError` context rollback pattern |
| Loading / error states | `isLoading`, `isError`, `error` per query |
| Retry on failure | Built-in `retry` + `retryDelay` with exponential back-off |
| Cache invalidation | `queryClient.invalidateQueries` after mutations |

Local UI state (filters, modal open/closed) is plain `useState`/`useReducer` . No need for a global store for that.

---

## Patient Risk Scoring

One feature I added beyond the brief is a **clinical risk score** per patient, visible as a colour-coded ring next to each patient name.

## UI Features

- **Light / Dark mode** — toggle button fixed to the bottom left corner. Defaults to dark mode, which suits the dense clinical data layout. Light mode available for brighter environments.
- **Collapsible patient rows** — click the `›` arrow to collapse any patient row
- **Aggregate stats** — live overdue / today / upcoming / done counts at the top of the board update as tasks move through statuses
- **Toast notifications** — bottom right corner shows success/failure feedback on every task update

### How it works

Each patient gets a score calculated from their incomplete tasks:

- **Overdue tasks** contribute more than in-progress tasks
- **Days overdue** multiplies the score - a task 5 days overdue is worth more than one that just passed its due date
- **Task category is weighted by clinical priority:**

| Category | Weight |
|---|---|
| Access Check | 4 |
| Medication Review | 4 |
| Lab Work | 3 |
| Vaccination | 2 |
| Diet Counseling | 2 |
| Social Work | 1 |
| Follow-up / Other | 1 |

### Why these weights?

In a real dialysis unit, not all overdue tasks carry equal clinical risk. A missed vascular access check or medication review can directly affect patient safety, whereas a delayed social work follow-up, while important, is less immediately critical. The weights reflect this prioritisation.

### Risk levels

| Score | Level | Colour |
|---|---|---|
| 15+ | Critical | Red |
| 8–14 | High | Amber |
| 3–7 | Medium | Blue |
| 0–2 | Low | Green |

Patients are visually sorted by risk level via the left border accent on each row, making it immediately obvious which patients need attention first - without the staff having to mentally tally up task counts themselves.


## Assumptions & Trade-offs

### Data Contract Decisions

**Task status as a hybrid:** The `status` field on a task stores intent (`upcoming`, `in_progress`, `completed`). The UI derives the *displayed* status by also checking the due date against today (so an `upcoming` task with a past due date is shown as `overdue`). This avoids requiring the backend to continuously update statuses on a cron job, while keeping the UI accurate.

**No user auth:** The assignment scope is the taskboard UI, so user identity is omitted. In production, the current user's role would determine which filters are pre-applied and which tasks they can edit.

**Pagination omitted:** With 5 seed patients it's not needed. I'd add cursor-based pagination to `fetchPatients` and `fetchTasksForPatient` as the first scaling step.

**DTO shape tolerance:** `safeMapTasks` and `safeMapPatients` use runtime type guards to skip malformed records rather than throwing. This is a deliberate resilience choice - a single bad record from the backend shouldn't blank the entire board.

### What I'd Do With More Time

- [ ] Drag-and-drop between status columns (using `@dnd-kit`)
- [ ] Infinite scroll / virtual list for large patient counts
- [ ] Per-task detail drawer with full edit form and history log
- [ ] Keyboard accessibility audit (focus traps in modal, ARIA live regions for status updates)
- [ ] `date-fns` locale-aware formatting based on user locale
- [ ] E2E tests with Playwright covering the create → update → rollback flow
- [ ] Backend implementation (Express + PostgreSQL, with recurring task auto-generation via pg-cron)

---

## Integration & Failure Modes

### Network Failures

| Scenario | Behaviour |
|---|---|
| GET /patients fails | Full-page error state with Retry button |
| GET /patients/:id/tasks fails | Inline error per patient row, doesn't affect other rows |
| PATCH /tasks/:id fails (optimistic update) | Cache rolled back to pre-mutation state; toast error shown |
| Network timeout / 5xx on GET | Automatic retry ×2 with exponential back-off (300ms, 600ms) |
| 4xx (client error) | No retry; error surfaced immediately |

The MSW mock intentionally introduces a ~10% random failure rate on `PATCH /tasks/:id` to make rollback behaviour observable in development.

### Adding a New Role

1. Add the new role to the `Role` union type in `src/types/index.ts`
2. Add its label to `ROLE_LABELS` in `src/utils/filters.ts`
3. The `FilterBar` and `CreateTaskModal` both derive their role lists from these maps - no other changes needed

### Adding a New Task Category

1. Add the category to the `TaskCategory` union in `src/types/index.ts`
2. Add entries in `CATEGORY_LABELS` and `CATEGORY_ICONS` in `src/utils/filters.ts`
3. The `CreateTaskModal` category dropdown and `TaskCard` icon will pick it up automatically

---

## AI Tools

**What I used AI for:**
- Boilerplate scaffolding for the MSW handler structure and QueryClient config
- Initial draft of the `safeMapTasks` runtime guard pattern
- Suggesting `date-fns` as the date utility (confirmed by checking bundle size vs `dayjs`)

**What I reviewed and changed manually:**
- Rewrote the optimistic update hook : the AI's initial version used `useMemo` to compute the rollback context, which doesn't work because `onMutate` needs the snapshot at mutation time, not at render time
- Replaced the AI's `switch` on `TaskStatus` in `deriveTaskStatus` with a more readable `if/else` chain that makes the priority order clearer
- Adjusted the CSS design system entirely - AI defaulted to a light theme with Inter font; I switched to a dark clinical aesthetic with DM Mono + Syne to match the operational, data-dense nature of the product

**One disagreement:**
The AI suggested using `Zustand` for filter state, arguing that "shared global state benefits from a store." I disagreed - filters are local to the `TaskBoard` view, don't need to persist across sessions, and don't need to be accessed by any component outside the board hierarchy. `useState` in `useFilters.ts` with prop drilling one level down is the right call. Reaching for a store here would be over-engineering that adds indirection without benefit.
