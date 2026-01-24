# Implementation Plan: Guest Experience Runtime

**Branch**: `039-guest-experience-runtime` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/039-guest-experience-runtime/spec.md`

## Summary

Implement guest experience execution flows including step execution, pregate experiences (before main), preshare experiences (after main), session management with linking, and proper navigation behavior. The existing ExperienceRuntime infrastructure will be leveraged, with schema extensions for session linking and guest completion tracking.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Router 1.132.0, React 19.2.0, Firebase SDK 12.5.0, Zod 4.1.12, Zustand 5.x
**Storage**: Firebase Firestore (client SDK for reads/writes, Admin SDK for Cloud Functions)
**Testing**: Vitest (unit tests)
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: Web application (TanStack Start monorepo with Firebase Cloud Functions)
**Performance Goals**: Page load < 2s on 4G, AI transformation < 60s (handled by pipeline backend)
**Constraints**: Mobile-first touch targets (44x44px), client-first architecture (Firebase client SDKs)
**Scale/Scope**: Single guest journey per session, ~10 experience steps max per experience

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Guest experience is inherently mobile-first; existing runtime follows this |
| II. Clean Code & Simplicity | ✅ PASS | Building on existing runtime patterns; no over-engineering needed |
| III. Type-Safe Development | ✅ PASS | All schemas use Zod; strict TypeScript; runtime validation |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for critical flows (pregate/preshare routing logic) |
| V. Validation Gates | ✅ PASS | Must run `pnpm app:check` + type-check before marking complete |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase SDKs; SSR only for SEO entry points |
| VII. Backend & Firebase | ✅ PASS | Client SDK for reads/subscriptions; transforms via existing HTTP endpoint |
| VIII. Project Structure | ✅ PASS | Follows vertical slice architecture in `domains/guest/` and `domains/session/` |

**Constitution Check Result**: ALL GATES PASS - proceed with implementation.

## Project Structure

### Documentation (this feature)

```text
specs/039-guest-experience-runtime/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo structure - Web application with Cloud Functions

apps/clementine-app/
├── src/
│   ├── app/
│   │   └── join/
│   │       └── $projectId/
│   │           ├── route.tsx                    # GuestLayout (existing)
│   │           ├── index.tsx                    # WelcomeScreen (existing)
│   │           ├── experience/
│   │           │   └── $experienceId.tsx        # Main experience route (existing, modify)
│   │           ├── pregate.tsx                  # NEW: Pregate route
│   │           ├── preshare.tsx                 # NEW: Preshare route
│   │           └── share.tsx                    # NEW: Share route (placeholder)
│   └── domains/
│       ├── guest/
│       │   ├── containers/
│       │   │   ├── WelcomeScreen.tsx            # Modify: add pregate check
│       │   │   ├── ExperiencePage.tsx           # Modify: add preshare trigger
│       │   │   ├── PregatePage.tsx              # NEW: Pregate page container
│       │   │   ├── PresharePage.tsx             # NEW: Preshare page container
│       │   │   └── SharePage.tsx                # NEW: Share page container (placeholder)
│       │   ├── hooks/
│       │   │   ├── usePregate.ts                # NEW: Pregate routing logic
│       │   │   ├── usePreshare.ts               # NEW: Preshare routing logic
│       │   │   └── useUpdateGuestCompletedExperiences.ts  # NEW: Completion tracking
│       │   └── schemas/
│       │       └── guest.schema.ts              # Modify: add completedExperiences
│       ├── session/
│       │   └── shared/
│       │       └── hooks/
│       │           └── useUpdateSessionMainSessionId.ts  # NEW: Session linking
│       └── experience/
│           └── runtime/
│               └── ExperienceRuntime.tsx        # Modify: add onComplete callback for linking

packages/shared/
└── src/
    └── schemas/
        └── session/
            └── session.schema.ts                # Modify: add mainSessionId field

functions/
└── src/
    └── http/
        └── startTransformPipeline.ts            # Existing (no changes needed)

tests/
└── unit/
    ├── domains/
    │   └── guest/
    │       ├── usePregate.test.ts               # NEW: Pregate logic tests
    │       └── usePreshare.test.ts              # NEW: Preshare logic tests
```

**Structure Decision**: Following existing monorepo structure with TanStack Start app in `apps/clementine-app/`. New routes added under `/join/$projectId/` following flat route pattern per spec Decision 4. New domain hooks/containers added to `domains/guest/` following vertical slice architecture.

## Complexity Tracking

> **No violations - this section remains empty**

The implementation follows existing patterns and constitution principles without requiring complexity justifications.

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Mobile-First Design | ✅ PASS | No new UI components - reuses existing runtime which is mobile-first |
| II. Clean Code & Simplicity | ✅ PASS | Small focused hooks (usePregate, usePreshare); no unnecessary abstractions |
| III. Type-Safe Development | ✅ PASS | Schema extensions use Zod; all contracts are type-safe |
| IV. Minimal Testing Strategy | ✅ PASS | Tests for routing logic hooks only (critical path) |
| V. Validation Gates | ✅ PASS | Design follows existing patterns; validation loop required before completion |
| VI. Frontend Architecture | ✅ PASS | Client SDK for all Firestore operations; no new server functions |
| VII. Backend & Firebase | ✅ PASS | Uses existing transform endpoint; client SDK for updates |
| VIII. Project Structure | ✅ PASS | Routes under `/join/`, hooks in domain folders, schemas in proper locations |

**Post-Design Check Result**: ALL GATES PASS - ready for task generation.

---

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Implementation Plan | `specs/039-guest-experience-runtime/plan.md` | This file |
| Research | `specs/039-guest-experience-runtime/research.md` | Technical research and decisions |
| Data Model | `specs/039-guest-experience-runtime/data-model.md` | Schema extensions and data flows |
| Quickstart | `specs/039-guest-experience-runtime/quickstart.md` | Implementation guide with code examples |
| Guest Completion Contract | `specs/039-guest-experience-runtime/contracts/guest-completion-tracking.yaml` | Firestore update contract |
| Session Linking Contract | `specs/039-guest-experience-runtime/contracts/session-linking.yaml` | Session mainSessionId contract |
| Route Params Contract | `specs/039-guest-experience-runtime/contracts/route-params.yaml` | URL parameter definitions |
| Transform Trigger Contract | `specs/039-guest-experience-runtime/contracts/transform-trigger.yaml` | HTTP endpoint usage |

## Next Steps

Run `/speckit.tasks` to generate actionable implementation tasks from this plan.
