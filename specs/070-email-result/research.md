# Research: Email Result Delivery

**Branch**: `070-email-result` | **Date**: 2026-02-12

## R-001: Email Trigger Architecture

### Decision: Cloud Task (`sendSessionEmail`) + `submitGuestEmail` callable — two entry points, one utility

### Context

The feature requires email to be sent when two conditions are met simultaneously:
1. A guest email address exists on the session
2. The job is completed with result media available

The timing of these two events is non-deterministic — the guest may submit their email before or after the AI transform completes.

### Alternatives Considered

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **A. Firestore trigger** | `onDocumentUpdated` on sessions fires on every session update, checks conditions, sends email | Self-contained; handles both timing cases in one place; doesn't modify transform pipeline | Introduces new pattern (no existing Firestore triggers in codebase); fires on every session update — wasted invocations; cost scales with all session updates, not email usage |
| **B. Cloud Task + callable (chosen)** | `sendSessionEmail` task queued from pipeline on completion + callable checks and queues on email submission | Zero wasted invocations; consistent with existing Cloud Task pattern; keeps transform pipeline self-contained (one queue call) | Two entry points (but share same utility + task); small modification to transform pipeline |
| **C. Pure callable** | Callable sends immediately if result ready; transform pipeline calls email function on completion | No new patterns | Tightly couples transform pipeline to email logic; makes it a "god function" |

### Rationale

- **Zero wasted invocations**: Email logic only runs when it's actually relevant — when the pipeline completes or when a guest submits their email. Unlike a Firestore trigger, no invocations fire on unrelated session updates (responses, status changes, etc.)
- **Consistent with existing architecture**: Mirrors the `dispatchExports` → `dropboxExportWorker` pattern. The codebase uses Cloud Tasks and callables — not Firestore triggers
- **Transform pipeline stays self-contained**: Only adds one `queueSendSessionEmail()` call to `finalizeJobSuccess()` (same pattern as `queueDispatchExports()`). No email/SMTP knowledge leaks into the pipeline
- **Shared utility prevents divergence**: Both entry points queue the same `sendSessionEmail` task, which calls the same `sendResultEmail()` utility. The `emailSentAt` field guards against duplicates regardless of which path fires first

### Two Entry Points

**Entry 1 — Job completes (guest may or may not have submitted email):**
```
transformPipelineJob.finalizeJobSuccess()
  → queueDispatchExports(...)      // existing
  → queueSendSessionEmail(...)     // NEW — best-effort, same pattern
```
The `sendSessionEmail` task fetches the session, checks conditions, sends if met.

**Entry 2 — Guest submits email (job may or may not be completed):**
```
submitGuestEmail callable
  → write guestEmail to session
  → check if jobStatus === 'completed' && resultMedia exists
  → if yes: queueSendSessionEmail(...)
```

### Guest Email Write Path

To maintain the "deny writes, force mutations through server code" principle (Constitution VII), the guest writes their email via a **callable function** (`submitGuestEmail`), not a direct Firestore client write. This provides:
- Server-side Zod validation of the email
- Session ownership verification
- Clean separation of concerns

---

## R-002: Email Sending via Nodemailer + Google Workspace SMTP

### Decision: Nodemailer with Google Workspace SMTP (App Password)

### Context

Need to send transactional emails from `info@clementine-labs.com` with proper SPF/DKIM authentication.

### Configuration

- **Transport**: SMTP via `smtp.gmail.com:587` (TLS/STARTTLS)
- **Auth**: App Password stored as Firebase secret (`defineSecret`)
- **From**: `info@clementine-labs.com`
- **Limit**: 2,000 emails/day (Google Workspace limit — sufficient for photobooth volume)

### Why Not Other Services

| Service | Why Not |
|---------|---------|
| SendGrid/Mailgun/SES | Additional service signup; overkill for transactional-only emails |
| Firebase Extensions (Trigger Email) | Adds Firestore collection dependency; less control |
| Direct Gmail API | More complex OAuth flow; App Password is simpler |

### New Dependencies

- `nodemailer` (production dependency in `functions/`)
- `@types/nodemailer` (dev dependency in `functions/`)

### Secrets Required

- `SMTP_APP_PASSWORD`: Google Workspace App Password for `info@clementine-labs.com`

---

## R-003: Schema Extension Strategy

### Decision: Extend existing schemas with minimal additions

### Session Schema Changes

Add two nullable fields to `sessionSchema` in `packages/shared/`:
- `guestEmail: z.string().email().nullable().default(null)` — Guest's email address (PII)
- `emailSentAt: z.number().nullable().default(null)` — Timestamp when email was sent (duplicate guard)

These follow the existing pattern of nullable defaults used throughout the session schema.

### ShareLoadingConfig Changes

Extend `shareLoadingConfigSchema` with an `emailCapture` object:
```
emailCapture: z.object({
  enabled: z.boolean().default(false),
  heading: z.string().nullable().default(null),
}).nullable().default(null)
```

This nests under the existing `shareLoadingConfigSchema` in `project-config.schema.ts`, following the same nullable pattern used for `cta` in `shareReadyConfigSchema`.

---

## R-004: Loading Screen Visual Approach

### Decision: Replace Skeleton with themed Loader2 spinner + elapsed counter

### Current Implementation

`ShareLoadingRenderer` currently renders:
1. `<Skeleton>` (aspect-square, rounded) — image placeholder
2. `ThemedText` heading — loading title
3. `ThemedText` body — loading description

### New Implementation

Replace `<Skeleton>` with:
1. `<Loader2>` icon from lucide-react, styled with `theme.primaryColor` (same pattern as existing `ThemedLoading` component)
2. Elapsed time counter below the spinner — uses `useState` + `useEffect` interval, displays "0s", "1s", "2s", etc.

Add below title/description:
3. Email capture form (conditionally rendered based on `shareLoading.emailCapture?.enabled`)

### Existing Pattern Reference

`ThemedLoading` component at `src/shared/theming/components/primitives/ThemedLoading.tsx` already implements the themed spinner:
```tsx
<Loader2
  className="h-12 w-12 animate-spin opacity-60"
  style={{ color: theme.primaryColor }}
/>
```

The same approach will be used in `ShareLoadingRenderer`.

---

## R-005: Email HTML Template (v1)

### Decision: Simple inline HTML — no template engine

### Email Content

- **Subject**: "Your result is ready!"
- **From**: `info@clementine-labs.com`
- **Body**: Simple HTML with inline styles containing:
  - Heading: "Your result is ready!"
  - Result image (inline `<img>` using `resultMedia.url`)
  - CTA button linking to the share page URL
  - Footer with platform attribution

### Why No Template Engine

- v1 scope is a single, simple email template
- Inline HTML string is sufficient and avoids additional dependencies
- Template engines (Handlebars, mjml) would be premature optimization
