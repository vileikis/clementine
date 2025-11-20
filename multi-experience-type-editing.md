# Feature: Multi-Experience Type Editing Support

**Created**: 2025-11-20
**Status**: Draft

## Goal

Enable users to create and edit multiple experience types (Photo, GIF, Video, etc.) within the Event Designer interface, while maximizing code reuse and avoiding duplication of shared editing functionality.

## Problem Statement

Currently, the Experience editing components (`ExperienceEditor.tsx` and `ExperienceEditorWrapper.tsx`) are tightly coupled to the `PhotoExperience` type. This creates several issues:

1. **Type Coupling**: Components explicitly type props and state as `PhotoExperience`, preventing reuse for other experience types
2. **Action Coupling**: Wrapper uses `updatePhotoExperience` action, which only handles photo-specific updates
3. **Configuration Hardcoding**: Editor component directly renders photo-specific config sections (countdown, overlay, AI settings) without abstraction
4. **Discriminated Union Underutilization**: The codebase has a well-defined discriminated union (`Experience` type) with shared base fields and type-specific `config`/`aiConfig` objects, but the UI doesn't leverage this structure
5. **Future Scalability**: Adding each new experience type would require duplicating the entire editor stack (editor + wrapper + actions)

The discriminated union schema in `schemas.ts` already defines:
- **Shared base fields**: `id`, `eventId`, `label`, `type`, `enabled`, `hidden`, `previewPath`, `previewType`, `createdAt`, `updatedAt`
- **Type-specific config**: Each experience type has its own `config` object structure (e.g., `PhotoConfig`, `GifConfig`, `VideoConfig`)
- **AI support**: Photo, Video, and GIF experiences all share the same `aiConfig` structure
- **No AI support**: Wheel and Survey experiences do not have `aiConfig`

## Requirements

### Functional Requirements

**FR-001**: Users MUST be able to create GIF experiences in addition to Photo experiences

**FR-002**: Users MUST be able to edit all shared experience fields (label, enabled, preview media) regardless of experience type

**FR-003**: Users MUST be able to edit type-specific configuration fields that are unique to each experience type

**FR-004**: The system MUST render appropriate configuration UI based on the experience type being edited (e.g., GIF experiences show `frameCount`, `intervalMs`, `loopCount` instead of photo's `overlayFramePath`)

**FR-005**: The system MUST support AI configuration editing for experience types that include `aiConfig` (Photo, Video, GIF)

**FR-006**: The system MUST NOT show AI configuration UI for experience types that don't support it (Wheel, Survey)

**FR-007**: Deletion of any experience type MUST work through a single shared deletion flow

**FR-008**: Server actions MUST validate and update experiences based on their discriminated type

### Code Quality Requirements

**CQR-001**: Shared editing logic (label, enabled, preview media, delete) MUST NOT be duplicated across type-specific components

**CQR-002**: The editor architecture MUST be extensible to support future experience types (Video, Wheel, Survey) without major refactoring

**CQR-003**: Type safety MUST be preserved throughout the component hierarchy using TypeScript discriminated unions

**CQR-004**: Configuration sections MUST be modular and composable based on experience type capabilities

**CQR-005**: Update actions MUST use type-safe partial update schemas that respect the discriminated union structure

### User Experience Requirements

**UXR-001**: The URL structure `/events/[eventId]/design/experiences/[experienceId]` MUST work for all experience types

**UXR-002**: The Design Sidebar MUST correctly display icons and labels for all experience types (already implemented)

**UXR-003**: The Experiences List MUST correctly highlight the selected experience regardless of type (already implemented)

**UXR-004**: Experience creation flow MUST allow users to select the experience type before proceeding to configuration

**UXR-005**: Experience editor MUST provide visual indication of which experience type is being edited

### Technical Constraints

**TC-001**: The system MUST NOT introduce runtime type casting or `as` assertions that bypass TypeScript's discriminated union narrowing

**TC-002**: All experience updates MUST go through Server Actions (no client-side direct Firestore writes)

**TC-003**: Schema validation MUST occur at the Server Action boundary using appropriate Zod schemas

**TC-004**: The solution MUST work within the existing folder structure: `web/src/features/experiences/`

## Current State Analysis

### Existing Components

1. **DesignSidebar** (`web/src/features/events/components/designer/DesignSidebar.tsx`)
   - Already handles displaying all experience types with correct icons
   - Uses discriminated union `Experience` type
   - Renders links to `/events/[eventId]/design/experiences/[experienceId]` for all types

2. **ExperiencesList** (`web/src/features/experiences/components/shared/ExperiencesList.tsx`)
   - Already displays all experience types with icons
   - Currently has TypeScript errors due to type mismatch (expects `PhotoExperience[]` but receives `Experience[]`)
   - Needs to accept discriminated union type

3. **ExperienceEditor** (`web/src/features/experiences/components/shared/ExperienceEditor.tsx`)
   - Tightly coupled to `PhotoExperience` type
   - Renders shared sections: label, enabled toggle, preview media, delete button
   - Renders photo-specific sections: CountdownSettings, OverlaySettings, AITransformSettings
   - Uses photo-specific state management

4. **ExperienceEditorWrapper** (`web/src/features/experiences/components/shared/ExperienceEditorWrapper.tsx`)
   - Wraps ExperienceEditor with Server Actions
   - Calls `updatePhotoExperience` and `deleteExperience` actions
   - Handles navigation after deletion

### Existing Actions

- `updatePhotoExperience` - Only handles partial `PhotoExperience` updates
- `deleteExperience` - Type-agnostic deletion (already works for all types)

### Existing Schemas

All experience types are defined in `web/src/features/experiences/lib/schemas.ts`:
- Base: `baseExperienceSchema` (shared fields)
- Photo: `photoExperienceSchema` with `photoConfigSchema` + `aiConfigSchema`
- GIF: `gifExperienceSchema` with `gifConfigSchema` + `aiConfigSchema`
- Video: `videoExperienceSchema` with `videoConfigSchema` + `aiConfigSchema`
- Wheel: `wheelExperienceSchema` with `wheelConfigSchema` (no AI)
- Survey: `surveyExperienceSchema` with `surveyConfigSchema` (no AI)
- Union: `experienceSchema` discriminated union on `type` field

## Key Design Challenges

### Challenge 1: Type-Safe Editing Components

**Problem**: How do we create reusable editor components that work with the discriminated union while maintaining type safety?

**Considerations**:
- TypeScript discriminated unions require narrowing based on the `type` field
- React components need to know which type they're rendering at compile time
- Cannot pass `Experience` union directly to components that expect specific config shapes
- Need to preserve type safety when reading/writing type-specific fields

### Challenge 2: Shared vs Type-Specific Configuration

**Problem**: How do we organize the UI to clearly separate shared fields from type-specific fields?

**Considerations**:
- All experiences share: label, enabled, preview media, delete
- AI-capable experiences share: AI configuration UI
- Each type has unique config fields that need custom UI
- Configuration sections should be composable and reusable
- UI should adapt based on type capabilities (e.g., no AI section for wheel experiences)

### Challenge 3: Update Action Design

**Problem**: How do we handle partial updates for different experience types with a single action or minimal action set?

**Considerations**:
- Cannot use a single `updateExperience` action that accepts `Partial<Experience>` (discriminated unions don't work well with Partial)
- Could use type-specific actions (`updatePhotoExperience`, `updateGifExperience`) but this creates duplication
- Could use a single action with type discrimination and type-specific update schemas
- Must validate against correct schema based on experience type
- Must preserve type safety in the repository layer

### Challenge 4: Configuration UI Modularity

**Problem**: How do we avoid duplicating common configuration sections while supporting type-specific sections?

**Considerations**:
- Countdown UI is shared by Photo, Video, and GIF experiences
- AI Transform UI is shared by Photo, Video, and GIF experiences
- Each type has unique config sections (e.g., OverlaySettings for photo only, frame settings for GIF only)
- Need clear component composition strategy that scales to 5+ experience types

### Challenge 5: Component Hierarchy

**Problem**: What's the optimal component hierarchy to balance reusability and type safety?

**Considerations**:
- Could have a single polymorphic `ExperienceEditor` with conditional rendering (loses type safety)
- Could have type-specific editor components (`PhotoEditor`, `GifEditor`) with shared sub-components (more type-safe but potentially redundant)
- Could have a base editor that renders type-specific sections via render props or component injection
- Wrapper component needs to determine which editor to render based on experience type

## Success Criteria

**SC-001**: Users can successfully create both Photo and GIF experiences through the UI

**SC-002**: Users can edit all shared fields (label, enabled, preview media) for both Photo and GIF experiences

**SC-003**: Users can edit photo-specific config (countdown, overlay, AI) for Photo experiences

**SC-004**: Users can edit GIF-specific config (frameCount, intervalMs, loopCount, countdown, AI) for GIF experiences

**SC-005**: TypeScript compilation succeeds with zero type errors related to experience editing

**SC-006**: The DesignSidebar and ExperiencesList TypeScript errors are resolved

**SC-007**: No code duplication exists for shared editing functionality (label, enabled, preview, delete)

**SC-008**: The architecture can support adding Video, Wheel, and Survey experience types with minimal changes

**SC-009**: All experience updates are validated with appropriate Zod schemas based on type

**SC-010**: Experience deletion works for all experience types through shared flow

## Out of Scope

- Implementation of Video, Wheel, and Survey experience editing (only Photo and GIF are in scope)
- Guest-facing experience rendering (this feature is admin/creator-focused only)
- AI generation integration (only configuration of AI settings, not execution)
- Experience reordering or drag-and-drop in the sidebar
- Bulk experience operations (multi-select, bulk delete, etc.)
- Experience duplication/cloning
- Experience import/export
- Advanced validation rules beyond schema validation (e.g., business logic constraints)

## Assumptions

**A-001**: The discriminated union schema in `schemas.ts` is complete and correct for Photo and GIF types

**A-002**: The GIF experience type will use similar AI configuration as Photo experiences (same `aiConfig` structure)

**A-003**: Developers implementing this feature have understanding of TypeScript discriminated unions and type narrowing

**A-004**: The existing Server Actions pattern (async functions in `actions/` folder) will continue to be used

**A-005**: Experience creation flow already exists or will be handled separately (this feature focuses on editing)

**A-006**: The `/events/[eventId]/design/experiences/create` route will support type selection

## Non-Goals

- This feature does NOT aim to redesign the overall Experience editing UX
- This feature does NOT aim to change the discriminated union schema structure
- This feature does NOT aim to implement AI generation functionality
- This feature does NOT aim to add new experience types beyond GIF
- This feature does NOT aim to change the Firebase data model or repository patterns
