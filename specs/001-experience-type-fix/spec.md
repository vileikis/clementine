# Feature Specification: Experience Type System Consolidation

**Feature Branch**: `001-experience-type-fix`
**Created**: 2025-11-20
**Status**: Draft
**Input**: User description: "Consolidate Experience type definitions by removing legacy types and migration code, keeping only the new discriminated union schema from `schemas.ts`"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Works with Single Type System (Priority: P1)

As a developer working on Experience features, I need to work with a single, consistent type definition so that I can develop features efficiently without confusion about which type to use or how to handle migrations.

**Why this priority**: This is the foundational change that enables all other improvements. Without consolidating to a single type system, developers face confusion, duplicate code, and error-prone type conversions.

**Independent Test**: Can be fully tested by verifying that all Experience-related code imports types from `schemas.ts` only, and that TypeScript compilation succeeds without errors. Delivers immediate value by eliminating confusion and reducing cognitive load.

**Acceptance Scenarios**:

1. **Given** a developer needs to create a new Experience feature, **When** they search for Experience type definitions, **Then** they find only one canonical source in `schemas.ts`
2. **Given** a developer is reading Experience repository code, **When** they examine the return types, **Then** all functions return `PhotoExperience` type from `schemas.ts`
3. **Given** a developer is updating an Experience component, **When** they import Experience types, **Then** they import from `schemas.ts` without any legacy type references
4. **Given** the codebase has been consolidated, **When** running TypeScript type checking, **Then** no type errors related to Experience definitions occur

---

### User Story 2 - Experience Data Follows Consistent Schema (Priority: P2)

As a system administrator or developer, I need all Experience data in Firestore to follow the new discriminated union schema structure so that data operations are predictable and validation rules are consistently applied.

**Why this priority**: Once the code uses a single type system, the data must match that schema. This ensures runtime safety and proper validation.

**Independent Test**: Can be fully tested by creating, reading, updating, and deleting Experience documents and verifying they all follow the new schema structure with `config` and `aiConfig` nested objects. Delivers value by ensuring data integrity.

**Acceptance Scenarios**:

1. **Given** a user creates a new photo experience with AI settings, **When** the Experience is saved to Firestore, **Then** the document structure includes nested `config` and `aiConfig` objects as defined in `schemas.ts`
2. **Given** an Experience document exists in Firestore, **When** it is retrieved by the repository, **Then** it is validated against the `photoExperienceSchema` from `schemas.ts`
3. **Given** a user updates Experience settings, **When** the update is saved, **Then** the data structure matches the schema without any legacy flat fields (e.g., no `countdownEnabled`, only `config.countdown`)
4. **Given** invalid Experience data is written, **When** validation occurs, **Then** the system rejects the data with clear error messages from Zod schema validation

---

### User Story 3 - Clean Codebase Without Migration Artifacts (Priority: P3)

As a developer maintaining the codebase, I need all migration code, legacy type definitions, and dual-type handling removed so that the codebase is simpler and easier to understand.

**Why this priority**: This is cleanup work that improves maintainability but doesn't directly affect functionality. It can be done after the type system and data schema are consolidated.

**Independent Test**: Can be fully tested by searching the codebase for migration-related files and legacy type references, and verifying none exist. Delivers value by reducing code complexity and future maintenance burden.

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** searching the codebase for `migration.ts` or `migration.test.ts`, **Then** no such files exist
2. **Given** the migration is complete, **When** searching for imports from `experience.types.ts`, **Then** no such imports exist in any file
3. **Given** the migration is complete, **When** examining UI components like `ExperienceEditor.tsx`, **Then** no type guards checking for legacy vs new schema exist
4. **Given** the migration is complete, **When** reviewing server actions, **Then** no migration utility functions like `stripLegacyFields()` are called

---

### Edge Cases

- What happens when existing Firestore documents with legacy structure are read after code migration (Assumption: All Firestore data will be wiped before migration, so this is not a concern)?
- What happens when a schema validation fails during Experience creation or update?
- What happens if TypeScript errors occur during the migration due to incorrect type imports?
- How does the system handle partially migrated files if the process is interrupted?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use only the `PhotoExperience` type from `schemas.ts` for all Experience-related operations (create, read, update, delete)
- **FR-002**: System MUST validate all Experience data against `photoExperienceSchema` from `schemas.ts` when reading from Firestore
- **FR-003**: System MUST store Experience data in Firestore with nested `config` and `aiConfig` objects (not flat legacy structure)
- **FR-004**: System MUST NOT contain any references to the legacy `Experience` type from `experience.types.ts`
- **FR-005**: System MUST NOT contain any migration code or utilities for converting between legacy and new schema formats
- **FR-006**: Repository functions MUST return validated `PhotoExperience` types with proper error handling for invalid data
- **FR-007**: All UI components MUST import Experience types from `schemas.ts` exclusively
- **FR-008**: Server actions MUST create and update Experience documents using the new schema structure directly

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: This is a backend/type system refactoring feature with no direct mobile UI changes required
- **MFR-002**: Experience editor UI (already mobile-optimized) MUST continue to function correctly on mobile viewports after type consolidation

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All Experience data read from Firestore MUST be validated using `photoExperienceSchema.parse()` to ensure type safety
- **TSR-002**: TypeScript strict mode MUST be maintained throughout migration with zero type errors after completion
- **TSR-003**: No `any` types or type assertions MUST be used to bypass schema validation
- **TSR-004**: Schema validation failures MUST throw descriptive Zod errors that can be logged for debugging

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All Experience write operations (create/update/delete) MUST continue using Admin SDK via Server Actions
- **FAR-002**: Repository reads MUST validate data against `photoExperienceSchema` before returning to callers
- **FAR-003**: Experience schema definitions MUST remain in `web/src/lib/schemas/` as the single source of truth
- **FAR-004**: Experience document structure in Firestore MUST match the `PhotoExperience` interface with nested objects
- **FAR-005**: Image URLs in Experience documents (overlayFramePath, referenceImagePaths, previewPath) MUST remain as full public URLs

### Key Entities

- **PhotoExperience**: Represents a photo booth experience configuration with type-safe discriminated union structure. Key attributes include:
  - Base fields: id, eventId, type ("photo"), label, enabled, hidden
  - Nested `config` object: countdown settings (0 = disabled, 1-10 = seconds), overlayFramePath
  - Nested `aiConfig` object: enabled flag, model selection, prompt, reference images, aspect ratio
  - Optional preview: previewPath, previewType
  - Audit fields: createdAt, updatedAt

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can locate all Experience type definitions in a single file (`schemas.ts`) without searching multiple locations
- **SC-002**: TypeScript type checking passes with zero errors after migration completion
- **SC-003**: All Experience CRUD operations work correctly with the new schema structure (verified through manual testing)
- **SC-004**: Codebase contains zero references to legacy `Experience` type or migration utilities (verified through codebase search)
- **SC-005**: All Experience documents in Firestore follow the new schema structure with nested `config` and `aiConfig` objects (verified through Firestore console inspection)
- **SC-006**: Repository validation catches and reports invalid Experience data with clear Zod error messages

## Assumptions

- **A-001**: The application is in development stage with no production users or critical data
- **A-002**: All existing Firestore Experience data can be safely deleted and recreated
- **A-003**: The new `PhotoExperience` schema in `schemas.ts` is complete and accurate for all current use cases
- **A-004**: No backward compatibility with legacy data format is required
- **A-005**: Future Experience types (video, gif, wheel) will follow the same discriminated union pattern in `schemas.ts`
- **A-006**: All developers working on this codebase will be immediately aware of the type system consolidation

## Out of Scope

- Migration utilities for production data (no production data exists)
- Support for legacy data format reading (all data will be wiped)
- Backward compatibility layers (clean slate approach)
- Implementation of other Experience types (video, gif, wheel) - only photo type is in scope
- Changes to the UI/UX of Experience editor components (only type imports change)
