# Feature Specification: Multi-Experience Type Editor

**Feature Branch**: `002-multi-experience-editor`
**Created**: 2025-11-20
**Status**: Draft
**Input**: User description: "Enable users to create and edit multiple experience types (Photo, GIF, Video, etc.) within the Event Designer interface, while maximizing code reuse and avoiding duplication of shared editing functionality."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Shared Experience Fields (Priority: P1)

As an event creator, I need to edit common experience settings (label, enabled status, preview media) for any experience type so that I can manage basic experience configuration regardless of whether it's a Photo, GIF, or other type.

**Why this priority**: This is the foundational capability that enables basic experience management. All experience types share these fields, and users must be able to edit them. Without this, no experience editing is possible.

**Independent Test**: Can be fully tested by creating any experience type, editing its label/enabled status/preview media, and verifying changes persist. Delivers immediate value by allowing basic experience configuration.

**Acceptance Scenarios**:

1. **Given** a Photo experience exists, **When** I edit its label to "Summer Vibes", **Then** the label updates and displays "Summer Vibes" in the sidebar
2. **Given** a GIF experience is enabled, **When** I toggle it to disabled, **Then** the experience shows as "(Disabled)" in the sidebar and won't appear to guests
3. **Given** an experience has no preview media, **When** I upload a preview image, **Then** the preview displays in the experience list
4. **Given** any experience type is selected, **When** I click the delete button and confirm, **Then** the experience is removed and I'm redirected to the welcome screen

---

### User Story 2 - Create and Edit GIF Experiences (Priority: P2)

As an event creator, I need to create and configure GIF experiences with GIF-specific settings (frame count, interval, loop count) so that I can offer multi-frame animated photo booth experiences to my guests.

**Why this priority**: This extends experience type support beyond Photo to GIF, validating that the editor architecture can handle multiple types. It's the primary deliverable for multi-type support.

**Independent Test**: Can be fully tested by creating a GIF experience, configuring its frame count/interval/loop settings, and verifying the configuration saves correctly. Delivers value by enabling a new experience type.

**Acceptance Scenarios**:

1. **Given** I'm on the experience creation page, **When** I select "GIF" as the experience type, **Then** I can create a GIF experience
2. **Given** a GIF experience is being edited, **When** I set frame count to 5, interval to 500ms, and loop count to 0 (infinite), **Then** these settings save and display correctly
3. **Given** a GIF experience is selected, **When** I view the editor, **Then** I see GIF-specific fields (frame count, interval, loop) instead of photo-specific fields (overlay frame)
4. **Given** a GIF experience exists, **When** I enable AI transformation and configure a prompt, **Then** AI settings save correctly (GIF supports AI like Photo does)

---

### User Story 3 - Edit Photo-Specific Configuration (Priority: P3)

As an event creator, I need to configure photo-specific settings (countdown timer, overlay frame, AI transformation) so that I can customize the photo capture and transformation experience for my guests.

**Why this priority**: This maintains existing Photo experience functionality while ensuring it works within the new multi-type architecture. Lower priority because Photo editing already exists and needs refactoring, not net-new capability.

**Independent Test**: Can be fully tested by editing a Photo experience, configuring countdown/overlay/AI settings, and verifying they save correctly. Delivers value by preserving existing Photo customization.

**Acceptance Scenarios**:

1. **Given** a Photo experience is being edited, **When** I set countdown to 3 seconds, **Then** guests will see a 3-second countdown before photo capture
2. **Given** a Photo experience is being edited, **When** I upload an overlay frame PNG, **Then** the frame overlays on captured photos
3. **Given** a Photo experience is being edited, **When** I enable AI transformation with a prompt and reference images, **Then** AI settings save and will be used for photo transformations
4. **Given** a Photo experience is selected, **When** I view the editor, **Then** I see photo-specific fields (overlay frame) and AI configuration options

---

### Edge Cases

- What happens when a GIF experience with AI enabled has invalid reference images (deleted from storage)?
- What happens when switching experience types during creation (e.g., start as Photo, switch to GIF)?
- What happens when an experience has a very long label (50 characters max)?
- What happens when deleting an experience while a guest session is using it?
- What happens when AI configuration is enabled but prompt is empty?
- What happens when type-specific config validation fails (e.g., frame count = 0 for GIF)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow creators to create GIF experiences in addition to Photo experiences
- **FR-002**: System MUST allow creators to edit shared fields (label, enabled, preview media) for any experience type
- **FR-003**: System MUST render type-appropriate configuration UI (GIF experiences show frame/interval/loop settings; Photo experiences show overlay settings)
- **FR-004**: System MUST support AI configuration editing for experience types that support AI (Photo, Video, GIF)
- **FR-005**: System MUST NOT display AI configuration UI for experience types without AI support (Wheel, Survey)
- **FR-006**: System MUST validate experience updates based on the specific experience type (Photo uses PhotoConfig schema, GIF uses GifConfig schema)
- **FR-007**: System MUST allow creators to delete any experience type through a shared deletion flow
- **FR-008**: System MUST display visual indication of which experience type is being edited (icon, type label, or similar)
- **FR-009**: System MUST preserve type safety when editing experiences (no runtime type casting or bypassing TypeScript discriminated union narrowing)
- **FR-010**: System MUST support the existing URL structure `/events/[eventId]/design/experiences/[experienceId]` for all experience types

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Experience editor MUST be fully functional on mobile viewports (320px-768px) with touch-friendly controls
- **MFR-002**: Type-specific configuration sections MUST stack vertically on mobile without horizontal scroll
- **MFR-003**: Delete button and other critical actions MUST meet minimum touch target size (44x44px)
- **MFR-004**: Preview media uploads MUST work on mobile devices (camera, photo library access)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All experience updates MUST be validated with type-specific Zod schemas (photoExperienceSchema for Photo, gifExperienceSchema for GIF)
- **TSR-002**: Component props MUST use discriminated union types from schemas.ts (no loose `any` types)
- **TSR-003**: Type narrowing MUST occur based on the `type` field to ensure compile-time type safety
- **TSR-004**: Server actions MUST validate experience type and apply appropriate schema validation before database writes
- **TSR-005**: TypeScript strict mode MUST be maintained with zero type errors after implementation

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All experience updates MUST use Admin SDK via Server Actions (no client-side direct Firestore writes)
- **FAR-002**: Experience schemas MUST remain in `web/src/features/experiences/lib/schemas.ts` as single source of truth
- **FAR-003**: Experience documents in Firestore MUST include nested `config` and `aiConfig` objects (not flat structure)
- **FAR-004**: Image URLs (overlayFramePath, referenceImagePaths, previewPath) MUST be stored as full public URLs
- **FAR-005**: Repository reads MUST validate data against appropriate discriminated union schema before returning

### Key Entities

- **Experience (Discriminated Union)**: Represents an interactive experience at an event. Base fields shared across all types: id, eventId, type, label, enabled, hidden, previewPath, previewType, createdAt, updatedAt. Each type has specific config structure:
  - **PhotoExperience**: type="photo", config contains countdown (0-10 seconds) and overlayFramePath (nullable), aiConfig for AI transformation
  - **GifExperience**: type="gif", config contains frameCount (3-10), intervalMs (100-1000), loopCount (0=infinite), countdown (optional), aiConfig for AI transformation
  - **VideoExperience**: type="video", config contains maxDurationSeconds (1-60), allowRetake, countdown (optional), aiConfig for AI transformation
  - **WheelExperience**: type="wheel", config contains items array, spinDurationMs, autoSpin (no aiConfig)
  - **SurveyExperience**: type="survey", config contains surveyStepIds, required, showProgressBar (no aiConfig)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can create both Photo and GIF experiences and configure type-specific settings in under 3 minutes
- **SC-002**: All shared field editing (label, enabled, preview media, delete) works identically across Photo and GIF experiences with zero behavioral differences
- **SC-003**: TypeScript compilation completes with zero type errors related to experience editing
- **SC-004**: The DesignSidebar and ExperiencesList components display both Photo and GIF experiences with correct icons and no TypeScript errors
- **SC-005**: Experience updates are validated with appropriate schemas (Photo uses photoExperienceSchema, GIF uses gifExperienceSchema) with 100% validation coverage
- **SC-006**: Adding a third experience type (e.g., Video) requires less than 50 lines of new code (demonstrates extensible architecture)
- **SC-007**: Zero code duplication exists for shared editing functionality (label, enabled, preview, delete editors appear once in codebase)
- **SC-008**: Creators can delete any experience type (Photo or GIF) through a single shared flow with identical behavior

## Assumptions

- **A-001**: The discriminated union schema in `schemas.ts` is complete and accurate for Photo and GIF types
- **A-002**: GIF experiences use the same `aiConfig` structure as Photo experiences (model, prompt, reference images, aspect ratio)
- **A-003**: The experience creation flow (`/events/[eventId]/design/experiences/create`) exists or will be updated to support type selection
- **A-004**: Server Actions pattern (async functions in `actions/` folder) will continue to be used for all write operations
- **A-005**: Developers implementing this feature understand TypeScript discriminated unions and type narrowing
- **A-006**: The application is in development stage with flexibility to refactor existing Photo editing components

## Out of Scope

- Implementation of Video, Wheel, and Survey experience editing (only Photo and GIF in scope)
- Guest-facing experience rendering (this is admin/creator-focused only)
- AI generation execution (only configuration of AI settings, not actual AI transformation)
- Experience reordering or drag-and-drop in sidebar
- Bulk experience operations (multi-select, bulk delete)
- Experience duplication or cloning
- Experience import/export
- Redesign of overall Experience editing UX (maintain existing design patterns)
- Changes to the discriminated union schema structure (use existing schemas)
- Changes to Firebase data model or repository patterns (work within existing architecture)
