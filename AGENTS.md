# AGENTS.md

This file defines how **agents (human or AI)** must understand, navigate, and modify this repository.

It describes the system architecture, constraints, conventions, and non‑negotiable rules for the **kcalorai** backend. Any change that violates this document must update this document first.

This file is authoritative.

---

## 1. System Intent

**kcalorai** is an edge‑native calorie and macronutrient tracking application.

The backend is designed to:

- Run entirely on Cloudflare infrastructure
- Be stateless, fast, and deterministic
- Be easy to reason about for automated agents
- Favor clarity and explicitness over abstraction

---

## 2. Execution Environment

Agents must assume the following execution constraints:

- Runtime: **Cloudflare Workers**
- Language: **TypeScript**
- Execution model: event‑driven, request/response
- No long‑lived state in memory
- No access to Node.js APIs

All backend code executes at the edge.

---

## 3. Core Technologies

### Infrastructure

- Cloudflare Workers
- Cloudflare D1 (SQLite)

### Application Layer

- Hono (HTTP routing and middleware)

### Testing

- Vitest

No alternative frameworks, runtimes, or databases may be introduced without updating this file.

---

## 4. Architectural Shape

The backend is deployed as **a single API Gateway Worker**, logically decomposed into modules.

```
Client
  ↓
Cloudflare Edge
  ↓
API Gateway Worker (Hono)
  ↓
Service Layer
  ↓
Repository Layer
  ↓
D1 Database
```

Agents must preserve this layering.

---

## 5. Agent Responsibilities

When modifying this repository, agents must:

- Keep route handlers thin
- Keep business logic out of HTTP layers
- Centralize persistence logic
- Avoid hidden side effects
- Prefer explicit data flow

Agents must not introduce cross‑layer dependencies.

---

## 6. Repository Layout

Agents should expect the following structure and must preserve it.

```
/src
  /app            # Application wiring
  /routes         # HTTP routes only
  /services       # Business logic
  /repositories   # Persistence logic
  /middlewares    # Cross‑cutting concerns
  /db             # Database setup & migrations
  /types          # Shared types

  index.ts        # Worker entry point
```

New directories must map clearly to one of these responsibilities.

---

## 7. API Gateway Rules (Hono)

The Hono Worker is the system boundary.

### Allowed in routes

- Request parsing
- Input validation
- Calling services
- Returning HTTP responses

### Forbidden in routes

- Business rules
- SQL queries
- Direct database access

---

## 8. Service Layer Rules

Services define domain behavior.

Agents must ensure that services:

- Contain no HTTP concepts
- Are framework‑agnostic
- Can be tested in isolation

Services may coordinate multiple repositories.

---

## 9. Persistence Rules (D1)

D1 is the single source of truth.

### Constraints

- All SQL lives in repositories
- Repositories receive `D1Database` explicitly
- No global database access

Repositories must expose intent‑revealing methods.

---

## 10. Environment Bindings

All Cloudflare bindings must be typed.

```ts
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}
```

Agents must not access untyped bindings.

---

## 11. Authentication Model

Authentication is stateless.

### Rules

- JWT only
- Tokens passed via `Authorization` header
- Verification handled by middleware

No server‑side sessions are allowed.

---

## 12. Error Semantics

Errors must be predictable and normalized.

### Rules

- Throw explicit errors
- Centralize error handling
- Never leak stack traces in production

---

## 13. Testing Contract

Vitest is mandatory.

Agents must ensure:

- Services are unit‑tested
- Repositories are testable with mocked or local D1
- Routes can be tested by importing the Hono app

Tests must not rely on global state.

---

## 14. Environments & Deployment

Supported environments:

- dev
- staging
- production

Each environment must have isolated D1 databases and secrets.

Wrangler configuration is the source of truth for bindings.

---

## 15. Extensibility Constraints

Future Cloudflare features (KV, Queues, Cron, R2) may be added only if:

- Layering is preserved
- Core request flow remains synchronous
- This document is updated accordingly

---

## 16. Change Protocol

If an agent cannot comply with any rule in this document:

1. Update this document first
2. Explain the rationale clearly
3. Then apply the change

Failure to do so is considered a defect.

---

_End of AGENTS.md_
