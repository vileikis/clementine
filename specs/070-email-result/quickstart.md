# Quickstart: Email Result Delivery

**Branch**: `070-email-result` | **Date**: 2026-02-12

## Prerequisites

1. **Node.js 20+** and **pnpm 10.18.1**
2. **Firebase CLI** installed and authenticated
3. Access to Firebase project with Cloud Functions enabled
4. Google Workspace App Password for `info@clementine-labs.com`

## Setup

### 1. Install Dependencies

```bash
# From monorepo root
pnpm install

# Add nodemailer to Cloud Functions
pnpm add nodemailer --filter @clementine/functions
pnpm add -D @types/nodemailer --filter @clementine/functions
```

### 2. Configure SMTP Secret

```bash
# Local development: add to functions/.secret.local
echo "SMTP_APP_PASSWORD=your-app-password-here" >> functions/.secret.local

# Production: set via Firebase CLI
firebase functions:secrets:set SMTP_APP_PASSWORD
```

### 3. Build Shared Package

```bash
pnpm --filter @clementine/shared build
```

### 4. Start Development

```bash
# Terminal 1: Start the TanStack Start app
pnpm app:dev

# Terminal 2: Serve Cloud Functions locally
pnpm functions:serve
```

## Verification Steps

### Schema Changes

```bash
# Verify shared package builds with new schema fields
pnpm --filter @clementine/shared build
pnpm --filter @clementine/shared test
```

### Cloud Functions

```bash
# Verify functions build with new trigger and callable
pnpm functions:build
```

### Frontend

```bash
# Verify app builds with new components
pnpm app:build
pnpm app:type-check
```

## Testing the Feature

### End-to-End Flow

1. Create a project and enable email capture in Share Editor → Loading tab
2. Publish the project
3. Open the guest share link, upload a photo
4. On the loading screen, enter an email address and submit
5. Wait for AI transform to complete
6. Verify email arrives with result link

### Edge Cases to Test

- Submit email **after** result is already ready (immediate send)
- Submit email **before** result is ready (send on completion)
- Disable email capture toggle → verify form is hidden
- Enter invalid email → verify inline validation error
- Double-click submit → verify no duplicate submission

## Key Files

| Area | Files |
|------|-------|
| **Shared Schemas** | `packages/shared/src/schemas/session/session.schema.ts`, `packages/shared/src/schemas/project/project-config.schema.ts` |
| **Cloud Functions** | `functions/src/tasks/sendSessionEmail.ts`, `functions/src/callable/submitGuestEmail.ts`, `functions/src/services/email/email.service.ts` |
| **Guest Loading Screen** | `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingRenderer.tsx` |
| **Email Capture Form** | `apps/clementine-app/src/domains/project-config/share/components/EmailCaptureForm.tsx` |
| **Creator Config** | `apps/clementine-app/src/domains/project-config/share/components/ShareLoadingConfigPanel.tsx` |
