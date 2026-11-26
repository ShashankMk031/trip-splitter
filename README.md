# Trip Splitter

Trip Splitter is a two-page expense tracker for the **Goa Getaway** group trip. It records shared expenses with equal, exact-amount, and percentage splits, computes exact member balances, supports category filtering and confirmed deletion, and persists state in `localStorage`.

## Getting Started

```bash
npm install
npm run dev
```

Verification commands:

- `npm run typecheck` — strict TypeScript check (`tsc -b --noEmit`)
- `npm run lint` — ESLint with `typescript-eslint` strict rules
- `npm run test` — Vitest + React Testing Library test suite
- `npm run build` — production TypeScript and Vite build

## Tech Stack

- **React 19** + **TypeScript** (`"strict": true`, no `any` or suppression comments)
- **Vite** + **CSS Modules** with design tokens
- **Redux Toolkit** + **React Redux** (`useAppDispatch`, `useAppSelector`)
- **React Router** (`/`, `/expenses/new`, and `*` fallback)
- **Vitest** + **React Testing Library**

## Architecture & State Decisions

1. **Redux vs. Local State**: Redux (`trip` slice) stores only canonical `members` and `expenses`, plus memoized selectors for sorted expenses, balances, and summary totals. Transient UI state (category filter, delete confirmation target, status banner, and raw form drafts) stays local to components.
2. **Pure Domain Logic**: Money parsing/formatting (`money.ts`), share splitting (`split.ts`), balance calculation (`balance.ts`), validation (`validation.ts`), and storage guards (`storage.ts`) live in framework-free TypeScript modules tested independently of React.
3. **Controlled Forms Without Libraries**: The Add Expense form uses native HTML controls, `type="text" inputMode="decimal"` for exact decimal validation, simultaneous submit-time field errors, and a `submittingRef` guard against duplicate submissions.

## Money & Splitting Rules

All amounts are stored and calculated in **integer paise** (`₹1,250.50` = `125050`) via string-split parsing to avoid floating-point drift, and formatted with `Intl.NumberFormat('en-IN')`.

- **Equal split extra-paisa rule**: When `amount % n` leaves remainder paise (e.g., `₹100` among 3 yields `₹33.34 + ₹33.33 + ₹33.33`), extra paise are allocated sequentially by **trip `members` array order**, regardless of selection order.
- **Percentage split precision**: Percentages convert to integer basis points (`100% = 10000`) and allocate via the **Largest Remainder Method**, breaking ties by trip `members` array order so shares always sum to the expense amount and group balances always sum to `₹0.00`.

## `localStorage` Persistence

`createAppStore` hydrates once at startup via `loadTripData()` (`trip-splitter:v1:data`), validating both JSON structure (`isTripData`) and domain invariants (non-empty members, valid payers, positive amounts, valid split sums). Missing, inaccessible, or invalid data safely falls back to `src/data/sample-data.json` without overwriting valid storage. An RTK `createListenerMiddleware` writes updates only on `addExpense` and `deleteExpense` inside `try/catch`.

## With One Additional Day

I would add a simplified "who pays whom" settlement plan, expense editing, and trip member management.

## AI Usage

I used an AI coding assistant to help scaffold the project, draft CSS Modules, and generate test scaffolding. I reviewed, verified, and refined the money-splitting math, TypeScript guards, accessibility patterns, and test assertions against the requirements.
