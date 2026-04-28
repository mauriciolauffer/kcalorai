# Product Requirements Document — kcalorai

## 1. Overview

**kcalorai** is an edge-native calorie and macronutrient tracking application. It provides users with a persistent, cross-device log of their food intake, macro breakdown, and progress toward personalized daily goals.

The backend runs entirely on Cloudflare Workers backed by D1 (SQLite), exposed through a single Hono API Gateway, and designed to be stateless, fast, and deterministic.

---

## 2. Goals

- Allow users to track daily calorie and macronutrient intake with minimal friction.
- Personalize calorie and macro targets based on user profile data.
- Provide real-time daily summaries and weekly trend insights.
- Validate data integrity through macro-calorie consistency rules.
- Persist all user data across devices via JWT-authenticated sessions.

---

## 3. Non-Goals

- Native mobile applications (backend API only in current scope).
- Third-party food database integrations (e.g., USDA, Open Food Facts).
- Social or community features (sharing, leaderboards).
- Offline-first or local-sync client logic.
- Long-lived server-side sessions or OAuth flows.

---

## 4. Users

**Primary user:** An individual who wants to monitor calorie intake and macronutrient balance as part of a dietary or fitness goal.

**Assumed context:** The user accesses the application through a client (web or mobile) that communicates with this API. The API surfaces no UI directly.

---

## 5. Technical Constraints

| Concern         | Decision                                                 |
| --------------- | -------------------------------------------------------- |
| Runtime         | Cloudflare Workers (TypeScript)                          |
| Database        | Cloudflare D1 (SQLite)                                   |
| HTTP framework  | Hono                                                     |
| Testing         | Vitest                                                   |
| Auth            | Stateless JWT via `Authorization` header                 |
| Package manager | pnpm ≥ 10                                                |
| Node.js target  | ≥ 20 (dev tooling only; Workers runtime applies at edge) |

No alternative runtime, database, or framework may be introduced without updating `AGENTS.md`.

---

## 6. Architecture

```
Client
  ↓
Cloudflare Edge
  ↓
API Gateway Worker (Hono)         /src/routes
  ↓
Service Layer                     /src/services
  ↓
Repository Layer                  /src/repositories
  ↓
D1 Database                       /src/db
```

All business logic lives in services. Routes handle only request parsing, validation, and response shaping. Repositories own all SQL.

---

## 7. Feature Areas

Acceptance criteria for each story are defined in `user-stories.md`. This section documents implementation notes and any backend-specific constraints not captured there.

| Area                        | Stories                   | Implementation                                                                                                                                                      |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication              | US1                       | `src/routes/auth.ts`, `src/services/auth.service.ts`, `src/middlewares/auth.ts`                                                                                     |
| User Profile & Calorie Goal | US2, US8                  | `src/routes/profile.ts`, `src/services/profile.service.ts`, `src/repositories/profile.repository.ts`                                                                |
| Food Logging                | US3, US4, US5, US10, US15 | `src/routes/food.ts`, `src/services/food.service.ts`, `src/repositories/food.repository.ts`                                                                         |
| Daily Summary               | US6, US12, US13, US16     | `src/services/summary.service.ts`                                                                                                                                   |
| Weekly Trends               | US7, US18                 | Planned                                                                                                                                                             |
| Macro Targets               | US13, US14                | `src/routes/us13.test.ts`, `src/routes/us14.test.ts`                                                                                                                |
| Quick Add Macros            | US19                      | Planned                                                                                                                                                             |
| Macro-Calorie Validation    | US20                      | Planned — applies 4/4/9 rule with 5% tolerance; warns but does not auto-correct                                                                                     |
| Reminders                   | US9                       | `src/routes/reminder.ts`, `src/services/reminder.service.ts`, `src/repositories/reminder.repository.ts` — delivered via Cloudflare Cron Triggers, best-effort in v1 |
| Data Persistence & Sync     | US11                      | Every write committed to D1 before response; offline handling delegated to client                                                                                   |

---

## 8. Data Model (Summary)

| Entity      | Key Fields                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| User        | id, email, password_hash                                                   |
| Profile     | user_id, age, height, weight, gender, activity_level, goal, calorie_target |
| FoodEntry   | id, user_id, name, calories, protein, fat, carbs, meal_type, logged_at     |
| MacroTarget | user_id, protein_g, fat_g, carbs_g, effective_from                         |
| Reminder    | id, user_id, time, enabled                                                 |

Full schema: `src/db/schema.sql`

---

## 9. API Surface (Planned Endpoints)

| Method       | Path              | Description                     |
| ------------ | ----------------- | ------------------------------- |
| POST         | `/auth/signup`    | Create account                  |
| POST         | `/auth/login`     | Authenticate and receive JWT    |
| GET / PUT    | `/profile`        | Read or update user profile     |
| GET / POST   | `/food`           | List or log food entries        |
| PUT / DELETE | `/food/:id`       | Edit or delete a food entry     |
| GET          | `/summary/daily`  | Daily calorie and macro summary |
| GET          | `/summary/weekly` | Weekly trend data               |
| GET / PUT    | `/profile/macros` | Read or update macro targets    |
| GET / POST   | `/reminders`      | List or create reminders        |
| PUT / DELETE | `/reminders/:id`  | Update or delete a reminder     |

---

## 10. Validation Rules

- **Email:** must be a valid RFC 5322 address.
- **Password:** minimum 8 characters; at least one letter and one digit.
- **Calories:** positive integer.
- **Macros:** non-negative integers; may be zero for entries without macro data.
- **Macro-calorie consistency:** `|protein*4 + carbs*4 + fat*9 - calories| / calories ≤ 0.05` (5% tolerance); violation returns a warning, not a hard rejection (user may confirm).
- **Portion size:** positive non-zero number; macros and calories scale linearly.

---

## 11. Error Handling

- All errors return a normalized JSON body: `{ "error": "<message>" }`.
- Stack traces are never exposed in production responses.
- HTTP status codes follow REST conventions (400 validation, 401 auth, 404 not found, 409 conflict, 500 server).

---

## 12. Environments

| Environment  | Purpose                              |
| ------------ | ------------------------------------ |
| `dev`        | Local development via `wrangler dev` |
| `staging`    | Pre-production validation            |
| `production` | Live edge deployment                 |

Each environment has isolated D1 databases and secrets. Wrangler configuration (`wrangler.jsonc`) is the authoritative source for bindings.

---

## 13. Out-of-Scope for v1

- Barcode scanning / image-based food recognition.
- Third-party nutrition database sync.
- Social features.
- Client-side offline storage or sync protocol.
- Push notification delivery beyond Cron Trigger payloads.
- Payment or subscription management.

---

## 14. Delivery Status

| User Story                          | Status                |
| ----------------------------------- | --------------------- |
| US1 — Account creation              | Implemented           |
| US2 — Profile setup                 | Implemented           |
| US3 — Log a meal                    | Implemented           |
| US4 — Search food database          | Implemented           |
| US5 — Quick add calories            | Implemented           |
| US6 — Daily summary                 | Implemented           |
| US7 — Weekly trends                 | Planned               |
| US8 — Adjust calorie goal           | Implemented           |
| US9 — Reminders                     | Implemented           |
| US10 — Food history                 | Implemented           |
| US11 — Data persistence             | Implemented           |
| US12 — Daily macro breakdown        | Implemented           |
| US13 — Macro goals                  | Implemented           |
| US14 — Customize macro targets      | Implemented           |
| US15 — Log food with macros         | Implemented           |
| US16 — Per-meal macro distribution  | Planned               |
| US17 — Macro progress visualization | Planned (client-side) |
| US18 — Weekly macro trends          | Planned               |
| US19 — Quick add macros             | Planned               |
| US20 — Macro-calorie validation     | Planned               |
