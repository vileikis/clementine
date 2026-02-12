# Data Model: Email Result Delivery

**Branch**: `070-email-result` | **Date**: 2026-02-12

## Schema Changes

### 1. Session Schema (packages/shared)

**File**: `packages/shared/src/schemas/session/session.schema.ts`

**New Fields** (added to `sessionSchema`):

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `guestEmail` | `z.string().email().nullable()` | `null` | Guest's email address for result delivery. PII — stored only on session, never logged. |
| `emailSentAt` | `z.number().nullable()` | `null` | Unix timestamp (ms) when result email was sent. Guards against duplicate sends. |

**Zod Definition**:
```typescript
/** Guest email for result delivery (PII — do not log) */
guestEmail: z.string().email().nullable().default(null),

/** Timestamp when result email was sent (Unix ms, duplicate guard) */
emailSentAt: z.number().nullable().default(null),
```

**Rationale**: Follows existing session schema patterns — nullable fields with `.default(null)` for Firestore compatibility. `z.looseObject()` ensures forward compatibility.

---

### 2. ShareLoadingConfig Schema (packages/shared)

**File**: `packages/shared/src/schemas/project/project-config.schema.ts`

**New Nested Object** (added to `shareLoadingConfigSchema`):

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `emailCapture` | Object (nullable) | `null` | Email capture configuration |
| `emailCapture.enabled` | `z.boolean()` | `false` | Whether email capture form is shown on loading screen |
| `emailCapture.heading` | `z.string().nullable()` | `null` | Custom heading text (default: "Get your result by email") |

**New Schema Definition**:
```typescript
export const emailCaptureConfigSchema = z.object({
  enabled: z.boolean().default(false),
  heading: z.string().nullable().default(null),
})

export const shareLoadingConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  emailCapture: emailCaptureConfigSchema.nullable().default(null),
})
```

**New Type Export**:
```typescript
export type EmailCaptureConfig = z.infer<typeof emailCaptureConfigSchema>
```

**Rationale**: Nesting under `shareLoadingConfig` keeps email capture configuration co-located with the loading screen config it controls. Follows the same nullable object pattern used by `cta` in `shareReadyConfigSchema`.

---

## Entity Relationships

```
Project
└── publishedConfig / draftConfig
    └── shareLoading
        ├── title
        ├── description
        └── emailCapture          ← NEW
            ├── enabled
            └── heading

Session
├── ... (existing fields)
├── guestEmail                    ← NEW
├── emailSentAt                   ← NEW
├── jobStatus
└── resultMedia
```

## State Transitions

### Email Sending State Machine

```
Session States:
┌─────────────────┬────────────────┬──────────────┬────────────┐
│ guestEmail      │ jobStatus      │ resultMedia  │ emailSentAt│
├─────────────────┼────────────────┼──────────────┼────────────┤
│ null            │ pending/running│ null         │ null       │ → No action
│ "user@test.com" │ pending/running│ null         │ null       │ → Wait for job
│ null            │ completed      │ {url: ...}   │ null       │ → Wait for email
│ "user@test.com" │ completed      │ {url: ...}   │ null       │ → SEND EMAIL
│ "user@test.com" │ completed      │ {url: ...}   │ 171234...  │ → Already sent
└─────────────────┴────────────────┴──────────────┴────────────┘
```

### Email Send Conditions (all must be true)

1. `guestEmail !== null` (email submitted)
2. `jobStatus === 'completed'` (transform finished)
3. `resultMedia !== null` (result available)
4. `emailSentAt === null` (not yet sent)

## Firestore Indexes

No additional composite indexes required. The `onDocumentUpdated` trigger operates on individual document changes, not queries.

## Security Considerations

- `guestEmail` is PII — stored only on the session document
- Never log `guestEmail` in Cloud Functions logs
- `emailSentAt` serves dual purpose: audit trail + duplicate prevention
- SMTP App Password stored as Firebase secret (`defineSecret`), not in `.env`
