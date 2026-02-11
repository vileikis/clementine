# Implementation Plan: Dropbox Export Integration

**Branch**: `069-dropbox-export` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/069-dropbox-export/spec.md`

## Summary

Automatically export AI-generated photo results to a workspace's connected Dropbox account, organized by project and experience. The feature spans three layers: (1) TanStack Start server functions for OAuth connect/disconnect, (2) a Connect tab UI for managing the integration and per-project export toggle, and (3) Firebase Cloud Tasks for async export dispatch and Dropbox file upload after each successful pipeline job.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, Firebase SDK 12.5.0, Firebase Cloud Functions v2, Dropbox API (HTTP — no SDK), Zod 4.1.12
**Storage**: Firebase Firestore (workspace integration config, project export config, export logs), Firebase Storage (result media source)
**Testing**: Vitest (shared package), manual integration testing for OAuth flow
**Target Platform**: Web (TanStack Start on Firebase App Hosting) + Cloud Functions (Node.js on GCP)
**Project Type**: Web application (monorepo: frontend app + backend functions + shared schemas)
**Performance Goals**: Export completes within 2 minutes of job completion; OAuth connect flow under 30 seconds
**Constraints**: App Folder scope only (no full Dropbox access); single-request upload (150MB limit); image-only exports in v1
**Scale/Scope**: One Dropbox account per workspace; export toggle per project; ~3 new Cloud Tasks, ~4 server functions, ~6 frontend components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First Design | PASS | Connect tab is a creator-facing admin page (desktop-primary); card layout works on both mobile and desktop |
| II. Clean Code & Simplicity | PASS | No unnecessary abstractions; dispatcher + worker is minimum viable architecture for failure isolation |
| III. Type-Safe Development | PASS | All new schemas use Zod; strict TypeScript; server function inputs validated |
| IV. Minimal Testing Strategy | PASS | Unit tests for encryption utility and schema validation; integration testing via manual OAuth flow |
| V. Validation Gates | PASS | All code will pass format/lint/type-check before commit; standards compliance review before merge |
| VI. Frontend Architecture | PASS | Client-first: workspace/project data read via Firestore client SDK with real-time listeners; mutations via server functions |
| VII. Backend & Firebase | PASS | Admin SDK for Cloud Functions (write export logs, update integration status); Firestore rules enforce access control |
| VIII. Project Structure | PASS | New code follows vertical slice architecture within existing domain modules |

**Post-Phase 1 re-check**: All principles still satisfied. The encryption utility adds one function (not an abstraction layer). Cloud Task fan-out is the established pattern.

## Project Structure

### Documentation (this feature)

```text
specs/069-dropbox-export/
├── plan.md              # This file
├── research.md          # Phase 0: Research decisions
├── data-model.md        # Phase 1: Schema definitions
├── quickstart.md        # Phase 1: Dev setup guide
├── contracts/           # Phase 1: API contracts
│   ├── dropbox-oauth.yaml
│   └── export-tasks.yaml
└── tasks.md             # Phase 2: Implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
├── workspace/
│   ├── workspace.schema.ts              # MODIFY: (looseObject already handles new fields)
│   └── workspace-integration.schema.ts  # NEW: Dropbox integration schema
├── project/
│   ├── project.schema.ts                # MODIFY: (looseObject already handles new fields)
│   └── project-exports.schema.ts        # NEW: Project export config schema
├── export/
│   └── export-log.schema.ts             # NEW: Export log schema
└── index.ts                             # MODIFY: Re-export new schemas

apps/clementine-app/src/
├── domains/project/connect/
│   ├── components/
│   │   ├── DropboxCard.tsx              # NEW: Integration card (state-based UI)
│   │   └── index.ts                     # NEW: Barrel export
│   ├── containers/
│   │   └── ConnectPage.tsx              # MODIFY: Replace WipPlaceholder with real UI
│   ├── hooks/
│   │   ├── useDropboxConnection.ts      # NEW: Read workspace Dropbox integration state
│   │   ├── useDropboxExport.ts          # NEW: Read/write project export toggle
│   │   └── index.ts                     # NEW: Barrel export
│   ├── server/
│   │   ├── functions.ts                 # NEW: OAuth + toggle server functions
│   │   └── index.ts                     # NEW: Barrel export
│   └── index.ts                         # MODIFY: Re-export new modules
├── app/workspace/
│   └── $workspaceSlug.integrations.dropbox.callback.tsx  # NEW: OAuth callback route

functions/src/
├── tasks/
│   ├── dispatchExports.ts               # NEW: Export dispatcher (reads config, fans out)
│   └── dropboxExportWorker.ts           # NEW: Dropbox upload worker
├── services/export/
│   ├── dropbox.service.ts               # NEW: Dropbox API client (token refresh, upload)
│   ├── encryption.service.ts            # NEW: AES-256-GCM encrypt/decrypt
│   └── index.ts                         # NEW: Barrel export
├── repositories/
│   ├── workspace.ts                     # NEW: Workspace integration CRUD
│   └── export-log.ts                    # NEW: Export log writes
├── schemas/
│   └── export.schema.ts                 # NEW: Cloud Task payload schemas
└── index.ts                             # MODIFY: Export new Cloud Tasks

firebase/
└── firestore.rules                      # MODIFY: Add exportLogs subcollection rules
```

**Structure Decision**: This feature touches all three workspaces in the monorepo (shared schemas, frontend app, backend functions) following the existing architecture. New code is organized by domain within each workspace. The Connect tab UI lives in the existing `domains/project/connect/` module. Backend export logic is a new `services/export/` module following the `services/transform/` pattern.

## Complexity Tracking

No constitution violations. The dispatcher + worker Cloud Task pattern matches the existing `startTransformPipeline` → `transformPipelineJob` pattern. No new abstractions beyond what already exists.
