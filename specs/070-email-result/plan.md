# Implementation Plan: Email Result Delivery

**Branch**: `070-email-result` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/070-email-result/spec.md`

## Summary

Enable guests to optionally enter their email on the AI processing loading screen to receive their result via email. The implementation spans three layers: shared schemas (new session and config fields), Cloud Functions (Cloud Task for email sending + callable for email submission + Nodemailer SMTP service), and the TanStack Start frontend (loading screen visual improvements, email capture form, creator configuration panel).

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, Firebase SDK 12.5.0, Firebase Cloud Functions v2 (7.0.3), Nodemailer (new), Zod 4.1.12
**Storage**: Firebase Firestore (session documents, project config)
**Testing**: Vitest (shared package unit tests)
**Target Platform**: Web (mobile-first), Firebase Cloud Functions (Node.js 20)
**Project Type**: Monorepo (apps/clementine-app, functions, packages/shared)
**Performance Goals**: Email delivery within 2 minutes of transform completion; loading screen updates every second
**Constraints**: 2,000 emails/day (Google Workspace limit); one email per session; guest email is PII
**Scale/Scope**: Changes across 3 workspaces; ~10 files modified/created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Email capture form renders on mobile loading screen (primary viewport). Touch targets will follow 44x44px minimum. |
| II. Clean Code & Simplicity | PASS | Minimal additions — 2 session fields, 1 config object, 1 Cloud Task, 1 callable, 1 utility. No premature abstraction. |
| III. Type-Safe Development | PASS | Zod schemas for all new fields. Server-side validation in callable. Strict TypeScript throughout. |
| IV. Minimal Testing Strategy | PASS | Unit tests for email service utility and schema validation. No E2E required for v1. |
| V. Validation Gates | PASS | Will run `pnpm app:check` + `pnpm app:type-check` + `pnpm functions:build` before completion. |
| VI. Frontend Architecture | PASS | Client-first: guest reads config via Firestore subscription. Email write via callable (server validation). |
| VII. Backend & Firebase | PASS | Callable for email write (server-validated mutation). Cloud Task for email sending (mirrors dispatchExports pattern). Admin SDK only in functions. |
| VIII. Project Structure | PASS | Follows vertical slice architecture. New files placed in existing domain folders. |

## Project Structure

### Documentation (this feature)

```text
specs/070-email-result/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Schema changes
├── quickstart.md        # Setup guide
├── contracts/           # API contracts
│   ├── submit-guest-email.yaml
│   ├── send-session-email.yaml
│   └── send-result-email.yaml
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
├── session/
│   └── session.schema.ts              # Add guestEmail, emailSentAt fields
└── project/
    └── project-config.schema.ts       # Add emailCaptureConfigSchema to shareLoading

functions/src/
├── index.ts                           # Export new task + callable
├── infra/
│   ├── params.ts                      # Add SMTP_APP_PASSWORD secret
│   └── task-queues.ts                 # Add queueSendSessionEmail()
├── tasks/
│   ├── transformPipelineJob.ts        # MODIFY: Queue sendSessionEmail on completion
│   └── sendSessionEmail.ts            # NEW: Cloud Task for email dispatch
├── callable/
│   └── submitGuestEmail.ts            # NEW: Callable for guest email submission
├── services/
│   └── email/
│       └── email.service.ts           # NEW: Nodemailer SMTP email sending
└── schemas/
    └── email.schema.ts                # NEW: Zod schemas for email payloads

apps/clementine-app/src/
├── domains/
│   ├── guest/
│   │   └── containers/
│   │       └── SharePage.tsx          # MODIFY: Pass session + config to loading renderer
│   └── project-config/
│       └── share/
│           ├── components/
│           │   ├── ShareLoadingRenderer.tsx      # MODIFY: Spinner, counter, email form
│           │   ├── ShareLoadingConfigPanel.tsx    # MODIFY: Add email capture toggle + heading
│           │   └── EmailCaptureForm.tsx           # NEW: Email capture form component
│           ├── hooks/
│           │   ├── useShareLoadingForm.ts         # MODIFY: Handle emailCapture fields
│           │   └── useSubmitGuestEmail.ts         # NEW: Mutation hook for email submission
│           └── constants/
│               └── defaults.ts                    # MODIFY: Add default emailCapture config
```

**Structure Decision**: All changes integrate into existing domain folders following the vertical slice architecture. No new domains or shared modules needed. The email service in Cloud Functions follows the existing service pattern (`services/export/`).

## Architecture Decisions

### AD-001: Cloud Task for Email Dispatch (mirrors dispatchExports pattern)

**Pattern**: `sendSessionEmail` Cloud Task + two entry points

Email sending is handled by a dedicated Cloud Task (`sendSessionEmail`) that mirrors the existing `dispatchExports` / `dropboxExportWorker` pattern. Two entry points queue it:

**Entry 1 — Job completes after email submitted:**
`transformPipelineJob.finalizeJobSuccess()` queues `sendSessionEmail` alongside the existing `queueDispatchExports()` call. The task fetches the session, checks if `guestEmail` exists and `emailSentAt` is null, and sends if conditions are met.

**Entry 2 — Email submitted after job completed:**
`submitGuestEmail` callable writes `guestEmail` to the session, then checks if `jobStatus === 'completed'` and `resultMedia` exists. If so, it queues `sendSessionEmail` immediately.

Both paths share the same `sendResultEmail()` utility. The `emailSentAt` field prevents duplicates.

**Why this over Firestore trigger (`onDocumentUpdated`)**: A trigger would fire on every session update across all projects — most invocations wasted no-ops. The Cloud Task approach has zero wasted invocations, is consistent with the existing architecture, and keeps `transformPipelineJob` self-contained (just one additional `queueX()` call). See [research.md](./research.md#r-001) for full analysis.

### AD-002: Callable Function for Email Write

**Pattern**: `onCall` callable (`submitGuestEmail`)

The guest calls this function from the loading screen to submit their email. The callable validates with Zod, verifies the session exists, and writes `guestEmail` to the session document.

**Why not direct Firestore write**: Constitution VII requires server-validated mutations. A callable provides Zod validation and prevents overwriting an already-submitted email.

### AD-003: Lazy Nodemailer Transporter

The SMTP transporter is created lazily (on first use) to avoid cold-start overhead. The transporter instance is cached at module scope for reuse across invocations within the same function instance.

### AD-004: EmailCaptureForm Co-located with ShareLoadingRenderer

`EmailCaptureForm` lives in `project-config/share/components/` alongside `ShareLoadingRenderer` — not in the `guest/` domain. This avoids a circular dependency:

```
guest/SharePage → project-config/share/ShareLoadingRenderer → guest/EmailCaptureForm  ← CYCLE
```

The form is fundamentally a sub-component of the loading screen, so co-locating it in `project-config/share/` is both correct and cycle-free. The `useSubmitGuestEmail` hook also lives in `project-config/share/hooks/` for the same reason.

### AD-005: Loading Screen Component Extensions

`ShareLoadingRenderer` gains new props:
- `session` (for job status and email state)
- `emailCaptureConfig` (from `shareLoading.emailCapture`)
- `onEmailSubmit` callback

The renderer conditionally shows the email capture form based on config and session state. The form is a separate `EmailCaptureForm` component for single-responsibility.

### AD-006: Email Capture Form State

The email form manages its own local state:
- `email` input value (controlled input)
- `isSubmitted` flag (hides form, shows confirmation)
- `isSubmitting` flag (disables button during mutation)
- `validationError` (inline error from client-side validation)

The form uses the existing `useTrackedMutation` pattern via a `useSubmitGuestEmail` hook that calls the `submitGuestEmail` callable.
