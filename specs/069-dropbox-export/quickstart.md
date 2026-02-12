# Quickstart: Dropbox Export Integration

**Feature**: 069-dropbox-export
**Date**: 2026-02-11

## Prerequisites

### Dropbox App Registration

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app:
   - API: Scoped Access
   - Access type: **App folder** (NOT Full Dropbox)
   - Name: `Clementine` (or your dev instance name)
3. In the app settings:
   - Copy **App key** (client ID)
   - Copy **App secret** (only needed for server-side token exchange)
   - Add redirect URI: `https://<your-domain>/workspace/*/integrations/dropbox/callback`
   - For local dev: `http://localhost:3000/workspace/*/integrations/dropbox/callback`

### Environment Variables

**TanStack Start App** (`apps/clementine-app/.env`):
```bash
# Dropbox OAuth (public - used in client redirect)
VITE_DROPBOX_APP_KEY=your_dropbox_app_key

# Dropbox OAuth (server-only - used in token exchange)
DROPBOX_APP_SECRET=your_dropbox_app_secret
DROPBOX_TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key
```

Generate an encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Firebase Cloud Functions** (`functions/.env`):
```bash
# Dropbox token decryption (same key as app)
DROPBOX_TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key
```

## Development Flow

### 1. Start the dev server

```bash
pnpm app:dev
```

### 2. Test the OAuth flow

1. Navigate to any project's **Connect** tab
2. Click **Connect Dropbox**
3. Complete the Dropbox OAuth consent
4. Verify the Connect tab shows "Connected" with your email

### 3. Test the export flow

1. Enable export on a project (toggle ON)
2. Run a guest experience that generates a result
3. Check your Dropbox at `/Apps/Clementine/<ProjectName>/<ExperienceName>/`
4. Verify the result file appears with correct naming

### 4. Test disconnection

1. Click **Disconnect** on the Connect tab
2. Verify the Connect tab returns to "not connected" state
3. Run another experience — verify no export occurs

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (TanStack Start App)                          │
│                                                         │
│  Connect Tab                                            │
│  ├── DropboxCard (state-based UI)                       │
│  ├── initiateDropboxOAuthFn (server fn → auth URL)      │
│  ├── disconnectDropboxFn (server fn → revoke + delete)  │
│  └── toggleDropboxExportFn (server fn → toggle config)  │
│                                                         │
│  OAuth Callback Route                                   │
│  └── handleDropboxCallbackFn (exchange code → store)    │
└────────────────────────────────┬────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────┐
│  Backend (Firebase Cloud Functions)                      │
│                                 │                        │
│  transformPipelineJob           │                        │
│  └── on success → enqueue dispatchExports               │
│                                                         │
│  dispatchExports (Cloud Task)                           │
│  └── reads live config → enqueue dropboxExportWorker    │
│                                                         │
│  dropboxExportWorker (Cloud Task)                       │
│  ├── download from Firebase Storage                     │
│  ├── upload to Dropbox /files/upload                    │
│  └── write exportLog                                    │
└─────────────────────────────────────────────────────────┘
```

## Key Files (planned)

### Shared Schemas (`packages/shared/`)
- `src/schemas/workspace/workspace-integration.schema.ts` — Dropbox integration schema
- `src/schemas/project/project-exports.schema.ts` — Project export config schema
- `src/schemas/export/export-log.schema.ts` — Export log schema

### Frontend (`apps/clementine-app/`)
- `src/domains/project/connect/components/DropboxCard.tsx` — Integration card
- `src/domains/project/connect/containers/ConnectPage.tsx` — Page container
- `src/domains/project/connect/hooks/useDropboxConnection.ts` — Connection state hook
- `src/domains/project/connect/hooks/useDropboxExport.ts` — Export toggle hook
- `src/domains/project/connect/server/functions.ts` — OAuth server functions
- `src/app/workspace/$workspaceSlug.integrations.dropbox.callback.tsx` — OAuth callback route

### Backend (`functions/`)
- `src/tasks/dispatchExports.ts` — Export dispatcher task
- `src/tasks/dropboxExportWorker.ts` — Dropbox upload task
- `src/services/export/dropbox.service.ts` — Dropbox API client (upload, token refresh)
- `src/services/export/encryption.service.ts` — Token encryption/decryption
- `src/repositories/workspace.ts` — Workspace integration CRUD
- `src/repositories/export-log.ts` — Export log writes

### Firestore Rules
- `firebase/firestore.rules` — Add exportLogs subcollection rules
