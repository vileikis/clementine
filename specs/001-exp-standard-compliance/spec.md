# Feature Specification: Experiences Feature Standards Compliance

**Feature Branch**: `001-exp-standard-compliance`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Assess experiences feature for compliance with standards (feature-modules.md and validation.md) and prepare a refactoring plan to ensure compliance"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Navigates Feature Structure (Priority: P1)

A developer needs to find and modify experiences-related code. They navigate to `web/src/features/experiences/` and expect to find files organized by technical concern (actions, repositories, schemas, types, components, hooks) with explicit naming conventions.

**Why this priority**: Discoverability and maintainability are foundational. If developers cannot quickly find code, all other benefits of the feature module pattern are lost.

**Independent Test**: Can be fully tested by having a developer locate all experience-related schemas, actions, and types within 30 seconds using standard folder navigation (not search).

**Acceptance Scenarios**:

1. **Given** the refactored feature, **When** a developer looks for experience schemas, **Then** they find them in `schemas/experiences.schemas.ts` following the `[domain].schemas.ts` naming convention
2. **Given** the refactored feature, **When** a developer looks for repository functions, **Then** they find them in `repositories/experiences.repository.ts` following the standard folder structure
3. **Given** the refactored feature, **When** a developer opens any file in tabs, **Then** the filename clearly indicates its purpose without needing folder context

---

### User Story 2 - Developer Imports Feature Components (Priority: P1)

A developer building a page needs to import components, hooks, and types from the experiences feature. They expect clean imports from the public API without risk of accidentally importing server-only code.

**Why this priority**: Import safety prevents runtime errors and ensures client/server boundaries are respected, which is critical for Next.js app router architecture.

**Independent Test**: Can be fully tested by importing from the feature index and verifying all exports work in both client and server contexts without bundling errors.

**Acceptance Scenarios**:

1. **Given** the refactored feature, **When** a developer imports from `@/features/experiences`, **Then** they receive only components, hooks, and types (no server actions, repositories, or internal schemas)
2. **Given** the refactored feature, **When** a developer needs server actions, **Then** they import directly from `@/features/experiences/actions` as documented
3. **Given** the refactored feature, **When** a developer imports from the feature in a client component, **Then** no bundling errors occur related to server-only modules

---

### User Story 3 - Developer Extends Feature with New Experience Type (Priority: P2)

A developer needs to add a new experience type (e.g., "survey"). They need to understand where to add schemas, types, components, and actions following established patterns.

**Why this priority**: Extensibility ensures the codebase scales. Following consistent patterns reduces onboarding time and prevents technical debt accumulation.

**Independent Test**: Can be fully tested by following the established patterns to add a new experience type and verifying it integrates cleanly with existing discriminated unions.

**Acceptance Scenarios**:

1. **Given** the refactored feature, **When** a developer adds a new experience type schema, **Then** they follow the pattern in `schemas/experiences.schemas.ts` to extend the discriminated union
2. **Given** the refactored feature, **When** a developer creates type-specific components, **Then** they add them to `components/[type]/` with proper barrel exports
3. **Given** the refactored feature, **When** a developer adds new actions, **Then** they follow the `[type]-[operation].ts` naming pattern

---

### User Story 4 - Developer Validates Experience Data (Priority: P2)

A developer needs to validate experience data from forms or API responses. They expect validation schemas to use Zod v4 patterns with proper constants for constraints.

**Why this priority**: Consistent validation ensures data integrity and provides a single source of truth for validation rules across client and server.

**Independent Test**: Can be fully tested by importing schemas and validating sample data, verifying error messages reference constraint constants.

**Acceptance Scenarios**:

1. **Given** the refactored feature, **When** a developer imports validation schemas, **Then** schemas use Zod v4 patterns (e.g., `z.email()` not `z.string().email()`)
2. **Given** the refactored feature, **When** schemas have numeric constraints, **Then** constraints are defined in `constants.ts` and referenced in both schemas and UI components
3. **Given** the refactored feature, **When** optional fields are defined, **Then** they use `.nullable().optional().default(null)` pattern for Firestore compatibility

---

### User Story 5 - CI Pipeline Validates Feature Structure (Priority: P3)

The CI/CD pipeline validates that the feature follows established patterns. The refactored feature passes all structure and lint checks.

**Why this priority**: Automated validation prevents regression and enforces standards without manual review burden.

**Independent Test**: Can be fully tested by running lint and type-check commands, verifying no new warnings or errors.

**Acceptance Scenarios**:

1. **Given** the refactored feature, **When** `pnpm lint` runs, **Then** no errors or warnings are produced from the experiences feature
2. **Given** the refactored feature, **When** `pnpm type-check` runs, **Then** no TypeScript errors are produced from the experiences feature
3. **Given** the refactored feature, **When** all tests run, **Then** all existing tests pass without modification (except import paths)

---

### Edge Cases

- What happens when existing code imports from deprecated paths? Imports from old `lib/` paths should fail with clear error messages at build time.
- How does system handle the transition period? Legacy imports are removed in this refactor - no backward compatibility shim is maintained.

## Requirements *(mandatory)*

### Functional Requirements

#### Structure Compliance (feature-modules.md)

- **FR-001**: Feature MUST have separate `repositories/` folder containing `experiences.repository.ts` (moved from `lib/repository.ts`)
- **FR-002**: Feature MUST have separate `schemas/` folder containing `experiences.schemas.ts` (moved from `lib/schemas.ts`)
- **FR-003**: Feature MUST have separate `types/` folder containing `experiences.types.ts` with Zod-inferred types
- **FR-004**: Feature MUST have `constants.ts` at root level (moved from `lib/constants.ts`)
- **FR-005**: All files MUST follow `[domain].[purpose].ts` naming pattern (e.g., `experiences.repository.ts`, not `repository.ts`)
- **FR-006**: Every folder MUST have an `index.ts` barrel export file
- **FR-007**: The `lib/` folder MUST be removed after migration (no mixed-concern folders)

#### Export Pattern Compliance (feature-modules.md)

- **FR-008**: Feature-level `index.ts` MUST export ONLY components, hooks, and types
- **FR-009**: Feature-level `index.ts` MUST NOT export server actions, repositories, or internal schemas
- **FR-010**: Actions MUST be importable via direct path `@/features/experiences/actions`
- **FR-011**: Repositories MUST be importable via direct path `@/features/experiences/repositories`
- **FR-012**: Schemas MUST be importable via direct path `@/features/experiences/schemas` (for internal use)

#### Component Organization

- **FR-013**: Duplicate `components/photo/AITransformSettings.tsx` MUST be removed (use shared version only)
- **FR-014**: Each component subfolder (`photo/`, `gif/`, `shared/`) MUST have its own `index.ts` barrel export
- **FR-015**: Empty `hooks/` folder MUST be removed OR populated with extracted hooks

#### Code Cleanup

- **FR-016**: `actions/legacy.ts` (deprecated file) MUST be deleted
- **FR-017**: All imports referencing `lib/` paths MUST be updated to new folder structure
- **FR-018**: Test files MUST be colocated with their source files (e.g., `experiences.schemas.test.ts` in `schemas/`)

#### Validation Compliance (validation.md)

- **FR-019**: Schema variable names MUST use camelCase (e.g., `experienceSchema`, not `ExperienceSchema`)
- **FR-020**: Optional fields for Firestore MUST use `.nullable().optional().default(null)` pattern
- **FR-021**: Validation constraints MUST be extracted to `constants.ts` (no magic numbers in schemas)
- **FR-022**: Nested object schemas MUST be extracted to named variables (no inline complex schemas)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: N/A - This is a refactoring task with no UI changes

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All existing TypeScript types MUST be preserved with no runtime behavior changes
- **TSR-002**: All existing Zod schemas MUST maintain the same validation rules
- **TSR-003**: No `any` types MUST be introduced during refactoring

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Repository functions MUST continue using Admin SDK via Server Actions pattern
- **FAR-002**: No changes to Firestore collection structure (normalized flat architecture compliance is a separate task)

### Key Entities

- **Experience**: Discriminated union type representing photo/video/gif/wheel configurations with nested config and aiConfig objects
- **ExperienceType**: Union type `'photo' | 'video' | 'gif' | 'wheel'` used for type discrimination

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can locate any experiences-related file within 30 seconds using folder navigation only (no search)
- **SC-002**: All existing tests pass without modification to test logic (only import paths may change)
- **SC-003**: `pnpm lint` produces zero warnings/errors from the experiences feature
- **SC-004**: `pnpm type-check` produces zero TypeScript errors from the experiences feature
- **SC-005**: Feature index exports only components, hooks, and types - verified by attempting client-side import without bundling errors
- **SC-006**: All files follow `[domain].[purpose].ts` naming - verified by listing all files in feature directory
- **SC-007**: No files remain in `lib/` folder - folder is completely removed
- **SC-008**: No duplicate components exist - only one `AITransformSettings.tsx` in `shared/`

## Assumptions

- The existing functionality is correct and should not change behavior
- Import paths in consuming files will be updated as part of this refactor
- The repository still uses nested Firestore subcollections (migrating to flat architecture is a separate task)
- Existing tests adequately cover current functionality

## Out of Scope

- Firestore architecture migration (nested to flat collections)
- Adding new functionality or features to experiences
- Refactoring other feature modules for consistency
- Adding missing test coverage beyond what currently exists
