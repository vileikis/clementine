# Feature Specification: AI Presets Refactor & Legacy Step Stabilization

**Feature Branch**: `001-ai-presets`
**Created**: 2025-12-02
**Status**: Draft
**Input**: Phase 1 refactor to rename `/experiences` collection to `/aiPresets` and deprecate legacy steps while maintaining backward compatibility.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Existing Flows Continue Working (Priority: P1)

Event creators who have existing journeys with ExperiencePicker or AI-based Capture steps continue to use their flows without any disruption. The system transparently reads from the renamed collection without requiring any user action.

**Why this priority**: This is the core guarantee of the refactor—zero breaking changes for existing users. Without this, the refactor cannot proceed.

**Independent Test**: Can be tested by running any existing journey that uses ExperiencePicker or Capture steps and verifying the guest experience is identical to before the migration.

**Acceptance Scenarios**:

1. **Given** an existing journey with an ExperiencePicker step configured before migration, **When** a guest accesses the journey, **Then** the ExperiencePicker displays the same AI preset options as before.
2. **Given** an existing journey with a Capture step referencing an AI preset, **When** a guest completes the capture flow, **Then** the AI transformation is applied using the same preset configuration.
3. **Given** existing data in the `/experiences` collection, **When** the migration completes, **Then** all documents are accessible via `/aiPresets` with identical content.

---

### User Story 2 - Deprecated Steps Hidden from Creation (Priority: P2)

When event creators build new journeys, they cannot add ExperiencePicker or legacy AI Capture steps. These deprecated step types are hidden from the "Add Step" UI to prevent new usage while the new Experience system is developed.

**Why this priority**: Prevents accumulation of technical debt by stopping new usage of soon-to-be-removed features.

**Independent Test**: Can be tested by opening the Journey Editor and verifying the deprecated step types are not available in the step picker.

**Acceptance Scenarios**:

1. **Given** a creator is editing a journey, **When** they open the "Add Step" menu, **Then** ExperiencePicker step type is not visible.
2. **Given** a creator is editing a journey, **When** they open the "Add Step" menu, **Then** legacy AI Capture variants are not visible.
3. **Given** an existing journey with a deprecated step, **When** the creator opens it in the editor, **Then** they can view and edit the step configuration but not create new instances.

---

### User Story 3 - Codebase Uses New Naming Convention (Priority: P3)

Developers working on the codebase interact with the `AiPreset` interface and `/aiPresets` collection exclusively. No references to the old `Experience` or `/experiences` naming remain in the active codebase.

**Why this priority**: Frees up the "Experience" term for the new Experience system and maintains clean code architecture.

**Independent Test**: Can be tested by running a codebase search for old naming patterns and confirming zero matches in production code.

**Acceptance Scenarios**:

1. **Given** the refactor is complete, **When** searching for `db.collection('experiences')`, **Then** no matches are found in active code.
2. **Given** the refactor is complete, **When** TypeScript compiles, **Then** all `Experience` type references have been replaced with `AiPreset`.
3. **Given** a developer imports from the experiences feature, **When** they use autocomplete, **Then** they see `AiPreset` types and `aiPresets` services.

---

### Edge Cases

- What happens when a journey references a non-existent AI preset ID? System displays appropriate error state and logs the issue.
- How does the system handle concurrent reads during migration? Migration strategy ensures atomic switchover with no data loss.
- What happens if a deprecated step is programmatically added via API? Validation rejects deprecated step types at the service layer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST migrate all documents from `/experiences` collection to `/aiPresets` collection with identical content.
- **FR-002**: System MUST update all Firestore queries from `db.collection('experiences')` to `db.collection('aiPresets')`.
- **FR-003**: System MUST rename TypeScript interfaces from `Experience` to `AiPreset` throughout the codebase.
- **FR-004**: System MUST rename service functions from `getExperienceById`/`listExperiences` to `getAiPresetById`/`listAiPresets`.
- **FR-005**: ExperiencePicker step MUST load options from `/aiPresets` collection filtered by `companyId`.
- **FR-006**: Capture step MUST resolve AI configurations from `/aiPresets` collection using `aiPresetId`.
- **FR-007**: System MUST mark ExperiencePicker and legacy AI Capture step types as deprecated.
- **FR-008**: Step type picker MUST filter out deprecated step types when creating new steps.
- **FR-009**: System MUST allow editing of existing deprecated steps in journeys.
- **FR-010**: Guest runtime MUST behave identically before and after migration.
- **FR-011**: Codebase MUST compile with zero references to old `/experiences` paths in production code.
- **FR-012**: Feature module MUST be renamed from `web/src/features/experiences/` to `web/src/features/ai-presets/`.
- **FR-013**: All imports referencing the old `experiences` feature module MUST be updated to `ai-presets`.

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: No new UI changes are introduced in this phase; existing mobile experiences remain unchanged.

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: `AiPreset` type MUST maintain all fields from the legacy `Experience` type.
- **TSR-002**: TypeScript strict mode MUST be maintained with no type errors after renaming.
- **TSR-003**: Zod schemas MUST be updated to reflect the `AiPreset` naming convention.

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Migration script MUST use Admin SDK for bulk document operations.
- **FAR-002**: Client-side reads from `/aiPresets` MUST use Client SDK for real-time subscriptions.
- **FAR-003**: AiPreset schemas MUST reside in `features/ai-presets/schemas/` directory.

### Key Entities

- **AiPreset**: Represents a reusable AI transformation configuration. Contains model settings, prompt templates, reference images, and processing parameters. Previously named `Experience`.
- **Step (ExperiencePicker variant)**: A step type that displays a list of AiPresets for guest selection. References AiPresets by ID.
- **Step (Capture variant)**: A step type that captures media and optionally applies AI transformation using a referenced AiPreset.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing journeys using ExperiencePicker or AI Capture steps continue to function without modification.
- **SC-002**: Zero guest-facing behavior changes after migration completion.
- **SC-003**: Codebase contains zero references to `/experiences` collection path in production code after refactor.
- **SC-004**: All TypeScript `Experience` type references are renamed to `AiPreset` with successful compilation.
- **SC-005**: Deprecated step types are not available in the "Add Step" UI (0 visibility in step picker).
- **SC-006**: All existing AiPreset documents are accessible within the same time as before migration (no performance degradation).

## Scope Constraints

- **DO NOT TOUCH**: `web/src/app/(workspace)/` routes - this area is off-limits for this refactor.
- **MUST RENAME**: `web/src/features/experiences/` feature module to `web/src/features/ai-presets/`.
- Changes to public routes (`web/src/app/(public)/`) are allowed as needed.

## Assumptions

- The existing `/experiences` collection follows a flat document structure that can be directly copied to `/aiPresets`.
- There are no external systems or integrations that depend on the `/experiences` collection path.
- The migration can be performed during a maintenance window or with a strategy that handles concurrent access.
- Existing step configurations store experience/preset references as document IDs that remain valid after migration.
