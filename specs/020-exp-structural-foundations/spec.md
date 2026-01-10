# Feature Specification: Experience System Structural Foundations

**Feature Branch**: `020-exp-structural-foundations`
**Created**: 2026-01-10
**Status**: Draft
**Input**: User description: "Phase 0 of experience-system-roadmap.md - Establish domain scaffolding and naming conventions"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Sets Up Experience Domain Structure (Priority: P1)

A developer working on the Experience System needs a well-organized domain structure to build upon. They navigate the codebase and find clearly defined directories for experiences, sessions, and their sub-modules (schemas, types, hooks). The structure follows established project conventions and provides clear boundaries for where different concerns belong.

**Why this priority**: This is the foundational structure that all subsequent Experience System work depends on. Without proper scaffolding, future development will lack organization and consistency.

**Independent Test**: Can be verified by examining the directory structure and confirming all placeholder modules exist with proper exports. The application should boot without errors.

**Acceptance Scenarios**:

1. **Given** the codebase has been updated with domain scaffolding, **When** a developer inspects `domains/experience/`, **Then** they find subdirectories for `shared/`, `steps/`, `validation/`, `runtime/`, and `editor/` with appropriate placeholder files
2. **Given** the experience domain scaffolding exists, **When** the application starts, **Then** it boots successfully without any import errors or circular dependencies
3. **Given** the session domain scaffolding exists, **When** a developer inspects `domains/session/`, **Then** they find session types, schemas, and API shape definitions

---

### User Story 2 - Developer Uses Experience Profile Types (Priority: P1)

A developer needs to categorize experiences by their intended use case. They import the `ExperienceProfile` type and see three distinct profile options: freeform (flexible, user-driven experiences), survey (structured data collection), and informational (display-only content). Each profile determines what step types are available.

**Why this priority**: The profile type system is central to how experiences are validated and constrained. It must be defined early so all subsequent features can reference it consistently.

**Independent Test**: Can be verified by importing the ExperienceProfile type and confirming TypeScript accepts all three values ('freeform', 'survey', 'informational') and rejects invalid values.

**Acceptance Scenarios**:

1. **Given** the ExperienceProfile type is defined, **When** a developer assigns a valid profile value, **Then** TypeScript accepts `'freeform'`, `'survey'`, or `'informational'`
2. **Given** the ExperienceProfile type is defined, **When** a developer assigns an invalid profile value, **Then** TypeScript reports a type error

---

### User Story 3 - Developer Links Events to Active Event (Priority: P2)

A developer needs to associate a project with its currently active event. They find the project schema has been extended with an `activeEventId` field that optionally references the event that should be shown to guests visiting the project link.

**Why this priority**: The activeEventId enables the guest join flow (`/join/[projectId]`) to resolve which event to display. While not immediately user-facing, it's required infrastructure for Phase 15.

**Independent Test**: Can be verified by confirming the project schema accepts the activeEventId field and existing projects without this field remain valid.

**Acceptance Scenarios**:

1. **Given** the project schema has been updated, **When** a developer creates a project with an activeEventId, **Then** the schema validates successfully
2. **Given** the project schema has been updated, **When** a developer creates a project without an activeEventId, **Then** the schema validates successfully (field is optional)
3. **Given** an existing project document, **When** the application loads it, **Then** the project loads correctly regardless of whether activeEventId is present

---

### User Story 4 - Developer Uses Renamed Configuration Panels (Priority: P2)

A developer working on the event designer needs to use the configuration panels. They find `WelcomeConfigPanel` (previously `WelcomeControls`) and `ThemeConfigPanel` (previously `ThemeControls`) with consistent naming that better reflects their purpose as configuration panels rather than generic controls.

**Why this priority**: Consistent naming conventions improve code discoverability and maintainability. The rename establishes a pattern for future config panels (e.g., step config panels in Phase 8).

**Independent Test**: Can be verified by confirming the renamed components render correctly in the event designer and all imports have been updated.

**Acceptance Scenarios**:

1. **Given** WelcomeControls has been renamed, **When** a developer imports WelcomeConfigPanel, **Then** the component imports and renders correctly
2. **Given** ThemeControls has been renamed, **When** a developer imports ThemeConfigPanel, **Then** the component imports and renders correctly
3. **Given** the components have been renamed, **When** the event designer is opened, **Then** the Welcome and Theme tabs function identically to before the rename

---

### Edge Cases

- What happens if circular dependencies are introduced between domains? → TypeScript compilation fails with clear error indicating the cycle
- What happens if placeholder files are missing required exports? → Import errors appear during compilation with specific file and export names
- What happens if the project schema migration affects existing documents? → Existing documents remain valid since activeEventId is optional
- What happens if renamed components have external references? → All import statements must be updated; TypeScript catches missed updates

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an `experience` domain directory under `domains/` with the following subdirectories: `shared/`, `steps/`, `validation/`, `runtime/`, `editor/`
- **FR-002**: System MUST provide a `session` domain directory under `domains/` with placeholder files for session types, schemas, and API shapes (`createSession`, `subscribeSession`)
- **FR-003**: System MUST define an `ExperienceProfile` type as a union of `'freeform' | 'survey' | 'informational'`
- **FR-004**: System MUST define an `ExperienceSlot` type as a union of `'main' | 'pregate' | 'preshare'`
- **FR-005**: System MUST provide a placeholder for slot-to-profile compatibility rules (main allows freeform/survey; pregate/preshare allow informational/survey)
- **FR-006**: System MUST extend the project schema with an optional `activeEventId` field of type string (or null)
- **FR-007**: System MUST rename `WelcomeControls` component to `WelcomeConfigPanel` and update all import references
- **FR-008**: System MUST rename `ThemeControls` component to `ThemeConfigPanel` and update all import references
- **FR-009**: System MUST boot successfully after all scaffolding changes with no runtime errors
- **FR-010**: System MUST compile TypeScript with no type errors after all changes
- **FR-011**: System MUST have no circular dependencies between the new domain modules
- **FR-012**: System MUST enforce import boundaries: `domains/experience` must not import from `domains/event` or `domains/guest`; `domains/session` must not import UI from `domains/event` or `domains/guest`

### Key Entities

- **Experience Domain**: The core domain for managing AI-powered photo/video experiences, containing schemas, types, hooks, step definitions, validation rules, runtime engine, and editor components
- **Session Domain**: The domain for managing guest sessions during experience execution, containing session state, persistence, and real-time updates
- **ExperienceProfile**: A categorization type that determines the behavior and available step types for an experience (freeform allows all steps; survey excludes transform; informational allows info only)
- **ExperienceSlot**: A categorization type that determines where an experience can be assigned in an event (main for primary experiences; pregate runs before welcome; preshare runs after main experience)
- **Project (extended)**: Existing project entity extended with activeEventId to link to the currently active event for guest access

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Application boots successfully with new domain scaffolding in place
- **SC-002**: TypeScript compilation completes with zero errors
- **SC-003**: Zero circular dependency warnings or errors in the build output
- **SC-004**: Renamed components (WelcomeConfigPanel, ThemeConfigPanel) function identically to their predecessors
- **SC-005**: All domain placeholder files export their expected types/interfaces
- **SC-006**: Existing functionality remains unaffected by schema and component changes

## Assumptions

- The existing `domains/` directory structure follows the pattern used by other domains (e.g., `event`, `workspace`, `project`)
- Placeholder files will export empty implementations or interface stubs that satisfy TypeScript without runtime functionality
- The `activeEventId` field will be populated by future phases; this phase only adds the schema field
- The session domain API shape (`createSession`, `subscribeSession`) defines function signatures without implementations
- Component renames are pure refactoring with no functional changes to the components themselves
- Experiences are workspace-scoped while UX is event-scoped (per architectural decision)
- The experience domain is a core capability that must not depend on leaf domains (event, guest)
- Profile is immutable after experience creation (enforced in future phases, type defined here)
