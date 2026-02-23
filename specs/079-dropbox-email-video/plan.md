# Implementation Plan: Dropbox Video Export & Email Video Handling

**Branch**: `079-dropbox-email-video` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/079-dropbox-email-video/spec.md`

## Summary

Enable reliable video export to Dropbox using chunked upload sessions (for files up to 500MB) and modify result email delivery to show a thumbnail preview with a "Watch Your Video" CTA for video media types instead of embedding the video directly. This is a backend-focused feature that modifies existing Cloud Functions (export pipeline, email service) and extends existing Zod schemas.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: Firebase Cloud Functions v2, Firebase Admin SDK, Dropbox API (HTTP — no SDK), Nodemailer, FFmpeg (via ffmpeg-static)
**Storage**: Firebase Firestore (workspace integrations, project exports, export logs), Firebase Storage (video/image files, thumbnails)
**Testing**: Vitest
**Target Platform**: Firebase Cloud Functions (Node.js 18+ runtime)
**Project Type**: Web (monorepo — functions/ backend, apps/clementine-app/ frontend, packages/shared/ schemas)
**Performance Goals**: >99% export success rate, email send within 60s of job completion
**Constraints**: Cloud Functions 512MB memory limit (export task), 120s timeout (export task), 8MB chunk size for chunked uploads
**Scale/Scope**: Files up to 500MB, existing Cloud Task retry infrastructure (3 attempts with exponential backoff)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Backend-only feature; no UI changes |
| II. Clean Code & Simplicity | PASS | Extends existing services with minimal new code; no new abstractions needed |
| III. Type-Safe Development | PASS | All schema changes use Zod; new fields are typed; strict mode enforced |
| IV. Minimal Testing Strategy | PASS | Tests focused on critical paths: chunked upload logic, email template branching |
| V. Validation Gates | PASS | Will run `pnpm functions:build` for type-check; manual standards review before completion |
| VI. Frontend Architecture | N/A | No frontend changes (email template is server-side HTML generation) |
| VII. Backend & Firebase | PASS | Uses existing Cloud Task patterns, Firestore repositories, Storage access |
| VIII. Project Structure | PASS | Changes are within existing feature modules (export/, email/); no new domains |

**Post-Design Re-check**: All gates still pass. No new abstractions, no new domains, no constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/079-dropbox-email-video/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Schema changes
├── quickstart.md        # Setup and testing guide
├── contracts/
│   ├── dropbox-chunked-upload.yaml   # Dropbox upload session API contracts
│   └── email-video-template.yaml     # Email template contracts for video
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
functions/src/
├── services/
│   ├── export/
│   │   └── dropbox.service.ts          # MODIFY: Add uploadLargeFile() chunked upload
│   └── email/
│       ├── email.service.ts            # MODIFY: Accept format/thumbnailUrl params
│       └── templates/
│           └── resultEmail.ts          # MODIFY: Branch HTML on media type
├── tasks/
│   ├── exportDropboxTask.ts            # MODIFY: Size validation, route to chunked upload
│   ├── dispatchExportsTask.ts          # MODIFY: Pass sizeBytes in payload
│   ├── sendSessionEmailTask.ts         # MODIFY: Read format, pass to email service
│   └── transformPipelineTask.ts        # MODIFY: Include format/thumbnailUrl when queuing email
├── callable/
│   └── submitGuestEmail.ts             # MODIFY: Include format/thumbnailUrl when queuing email
└── infra/
    └── storage.ts                      # READ ONLY: Download file for chunked upload

packages/shared/src/schemas/
└── email/
    └── email.schema.ts                 # MODIFY: Add format, thumbnailUrl, resultPageUrl fields
```

**Structure Decision**: This feature works entirely within existing modules. No new domains, services, or directories need to be created. All changes are modifications to existing files plus the new `uploadLargeFile()` function within the existing `dropbox.service.ts`.

## Complexity Tracking

No constitution violations. All changes follow existing patterns:
- Chunked upload extends existing `dropbox.service.ts` (same HTTP pattern, new endpoints)
- Email template branching is a simple conditional in existing template function
- Schema changes are additive with backward-compatible defaults
