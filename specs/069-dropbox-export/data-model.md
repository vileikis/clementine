# Data Model: Dropbox Export Integration

**Feature**: 069-dropbox-export
**Date**: 2026-02-11

## Entity Overview

```
Workspace (existing)
  └── integrations.dropbox     ← NEW field (workspace-level Dropbox connection)

Project (existing)
  └── exports.dropbox          ← NEW field (project-level export toggle)
  └── exportLogs/{logId}       ← NEW subcollection (export attempt records)
```

## Schema Changes

### 1. Workspace Integration (Dropbox)

**Collection**: `workspaces/{workspaceId}`
**Change**: Add `integrations` field to existing workspace document

```typescript
// New schema: Dropbox integration status
const dropboxIntegrationStatusSchema = z.enum([
  'connected',      // OAuth complete, token valid
  'disconnected',   // No connection or explicitly disconnected
  'needs_reauth',   // Token revoked/expired, detected on export failure
])

// New schema: Dropbox integration config
const dropboxIntegrationSchema = z.object({
  status: dropboxIntegrationStatusSchema,
  accountEmail: z.string(),               // Dropbox account email
  accountDisplayName: z.string(),          // Dropbox display name
  encryptedRefreshToken: z.string(),       // AES-256-GCM encrypted token
  connectedBy: z.string(),                 // Firebase user ID who connected
  connectedAt: z.number(),                 // Unix ms timestamp
  scopes: z.array(z.string()),            // OAuth scopes granted (e.g., ["app_folder"])
})

// New schema: Workspace integrations map
const workspaceIntegrationsSchema = z.object({
  dropbox: dropboxIntegrationSchema.nullable().default(null),
})
```

**Firestore document shape** (new fields only):
```json
{
  "integrations": {
    "dropbox": {
      "status": "connected",
      "accountEmail": "user@example.com",
      "accountDisplayName": "Jane Smith",
      "encryptedRefreshToken": "iv:authTag:ciphertext",
      "connectedBy": "firebase-uid-123",
      "connectedAt": 1739308800000,
      "scopes": ["app_folder"]
    }
  }
}
```

**States**:
- `null` (field absent or null): Never connected
- `status: "connected"`: Active, healthy connection
- `status: "disconnected"`: Explicitly disconnected by user
- `status: "needs_reauth"`: Token invalid, detected reactively on 401

### 2. Project Export Configuration (Dropbox)

**Collection**: `projects/{projectId}`
**Change**: Add `exports` field to existing project document

```typescript
// New schema: Dropbox export config
const dropboxExportConfigSchema = z.object({
  enabled: z.boolean(),
  enabledBy: z.string(),        // Firebase user ID who toggled
  enabledAt: z.number(),        // Unix ms timestamp
})

// New schema: Project exports map
const projectExportsSchema = z.object({
  dropbox: dropboxExportConfigSchema.nullable().default(null),
})
```

**Firestore document shape** (new fields only):
```json
{
  "exports": {
    "dropbox": {
      "enabled": true,
      "enabledBy": "firebase-uid-123",
      "enabledAt": 1739308800000
    }
  }
}
```

**States**:
- `null` (field absent or null): Never configured — export disabled
- `enabled: false`: Explicitly disabled
- `enabled: true`: Export active (requires workspace-level connection to function)

### 3. Export Log

**Collection**: `projects/{projectId}/exportLogs/{logId}`
**Change**: New subcollection

```typescript
const exportLogSchema = z.object({
  id: z.string(),
  jobId: z.string(),                                    // Reference to the transform job
  sessionId: z.string(),                                // Reference to the session
  provider: z.enum(['dropbox']),                        // Extensible for future providers
  status: z.enum(['success', 'failed']),
  destinationPath: z.string().nullable().default(null), // e.g., "/ProjectName/ExperienceName/file.jpg"
  error: z.string().nullable().default(null),           // Error message if failed
  createdAt: z.number(),                                // Unix ms timestamp
})
```

**Firestore document shape**:
```json
{
  "id": "log-abc123",
  "jobId": "job-xyz789",
  "sessionId": "session-def456",
  "provider": "dropbox",
  "status": "success",
  "destinationPath": "/ProjectName/ExperienceName/2026-02-11_19-24-03_session-8F3K_result.jpg",
  "error": null,
  "createdAt": 1739308800000
}
```

## Cloud Task Payloads

### dispatchExports Payload

```typescript
const dispatchExportsPayloadSchema = z.object({
  jobId: z.string(),
  projectId: z.string(),
  sessionId: z.string(),
  resultMedia: z.object({
    url: z.string(),
    filePath: z.string(),
    displayName: z.string(),
  }),
})
```

### dropboxExportWorker Payload

```typescript
const dropboxExportPayloadSchema = z.object({
  jobId: z.string(),
  projectId: z.string(),
  sessionId: z.string(),
  workspaceId: z.string(),
  resultMedia: z.object({
    url: z.string(),
    filePath: z.string(),
    displayName: z.string(),
  }),
})
```

## Relationships

```
Workspace 1 ←→ 0..1 DropboxIntegration (embedded in workspace doc)
Project N ←→ 1 Workspace (via workspaceId)
Project 1 ←→ 0..1 DropboxExportConfig (embedded in project doc)
Project 1 ←→ N ExportLog (subcollection)
ExportLog N ←→ 1 Job (via jobId reference)
ExportLog N ←→ 1 Session (via sessionId reference)
```

## Indexes

No new composite indexes required for v1:
- Export logs are written by the backend and queried by `projectId` (already the parent collection)
- No frontend query on export logs in v1

## Firestore Security Rules Additions

```firestore
// Workspace: integrations field is writable only via Admin SDK (server functions)
// Existing rule already covers this: admins can read/update workspaces

// Project: exports field follows existing project rules
// Existing rule already covers this: admins can read/update projects

// Export logs: server-only writes, admin reads
match /projects/{projectId}/exportLogs/{logId} {
  allow read: if isAdmin();
  allow create, update, delete: if false;  // Server-only via Admin SDK
}
```

## Schema Compatibility

Both `workspaceSchema` and `projectSchema` use `z.looseObject()` in shared schemas, which means:
- New fields (`integrations`, `exports`) can be added to Firestore documents without updating the base schema immediately
- Existing code that reads workspaces/projects will not break — unknown fields are passed through
- New schemas for the integration/export fields are defined separately and validated only where needed
- Gradual migration: documents without the new fields default to `null` (no integration, no export config)
