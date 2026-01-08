# Feature Specification: Experience System Structural Foundations

**Feature Branch**: `019-exp-system-foundations`
**Created**: 2026-01-08
**Status**: Draft
**Input**: User description: "Phase 0 of experience-system-roadmap.md - Structural Foundations (no UI)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Creates Experience Domain Structure (Priority: P1)

A developer setting up new feature work needs to import types and interfaces from well-organized domain folders so they can build Experience System functionality without rewrites or circular dependencies.

**Why this priority**: This is the foundational scaffolding that all subsequent Experience System phases depend on. Without proper domain structure, future development will require disruptive refactoring.

**Independent Test**: Can be verified by importing from `domains/experience/` and `domains/session/` in any part of the application without import errors or circular dependency warnings. Application boots successfully with new domains present.

**Acceptance Scenarios**:

1. **Given** a fresh application state, **When** the app starts with the new domain folders, **Then** the application boots without errors
2. **Given** the experience domain exists, **When** a developer imports types from `domains/experience/`, **Then** TypeScript resolves all imports without circular dependency warnings
3. **Given** the session domain exists, **When** a developer imports session types, **Then** all exports are available without runtime errors

---

### User Story 2 - Developer Registers Step Types (Priority: P1)

A developer building step functionality needs a step registry with type definitions so they can add new step types in later phases without modifying core infrastructure.

**Why this priority**: The step registry is the extension point for all step types (info, input, capture, transform, share). Defining the skeleton now prevents architectural changes later.

**Independent Test**: Can be tested by defining a placeholder step type entry in the registry and verifying TypeScript validates the structure correctly.

**Acceptance Scenarios**:

1. **Given** the step registry skeleton, **When** a developer defines a new step type structure, **Then** TypeScript validates the step conforms to the registry interface
2. **Given** the step registry exists, **When** inspecting available step categories, **Then** the enum/type contains expected categories (info, input, capture, transform, share)

---

### User Story 3 - Developer Implements Experience Profiles (Priority: P2)

A developer implementing experience validation needs ExperienceProfile enum and validator placeholders so they can enforce different experience patterns in later phases.

**Why this priority**: Experience profiles define valid step combinations. Having the enum and empty validators now establishes the validation contract without implementation complexity.

**Independent Test**: Can be tested by importing ExperienceProfile enum and calling validator functions (which return pass-through results initially).

**Acceptance Scenarios**:

1. **Given** the ExperienceProfile enum exists, **When** a developer imports it, **Then** all defined profile types are available
2. **Given** empty validators exist, **When** calling a validator with any experience structure, **Then** it returns a valid result (no enforcement yet)

---

### User Story 4 - Developer Builds Runtime Engine (Priority: P2)

A developer preparing for runtime implementation needs the runtime engine interface defined so they can implement step execution in later phases with a stable contract.

**Why this priority**: The runtime engine interface defines how steps execute. Establishing the interface now allows parallel development of runtime consumers and implementers.

**Independent Test**: Can be tested by creating a mock implementation of the runtime engine interface and verifying it compiles correctly.

**Acceptance Scenarios**:

1. **Given** the runtime engine interface exists, **When** a developer implements a mock runtime, **Then** TypeScript validates the implementation satisfies the interface
2. **Given** the runtime interface defines `currentStep`, `canProceed`, `next()`, `back()`, `setAnswer()`, **When** inspecting the interface, **Then** all these members are defined with appropriate types

---

### User Story 5 - Developer Integrates Session Management (Priority: P2)

A developer building session features needs session API shapes (`createSession`, `subscribeSession`) defined so they can implement real-time session tracking in later phases.

**Why this priority**: Sessions track guest progress through experiences. Defining the API shape now ensures consistent session management across preview and guest modes.

**Independent Test**: Can be tested by calling placeholder session API functions and verifying they return expected stub responses.

**Acceptance Scenarios**:

1. **Given** the session API shape is defined, **When** calling `createSession` with required parameters, **Then** the function signature is validated by TypeScript
2. **Given** `subscribeSession` is defined, **When** a developer reviews the subscription shape, **Then** it includes session ID and callback/subscription pattern
3. **Given** session types exist, **When** inspecting session properties, **Then** `mode` ('preview' | 'guest') and `configSource` ('draft' | 'published') are defined

---

### User Story 6 - Verify Project Has Active Event Link (Priority: P1)

A developer implementing the guest join flow needs to confirm the `activeEventId` field exists on the project data model so the `/join/[projectId]` route can resolve to the correct event.

**Why this priority**: The `activeEventId` field enables the guest join flow's project-to-event resolution chain. This field already exists in the schema - verification ensures it's available for Phase 2.

**Independent Test**: Can be verified by checking project schema includes `activeEventId` field (already present in `project/shared/schemas/project.schema.ts`).

**Acceptance Scenarios**:

1. **Given** the project data model, **When** inspecting the schema, **Then** the `activeEventId` field is present as a nullable string
2. **Given** a project with `activeEventId` set, **When** reading the project, **Then** the field value is correctly retrieved

---

### Edge Cases

- What happens when domains are imported circularly? System must fail-fast with clear error messages during development.
- How does system handle missing optional fields (like `activeEventId` on legacy projects)? Fields must be optional to maintain backwards compatibility.
- What happens when step registry is accessed before initialization? Registry must be statically defined so it's always available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide `domains/experience/` folder structure with proper module exports
- **FR-002**: System MUST provide `domains/session/` folder structure with proper module exports
- **FR-003**: System MUST define step registry with type definitions for step categories (info, input, capture, transform, share)
- **FR-004**: System MUST define `ExperienceProfile` enum with planned profile types
- **FR-005**: System MUST provide empty/pass-through validators for each ExperienceProfile
- **FR-006**: System MUST define runtime engine interface with members: `currentStep`, `canProceed`, `next()`, `back()`, `setAnswer()`
- **FR-007**: System MUST define session API type shapes for `createSession` and `subscribeSession` functions
- **FR-008**: System MUST define session entity types including `mode` ('preview' | 'guest') and `configSource` ('draft' | 'published')
- **FR-009**: System MUST verify `activeEventId` field exists in project data model schema (already present)
- **FR-010**: System MUST ensure no circular dependencies between new domains and existing code
- **FR-011**: System MUST maintain backwards compatibility with existing project records (no migration required)

### Key Entities

- **Experience**: A step-based interactive flow scoped to an Event. Contains ordered steps and configuration.
- **Session**: A guest or admin preview instance of an experience execution. Tracks progress, answers, and outputs.
- **Step**: An individual unit within an experience (info, input, capture, transform, share). Defined by step registry.
- **ExperienceProfile**: A classification of experience patterns that determines valid step combinations.
- **Project**: Existing entity with `activeEventId` field already present to reference the currently active event for guest access.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Application boots successfully with new domain folders present (zero startup errors)
- **SC-002**: All new modules can be imported without circular dependency warnings
- **SC-003**: TypeScript compilation succeeds with new types and interfaces
- **SC-004**: A session record can be created via manual/developer trigger (database write succeeds)
- **SC-005**: Existing project functionality continues to work (no regression in project CRUD operations)
- **SC-006**: Developer can define a placeholder step type that passes registry type validation

## Assumptions

- Domain folder structure follows existing patterns in `apps/clementine-app/src/domains/`
- Step categories (info, input, capture, transform, share) are comprehensive for planned experience types
- Session modes (preview, guest) and config sources (draft, published) are the complete set needed
- Runtime engine interface based on roadmap API shape is stable and won't require breaking changes
- `activeEventId` is the only project-level field needed for guest join flow resolution
- This phase delivers type definitions and scaffolding only - no functional implementation is expected
