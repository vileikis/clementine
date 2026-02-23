# Data Model: Dropbox Video Export & Email Video Handling

**Feature Branch**: `079-dropbox-email-video`
**Date**: 2026-02-23

---

## Schema Changes

This feature modifies existing schemas rather than introducing new entities. All changes are additive (backward compatible).

---

### 1. Email Payload Schema (Modified)

**File**: `packages/shared/src/schemas/email/email.schema.ts`

**Current State**:
```
sendSessionEmailPayloadSchema:
  - projectId: string (min 1)
  - sessionId: string (min 1)
  - resultMedia:
    - url: string (min 1)
    - filePath: string (min 1)
    - displayName: string (min 1)
```

**New Fields**:
```
sendSessionEmailPayloadSchema:
  - projectId: string (min 1)
  - sessionId: string (min 1)
  - resultMedia:
    - url: string (min 1)
    - filePath: string (min 1)
    - displayName: string (min 1)
  + format: enum('image', 'gif', 'video')        # NEW — media type discriminator
  + thumbnailUrl: string | null (default null)     # NEW — video thumbnail for email
  + resultPageUrl: string | null (default null)    # NEW — link to hosted result page
```

**Validation Rules**:
- `format` is required (no default — must be explicitly set by caller)
- `thumbnailUrl` is required when `format === 'video'` (enforced at task handler level, not schema level)
- `resultPageUrl` is required when `format === 'video'` (enforced at task handler level)

**Backward Compatibility**:
- New fields have defaults (`null`) so existing callers that don't set them won't break schema validation
- `format` should default to `'image'` for backward compatibility with existing image-only callers

---

### 2. Dropbox Export Payload Schema (Modified)

**File**: `functions/src/tasks/exportDropboxTask.ts` (inline schema or shared)

**Current State**:
```
DropboxExportPayload:
  - projectId: string
  - sessionId: string
  - jobId: string
  - workspaceId: string
  - filePath: string
  - createdAt: number
```

**New Fields**:
```
DropboxExportPayload:
  - projectId: string
  - sessionId: string
  - jobId: string
  - workspaceId: string
  - filePath: string
  - createdAt: number
  + sizeBytes: number (positive integer)    # NEW — for pre-upload size validation
```

**Validation Rules**:
- `sizeBytes` must be a positive integer
- Export task rejects if `sizeBytes > 524_288_000` (500MB)

---

### 3. Export Log Schema (Unchanged)

**File**: `packages/shared/src/schemas/export/export-log.schema.ts`

The existing `ExportLog` schema already captures all needed failure information:
```
ExportLog:
  - id: string
  - jobId: string
  - sessionId: string
  - provider: 'dropbox'
  - status: 'success' | 'failed'
  - destinationPath: string | null
  - error: string | null
  - createdAt: number
```

No changes needed — the `error` field captures failure context (FR-005).

---

### 4. JobOutput Schema (Unchanged — Reference Only)

**File**: `packages/shared/src/schemas/job/job.schema.ts`

Already contains all fields needed by this feature:
```
JobOutput:
  - assetId: string
  - url: URL
  - filePath: string
  - format: enum('image', 'gif', 'video')    # Already tracks media type
  - dimensions: { width: int, height: int }
  - sizeBytes: positive int                    # Already tracks file size
  - thumbnailUrl: URL | null                   # Already stores thumbnail
  - processingTimeMs: nonnegative int
```

No changes needed.

---

## Entity Relationships

```
Session (existing)
  ├── resultMedia: MediaReference
  ├── jobId → Job
  ├── guestEmail: string
  └── emailSentAt: number

Job (existing)
  └── output: JobOutput
      ├── format: 'image' | 'gif' | 'video'
      ├── sizeBytes: number
      └── thumbnailUrl: URL | null

Project (existing)
  ├── exports.dropbox: DropboxExportConfig
  └── exportLogs/{logId}: ExportLog

Workspace (existing)
  └── integrations.dropbox: DropboxIntegration
      ├── encryptedRefreshToken
      └── status: 'connected' | 'disconnected' | 'needs_reauth'
```

---

## State Transitions

### Dropbox Export Flow (Video)

```
dispatchExportsTask triggered
  │
  ├─ Validate sizeBytes ≤ 500MB
  │   └─ If exceeds: log ExportLog(status: 'failed', error: 'file_size_exceeded') → END
  │
  ├─ Enqueue exportDropboxTask with sizeBytes
  │
  exportDropboxTask triggered
  │
  ├─ Validate workspace connected
  │   └─ If not: log failure → END
  │
  ├─ Refresh access token
  │   └─ If invalid_grant: mark needs_reauth, log failure → END
  │
  ├─ Download file from Firebase Storage
  │
  ├─ Choose upload method:
  │   ├─ sizeBytes ≤ 150MB → single upload (existing)
  │   └─ sizeBytes > 150MB → chunked upload session
  │       ├─ upload_session/start
  │       ├─ upload_session/append_v2 (repeated, 8MB chunks)
  │       └─ upload_session/finish
  │
  ├─ On success: log ExportLog(status: 'success') → END
  └─ On failure: throw → Cloud Task retries (max 3)
```

### Email Flow (Video)

```
Job completes (transformPipelineTask)
  │
  ├─ Read job.output.format, job.output.thumbnailUrl
  │
  ├─ Build resultPageUrl: /join/{projectId}/share?session={sessionId}
  │
  ├─ Queue sendSessionEmailTask with:
  │   - format: job.output.format
  │   - thumbnailUrl: job.output.thumbnailUrl
  │   - resultPageUrl: built URL
  │
  sendSessionEmailTask triggered
  │
  ├─ If format === 'video':
  │   ├─ Use thumbnailUrl for email image (or placeholder if null)
  │   ├─ Subject: "Your result is ready!"
  │   ├─ Copy: "Here's your AI-generated video"
  │   └─ CTA: "Watch Your Video" → resultPageUrl
  │
  └─ If format === 'image' or 'gif':
      ├─ Embed resultMedia.url directly in email
      ├─ Copy: "Here's your AI-generated photo"
      └─ CTA: "View & Download" → resultMedia.url (existing behavior)
```
