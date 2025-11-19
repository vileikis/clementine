# Feature Specification: Remove Scenes Dependency

**Feature Branch**: `001-remove-scenes`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "Fully eliminate the legacy Scenes architecture from the Events domain"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Event Creator Manages Experiences Without Scene Confusion (Priority: P1)

As an event creator using the Event Builder, I need to configure my event experiences without encountering any legacy scene-related UI, data, or concepts, so that I have a clear, simplified experience management workflow.

**Why this priority**: This is the primary value delivery - removing technical debt and UI confusion. Event creators currently may see scene references in the codebase that could leak into the UI or cause errors. Eliminating this ensures a clean, maintainable product.

**Independent Test**: Can be tested by navigating through the entire Event Builder (Content, Distribution, Results tabs), creating and editing experiences, and verifying no scene-related UI elements, errors, or references appear anywhere in the admin interface.

**Acceptance Scenarios**:

1. **Given** an event creator is on the Event Builder Content tab, **When** they view the experiences list and add/edit experiences, **Then** no scene-related UI elements, labels, or error messages appear
2. **Given** an event creator creates a new event from scratch, **When** they configure welcome screen, experiences, and ending screen, **Then** the event is created successfully without any `currentSceneId` or scene-related fields in the database
3. **Given** an existing event is loaded in the Event Builder, **When** the event initializes, **Then** no scene-loading logic executes and no scene-related errors appear in console

---

### User Story 2 - Guest Completes Event Flow Without Scene Logic (Priority: P1)

As a guest participating in an event, I need to complete the full event flow (welcome → experiences → ending) without the system referencing or depending on scene logic, so that my experience is fast, reliable, and error-free.

**Why this priority**: Guest experience is core to the product. Any scene-related logic still running in the guest flow could cause navigation errors, state management issues, or crashes. This ensures guest flows work purely on the experiences collection.

**Independent Test**: Can be tested by completing a full guest journey from event link → welcome screen → photo capture → AI transformation → ending screen → share, and verifying no scene-related code executes or errors occur.

**Acceptance Scenarios**:

1. **Given** a guest visits an event link, **When** they progress through the welcome screen and select an experience, **Then** navigation works correctly without any `currentSceneId` checks or scene-based routing
2. **Given** a guest captures a photo in an experience, **When** the photo is processed and transformed, **Then** AI prompts and reference images are loaded from the experience document, not from a scene document
3. **Given** a guest completes all experiences, **When** they reach the ending screen, **Then** the system determines completion based on experiences count, not scene state

---

### User Story 3 - Developer Works with Clean Experience-Based Architecture (Priority: P2)

As a developer maintaining the codebase, I need all scene-related code, types, imports, and Firestore paths removed, so that the architecture is simpler, easier to understand, and less prone to bugs from legacy code paths.

**Why this priority**: This is a technical hygiene priority. While it doesn't directly change user-facing behavior after P1 and P2 are complete, it prevents future bugs, reduces cognitive load, and makes the codebase more maintainable.

**Independent Test**: Can be tested by running a codebase search for "scene" (case-insensitive), checking TypeScript types, Zod schemas, Firestore rules, and imports, and verifying no scene-related code remains except for historical comments or documentation.

**Acceptance Scenarios**:

1. **Given** a developer searches the codebase for scene-related terms, **When** they review all matches, **Then** no TypeScript interfaces, Zod schemas, or component logic references scenes (excluding historical documentation)
2. **Given** a developer reviews Firestore rules, **When** they check path permissions, **Then** no rules reference `/events/{eventId}/scenes` paths
3. **Given** the application is built for production, **When** TypeScript compilation runs, **Then** no unused imports or dead code warnings related to scenes appear

---

### Edge Cases

- What happens when an old event document still has a `currentSceneId` field in Firestore? The application should ignore this field entirely and not break.
- What happens when Firestore rules are deployed but old client code still tries to read scenes? The rules should explicitly deny access to the `/events/{eventId}/scenes` path.
- What happens when AI reference images were previously stored under a scene path? They should have already been migrated to experience-level paths, or the code should gracefully handle missing references.
- What happens when a developer accidentally introduces a scene import in new code? TypeScript should fail to compile because scene-related types no longer exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST NOT create, update, or read from the `/events/{eventId}/scenes` Firestore subcollection
- **FR-002**: Event Builder MUST load and display experiences directly from `/events/{eventId}/experiences` without any scene-loading logic
- **FR-003**: Guest flow MUST determine navigation, state, and completion based solely on the experiences collection
- **FR-004**: AI prompt configuration MUST be stored and retrieved from experience documents, not scene documents
- **FR-005**: Reference images for AI generation MUST be associated with experiences, not scenes
- **FR-006**: Event schema MUST NOT include a `currentSceneId` field or any scene-related properties
- **FR-007**: Firestore security rules MUST explicitly deny read/write access to `/events/{eventId}/scenes` paths
- **FR-008**: All TypeScript interfaces, types, and Zod schemas referencing scenes MUST be removed from the codebase
- **FR-009**: All UI components (admin and guest) MUST NOT reference, import, or depend on scene-related code
- **FR-010**: Application MUST build successfully with zero TypeScript errors after all scene code is removed

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Guest experience flow on mobile (320px-768px) MUST work without any scene-based navigation logic
- **MFR-002**: Event Builder experience management on mobile MUST remain functional after scene removal (no new mobile UI requirements, just maintaining existing mobile-first design)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Event Zod schema MUST NOT include `currentSceneId` or any scene-related fields
- **TSR-002**: Experience Zod schema MUST include all AI-related fields (aiEnabled, aiPrompt, aiModel, aiReferenceImagePaths) that were previously in scenes
- **TSR-003**: TypeScript strict mode MUST be maintained with no scene-related type references

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Firestore rules MUST be updated to deny access to `/events/{eventId}/scenes` paths
- **FAR-002**: All Admin SDK operations MUST NOT reference scene paths or subcollections
- **FAR-003**: Client SDK real-time subscriptions MUST NOT listen to scene documents
- **FAR-004**: Experience schema in `web/src/lib/schemas/` MUST be updated to include AI-related fields if not already present
- **FAR-005**: Reference images MUST be stored with full public URLs at the experience level

### Key Entities

- **Event**: Root event configuration that previously contained `currentSceneId` - this field must be removed. The event's experiences collection becomes the sole source of truth for event content structure.
- **Experience**: Interactive experiences (photo/video/gif/wheel) that must now contain all AI-related configuration fields (aiEnabled, aiPrompt, aiModel, aiReferenceImagePaths) previously stored in scenes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can create and configure events from start to finish without encountering any scene-related errors or UI elements
- **SC-002**: Guests can complete full event flows (welcome → experiences → ending) with zero scene-related code execution paths
- **SC-003**: Codebase search for "scene" (case-insensitive, excluding comments/docs) returns zero matches in TypeScript files, schemas, components, or Firestore utility files
- **SC-004**: Application builds successfully with zero TypeScript compilation errors related to missing scene types or imports
- **SC-005**: Firestore rules validation passes with explicit deny rules for `/events/{eventId}/scenes` paths
- **SC-006**: All experience documents contain complete AI configuration data (no missing fields that were previously in scenes)

## Assumptions *(optional)*

- All existing events in production either have no scenes subcollection, or any existing scene data is already obsolete and can be safely ignored
- Reference images previously associated with scenes have already been migrated to experience-level storage paths, or the migration is not required (as stated in requirement section 6 of the feature description)
- No active code paths currently depend on scenes for critical functionality (scenes are truly a legacy POC structure)
- The Event Builder UI already has a primary navigation structure based on experiences, not scenes

## Dependencies *(optional)*

- Firestore rules deployment mechanism must be available to update security rules
- No new database migrations are required (as confirmed in the feature description)

## Scope Boundaries *(optional)*

### In Scope

- Removing all scene-related code, types, and Firestore paths
- Updating Firestore rules to deny scene access
- Ensuring Event Builder and guest flows work solely on experiences
- Moving AI configuration fields to experience level
- Cleaning up all scene-related imports and dead code

### Out of Scope

- Data migration of existing scene documents (explicitly stated as not needed)
- Changes to experience types or capabilities beyond AI field migration
- New features or enhancements to the experiences collection
- Changes to survey, session, or other event subcollections
- Performance optimizations unrelated to scene removal

## Open Questions *(optional)*

None - the feature description is comprehensive and clear about the removal approach.
