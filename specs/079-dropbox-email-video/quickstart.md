# Quickstart: Dropbox Video Export & Email Video Handling

**Feature Branch**: `079-dropbox-email-video`

---

## Prerequisites

- Node.js 18+
- pnpm 10.18.1
- Firebase CLI
- Access to Firebase project (Firestore, Storage, Cloud Functions)
- Dropbox app credentials (DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_TOKEN_ENCRYPTION_KEY)
- SMTP credentials (SMTP_APP_PASSWORD)

## Setup

```bash
# 1. Clone and checkout feature branch
git checkout 079-dropbox-email-video

# 2. Install dependencies
pnpm install

# 3. Build shared package (dependency for functions)
pnpm --filter @clementine/shared build

# 4. Build functions
pnpm functions:build
```

## Key Files to Modify

### Part A: Dropbox Chunked Upload

| File | Change |
|------|--------|
| `functions/src/services/export/dropbox.service.ts` | Add `uploadLargeFile()` with chunked upload session logic |
| `functions/src/tasks/exportDropboxTask.ts` | Add size validation, route to chunked upload for large files |
| `functions/src/tasks/dispatchExportsTask.ts` | Pass `sizeBytes` in export task payload |

### Part B: Email Video Handling

| File | Change |
|------|--------|
| `packages/shared/src/schemas/email/email.schema.ts` | Add `format`, `thumbnailUrl`, `resultPageUrl` to payload schema |
| `functions/src/services/email/templates/resultEmail.ts` | Branch template on media type (video vs image) |
| `functions/src/services/email/email.service.ts` | Accept and pass new fields to template |
| `functions/src/tasks/sendSessionEmailTask.ts` | Read format from payload, pass to email service |
| `functions/src/tasks/transformPipelineTask.ts` | Include format/thumbnailUrl when queuing email task |
| `functions/src/callable/submitGuestEmail.ts` | Include format/thumbnailUrl when queuing email task |

## Testing

### Local Testing (Functions)

```bash
# Build and serve functions locally
cd functions
pnpm build
pnpm serve
```

### Manual Verification

**Dropbox Chunked Upload**:
1. Create a test video file > 150MB
2. Upload to Firebase Storage at a test session path
3. Trigger `exportDropboxTask` with the test payload
4. Verify file appears in Dropbox with correct name and size
5. Check logs for chunk progress entries

**Email Video Handling**:
1. Complete an AI video job in the platform
2. Verify the email contains a thumbnail image (not embedded video)
3. Verify the "Watch Your Video" CTA links to the result page
4. Click the CTA and verify video plays on the result page
5. Complete an image job and verify existing embed behavior is unchanged

## Architecture Reference

```
transformPipelineTask (job completes)
  ├── queueDispatchExports() ─→ dispatchExportsTask ─→ exportDropboxTask
  │                                                      ├── sizeBytes ≤ 150MB → single upload
  │                                                      └── sizeBytes > 150MB → chunked upload
  └── queueSendSessionEmail() ─→ sendSessionEmailTask
                                    ├── format === 'video' → thumbnail + CTA
                                    └── format === 'image' → embed directly
```
