# Implementation Plan: Event Settings - Overlay Configuration

**Branch**: `013-event-settings-overlays` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-event-settings-overlays/spec.md`

## Summary

Enable workspace admins to upload and configure overlay images for events in two aspect ratios (1:1 square, 9:16 portrait). Overlays are stored in a reusable workspace media library and referenced in event configurations. This feature creates a new `media-library` domain for managing uploadable media assets across the entire application, while extending the existing `event/settings` domain to support overlay upload UI.

**Key Technical Approach**:
- Create new `media-library` domain with reusable upload infrastructure
- Store media assets in workspace subcollection for better data isolation
- Update event config schema to track both asset ID and URL for performance
- Implement drag-and-drop upload UI using native browser APIs
- Leverage Firebase Storage upload with progress tracking
- Auto-save overlay references to event draft configuration

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**:
  - TanStack Start 1.132.0 (full-stack React framework)
  - React 19.2.0
  - TanStack Router 1.132.0 (file-based routing)
  - TanStack Query 5.66.5 (client-side data fetching)
  - Firebase SDK 12.5.0 (Firestore client, Storage client, Auth client)
  - Zod 4.1.12 (runtime validation)
  - shadcn/ui + Radix UI (component library)
  - Tailwind CSS v4 (styling)

**Storage**:
  - Firebase Firestore (NoSQL database with client SDK)
  - Firebase Storage (media files with client SDK upload)
  - Collection: `workspaces/{workspaceId}/mediaAssets/{assetId}`
  - Storage path: `workspaces/{workspaceId}/media/{fileName}`

**Testing**: Vitest (unit tests, component tests with Testing Library)

**Target Platform**: Web (mobile-first responsive design, 320px-768px primary viewport)

**Project Type**: TanStack Start web application (SSR-capable, client-first architecture)

**Performance Goals**:
  - Upload progress tracking (visual feedback for 0-100%)
  - Image preview rendering < 100ms
  - File validation < 50ms (client-side)
  - Auto-save debounced to prevent excessive writes

**Constraints**:
  - File size limit: 5MB per overlay image
  - Allowed file types: PNG, JPG/JPEG, WebP only
  - Aspect ratio validation: loose (trust admins)
  - Client-first architecture: use Firebase client SDKs for all data operations
  - Security: Firestore/Storage rules enforce permissions, not server code

**Scale/Scope**:
  - ~10 new files (2 domains: media-library + event/settings)
  - ~500 LOC total
  - 2 new Firestore queries (read mediaAssets, auto-save event config)
  - 1 new Storage upload operation
  - Schema update to existing `overlaysConfigSchema`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Mobile-First Design
- **Status**: COMPLIANT
- **Rationale**: Drag-and-drop upload UI will use responsive design with mobile-friendly fallback (click to upload). Component designed for 320px-768px viewport first, then enhanced for desktop.
- **Mobile considerations**:
  - Touch-friendly upload areas (minimum 44x44px tap targets)
  - File picker optimized for mobile cameras
  - Progress indicators visible on small screens
  - Image previews scaled appropriately

### ✅ Principle II: Clean Code & Simplicity
- **Status**: COMPLIANT
- **Rationale**: Feature follows single-responsibility principle with clear separation:
  - `useUploadMediaAsset` hook: upload logic only
  - `useUpdateOverlays` hook: config update logic only
  - `OverlayFrame` component: display-only presentation
  - `OverlaySection` container: orchestration and state management
- **Simplicity measures**:
  - No premature abstractions (build exactly what's needed)
  - Small, focused functions (~30 lines max)
  - Direct Firebase client SDK usage (no repository layer needed yet)
  - Reusable media-library domain for future features without over-engineering

### ✅ Principle III: Type-Safe Development
- **Status**: COMPLIANT
- **Rationale**: TypeScript strict mode enabled, all types defined explicitly:
  - Zod schema for `MediaAsset` with runtime validation
  - Zod schema update for `OverlayReference` (mediaAssetId + url)
  - No `any` types, strict null checks enabled
  - Server-side validation via Firestore/Storage security rules
  - Client-side validation for file type/size (UX only)

### ✅ Principle IV: Minimal Testing Strategy
- **Status**: COMPLIANT
- **Rationale**: Focus on critical paths, not 100% coverage:
  - Unit tests for Zod schemas (mediaAssetSchema, overlayReferenceSchema)
  - Unit tests for file validation logic (type, size)
  - Component tests for `OverlayFrame` (empty, uploading, uploaded states)
  - Integration test for upload → config update flow
  - No E2E tests (out of scope for current testing strategy)

### ✅ Principle V: Validation Gates
- **Status**: COMPLIANT
- **Plan**: Run validation loop before marking feature complete:
  1. **Technical Validation** (automated):
     - `pnpm check` (format + lint auto-fix)
     - `pnpm type-check` (TypeScript strict mode)
     - `pnpm test` (Vitest unit + component tests)
     - Manual test in dev server (upload, preview, remove)
  2. **Standards Compliance Review** (manual):
     - **UI/Frontend**: `frontend/design-system.md` (no hard-coded colors, theme tokens only)
     - **UI/Frontend**: `frontend/component-libraries.md` (shadcn/ui for buttons, Radix for primitives)
     - **UI/Frontend**: `frontend/accessibility.md` (keyboard navigation, ARIA labels)
     - **Data/Backend**: `backend/firestore.md` (client SDK patterns, query structure)
     - **Data/Backend**: `backend/firestore-security.md` (security rules for mediaAssets, Storage)
     - **Architecture**: `global/project-structure.md` (vertical slice, barrel exports)
     - **Architecture**: `global/client-first-architecture.md` (client SDK usage, no server functions)
     - **Code Quality**: `global/code-quality.md` (clean code, naming conventions)
     - **Security**: `global/security.md` (input validation, no XSS vulnerabilities)

### ✅ Principle VI: Frontend Architecture
- **Status**: COMPLIANT
- **Rationale**: Follows client-first architecture:
  - Firebase client SDK for Firestore queries (`onSnapshot` for real-time)
  - Firebase client SDK for Storage uploads (client-side with progress tracking)
  - TanStack Query for client-side state management and caching
  - No server functions needed (upload + config update are client-side)
  - Security enforced via Firestore/Storage rules, not server code

### ✅ Principle VII: Backend & Firebase
- **Status**: COMPLIANT
- **Rationale**: Hybrid SDK pattern correctly applied:
  - **Client SDK**: Read mediaAssets, upload to Storage, update event config
  - **Admin SDK**: Not needed for this feature (no elevated permissions required)
  - **Security rules**: Admins can write, members can read (enforced at Firestore/Storage level)
  - **Public URLs**: Store full download URL from Firebase Storage (instant rendering)

### ✅ Principle VIII: Project Structure
- **Status**: COMPLIANT
- **Rationale**: Vertical slice architecture with two bounded contexts:
  - **New domain**: `@/domains/media-library/` (hooks, schemas, types)
  - **Existing domain**: `@/domains/event/settings/` (components, containers, hooks)
  - Each domain encapsulates its own technical concerns
  - Barrel exports (`index.ts`) expose public API only
  - Clear import boundary: `import { useUploadMediaAsset } from '@/domains/media-library'`

### 🔒 Standards Compliance
- **Global Standards**:
  - ✅ `global/code-quality.md` - Validation workflows, linting
  - ✅ `global/coding-style.md` - Naming conventions, file organization
  - ✅ `global/project-structure.md` - Vertical slice, barrel exports
  - ✅ `global/zod-validation.md` - Runtime validation for schemas
  - ✅ `global/error-handling.md` - Error boundaries, graceful degradation
  - ✅ `global/security.md` - Input validation, file type/size checks
  - ✅ `global/client-first-architecture.md` - Client SDK usage, minimal server code
- **Frontend Standards**:
  - ✅ `frontend/design-system.md` - Theme tokens, no hard-coded colors
  - ✅ `frontend/component-libraries.md` - shadcn/ui + Radix UI patterns
  - ✅ `frontend/accessibility.md` - WCAG AA, keyboard navigation
  - ✅ `frontend/responsive.md` - Mobile-first breakpoints
  - ✅ `frontend/state-management.md` - TanStack Query patterns
  - ✅ `frontend/performance.md` - Performance budgets
- **Backend Standards**:
  - ✅ `backend/firestore.md` - Client SDK patterns, subcollections
  - ✅ `backend/firestore-security.md` - Security rules for mediaAssets

**Validation Status**: ✅ ALL GATES PASSED - No violations, no complexity justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/013-event-settings-overlays/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (copied from requirements/)
├── research.md          # Phase 0 output (research findings, decisions)
├── data-model.md        # Phase 1 output (entity schemas, relationships)
├── quickstart.md        # Phase 1 output (developer quickstart guide)
├── contracts/           # Phase 1 output (API contracts, if needed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (TanStack Start app)

```text
apps/clementine-app/src/

# NEW: Media Library Domain (bounded context)
domains/media-library/
├── hooks/
│   ├── useUploadMediaAsset.ts           # Upload file to Storage + create Firestore doc
│   └── index.ts                         # Barrel export
├── schemas/
│   ├── media-asset.schema.ts            # MediaAsset Zod schema
│   └── index.ts                         # Barrel export
├── types/
│   ├── media.types.ts                   # Media-related TypeScript types
│   └── index.ts                         # Barrel export
└── index.ts                             # Domain public API

# UPDATED: Event Settings Subdomain (existing)
domains/event/settings/
├── components/
│   ├── SharingOptionCard.tsx            # Existing (012)
│   ├── OverlayFrame.tsx                 # NEW - Display overlay frame (presentation)
│   └── OverlaySection.tsx               # NEW - Overlay upload container (orchestration)
├── containers/
│   └── SettingsSharingPage.tsx          # Existing (012) - may import OverlaySection
├── hooks/
│   ├── useUpdateShareOptions.ts         # Existing (012)
│   └── useUpdateOverlays.ts             # NEW - Update event overlay config
└── index.ts                             # Barrel export

# UPDATED: Event Shared Schemas (existing)
domains/event/shared/schemas/
├── project-event-config.schema.ts       # UPDATED - Add overlayReferenceSchema
└── index.ts                             # Barrel export (re-export new schema)

# Firebase Security Rules (updated)
../../../firestore.rules                 # ADD rules for workspaces/{id}/mediaAssets
../../../storage.rules                   # ADD rules for workspaces/{id}/media/*
```

**Structure Decision**:
- **Web application structure** (TanStack Start with vertical slice architecture)
- Created new `media-library` domain as a bounded context (future-proof for media library features)
- Extended existing `event/settings` subdomain for overlay UI components
- Updated shared event schemas for new overlay reference structure
- Security rules updated in Firebase configuration files (monorepo root)

## Complexity Tracking

**Status**: No complexity violations detected.

All constitutional principles are satisfied without requiring additional complexity or justification. The feature follows established patterns:
- Client-first architecture (Firebase client SDKs)
- Vertical slice architecture (two domains: media-library, event/settings)
- Simple, focused components and hooks
- Type-safe with Zod validation
- Mobile-first design
- Standards-compliant

No complexity tracking table needed.

---

## Next Steps

**Phase 0**: Research (NEEDS CLARIFICATION items → research.md)
**Phase 1**: Design (data-model.md, contracts/, quickstart.md)
**Phase 2**: Tasks (/speckit.tasks command - separate workflow)

**Current Gate Status**: ✅ Constitution Check PASSED - Ready for Phase 0 research
