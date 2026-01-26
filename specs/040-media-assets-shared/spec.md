# Feature Specification: Media Assets Shared Schema

**Feature Branch**: `040-media-assets-shared`
**Created**: 2026-01-26
**Status**: Draft
**Input**: User description: "Move media assets schema to shared package and unify media reference patterns across the codebase"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Uses Unified Media Schema (Priority: P1)

A developer working on either the frontend app or cloud functions needs to reference media assets. They import schemas from the shared package and get consistent type safety across the entire codebase. No more duplicated schema definitions or mismatched types between frontend and backend.

**Why this priority**: Foundation for all other work. Without centralized schemas, the codebase continues to have duplicated definitions that can drift out of sync.

**Independent Test**: Can be tested by importing the new schemas from `@clementine/shared` in both `apps/clementine-app` and `functions/`, verifying TypeScript compilation succeeds and types match.

**Acceptance Scenarios**:

1. **Given** a developer in the clementine-app, **When** they import `mediaAssetSchema` from `@clementine/shared`, **Then** they get the full MediaAsset document type with all fields (id, fileName, filePath, url, mimeType, etc.)

2. **Given** a developer in cloud functions, **When** they import `mediaReferenceSchema` from `@clementine/shared`, **Then** they get a type with `mediaAssetId`, `url`, and optional `filePath`

3. **Given** a developer in any workspace, **When** they import `imageMimeTypeSchema` from `@clementine/shared`, **Then** they get the enum of allowed MIME types (image/png, image/jpeg, image/jpg, image/webp, image/gif)

---

### User Story 2 - Cloud Function Accesses Storage via filePath (Priority: P2)

A cloud function processing media needs to download files from Firebase Storage. Instead of parsing download URLs (which vary between emulator and production) or making additional Firestore lookups, the function directly uses the `filePath` field from the media reference to construct the storage path.

**Why this priority**: Removes fragile URL parsing logic and unnecessary database lookups. Directly enables simpler, more reliable cloud function code.

**Independent Test**: Can be tested by having a cloud function receive a media reference with `filePath`, use it to download from storage, and verify success without any URL parsing.

**Acceptance Scenarios**:

1. **Given** a media reference with `filePath: "workspaces/ws-123/media/overlay-abc.png"`, **When** a cloud function needs to download the file, **Then** it can directly use the filePath with `storage.bucket().file(filePath)` without parsing

2. **Given** existing documents without `filePath`, **When** reading them with the new schema, **Then** `filePath` is `null` and the system falls back to URL parsing (backward compatibility)

---

### User Story 3 - Existing App Functionality Continues Working (Priority: P2)

All existing features that use media references (theme backgrounds, overlays, experience media, info step media) continue working without any data migration. The refactored schemas are backward compatible with existing Firestore documents.

**Why this priority**: Zero-downtime migration is critical. Existing users must not experience any disruption.

**Independent Test**: Can be tested by loading existing documents from Firestore and verifying they parse successfully with the new schemas.

**Acceptance Scenarios**:

1. **Given** an existing theme document with `background.image: { mediaAssetId: "...", url: "..." }`, **When** parsed with the new `mediaReferenceSchema`, **Then** validation succeeds and `filePath` defaults to `null`

2. **Given** an existing overlay reference without `filePath`, **When** the app renders the overlay, **Then** it uses the `url` field directly as before

3. **Given** a newly created media reference, **When** the upload completes, **Then** the reference includes `filePath` alongside `mediaAssetId` and `url`

---

### User Story 4 - Upload Logic is Reusable (Priority: P3)

The media upload orchestration logic (validate file, extract dimensions, upload to storage, create Firestore document) is available as a standalone service function. The React hook becomes a thin wrapper that integrates with TanStack Query.

**Why this priority**: Enables better testing, potential reuse in non-React contexts, and cleaner separation of concerns.

**Independent Test**: Can be tested by calling the upload service function directly in a unit test without React/TanStack Query context.

**Acceptance Scenarios**:

1. **Given** a file and workspace context, **When** calling the `uploadMediaAsset` service function, **Then** it returns a promise with `{ mediaAssetId, url, filePath }`

2. **Given** the same service function, **When** used within `useUploadMediaAsset` hook, **Then** the hook provides progress tracking and query invalidation as before

---

### Edge Cases

- What happens when reading a document created before `filePath` was added? The field should be `null` (backward compatible).
- What happens when a media reference has an invalid/moved filePath? URL remains the primary field for client rendering; filePath is only used server-side where appropriate error handling exists.
- What happens if upload fails mid-way? Existing error handling remains unchanged - partial uploads are cleaned up.

## Requirements *(mandatory)*

### Functional Requirements

**Schema Centralization**

- **FR-001**: System MUST define `mediaAssetSchema` in `packages/shared/src/schemas/media/` with all fields from the current app-level schema
- **FR-002**: System MUST define `mediaReferenceSchema` in `packages/shared/src/schemas/media/` with `mediaAssetId` (required), `url` (required), and `filePath` (nullable)
- **FR-003**: System MUST define `imageMimeTypeSchema` in `packages/shared/src/schemas/media/` with allowed image MIME types
- **FR-004**: System MUST define `mediaAssetTypeSchema` in `packages/shared/src/schemas/media/` with asset type enum (overlay, logo, other)
- **FR-005**: All media schemas MUST use `z.looseObject()` where applicable to ensure forward compatibility with future fields

**Backward Compatibility**

- **FR-006**: The `filePath` field in `mediaReferenceSchema` MUST be nullable with default `null` to support existing documents
- **FR-007**: Existing schema consumers (`overlayReferenceSchema`, `experienceMediaSchema`, `experienceMediaAssetSchema`) MUST be refactored to use the unified `mediaReferenceSchema`
- **FR-008**: No data migration MUST be required - existing Firestore documents MUST parse successfully

**Refactoring**

- **FR-009**: Cloud functions MUST be updated to import media schemas from `@clementine/shared`
- **FR-010**: Clementine app MUST be updated to import media schemas from `@clementine/shared`
- **FR-011**: The upload mutation logic MUST be extracted into a standalone service function separate from the React hook
- **FR-012**: The `useUploadMediaAsset` hook MUST be refactored to use the extracted service function

**New Upload Behavior**

- **FR-013**: When uploading a new media asset, the system MUST populate `filePath` in addition to `mediaAssetId` and `url`
- **FR-014**: Media references created after this change MUST include `filePath` for server-side storage access

### Key Entities

- **MediaAsset**: Complete media file document stored in Firestore (`workspaces/{workspaceId}/mediaAssets/{id}`). Contains file metadata (fileName, filePath, url, fileSize, mimeType, dimensions), upload tracking (uploadedAt, uploadedBy), categorization (type, status).

- **MediaReference**: Lightweight reference to a MediaAsset used in other documents. Contains `mediaAssetId` (document ID for tracking), `url` (for client rendering), and `filePath` (for server storage access, nullable for backward compatibility).

- **ImageMimeType**: Enumeration of allowed image MIME types for validation (image/png, image/jpeg, image/jpg, image/webp, image/gif).

- **MediaAssetType**: Enumeration of asset categories (overlay, logo, other) for organizing media library.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 4 duplicated media reference schemas (`mediaReferenceSchema`, `overlayReferenceSchema`, `experienceMediaSchema`, `experienceMediaAssetSchema`) are consolidated into a single source of truth
- **SC-002**: Both `apps/clementine-app` and `functions/` successfully compile with shared schema imports
- **SC-003**: Existing Firestore documents parse successfully without any data migration
- **SC-004**: Cloud functions can access storage files using `filePath` directly without URL parsing for newly created media references
- **SC-005**: Upload service function can be unit tested independently of React hooks
- **SC-006**: All existing media-related functionality (theme backgrounds, overlays, experience media) continues working after refactor

## Assumptions

- The existing `parseStorageUrl` function in cloud functions will remain for backward compatibility with documents that don't have `filePath`
- No changes to Firestore security rules are required (schemas are for validation, not security)
- The shared package build pipeline already supports being consumed by both the app and functions
- Existing tests (if any) for media upload will be updated as part of this work

## Dependencies

- `@clementine/shared` package must be properly linked in both consuming workspaces
- Zod 4.x is already available in all workspaces for schema definitions

## Out of Scope

- Adding support for video or audio MIME types (future enhancement)
- Migrating existing Firestore documents to add `filePath` (not required due to nullable field)
- Changes to Firebase Storage structure or security rules
- UI changes to the media library components (beyond using new schema types)
