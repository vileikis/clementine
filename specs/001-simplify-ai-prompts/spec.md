# Feature Specification: Simplify AI Prompts

**Feature Branch**: `001-simplify-ai-prompts`
**Created**: 2025-11-11
**Status**: Draft
**Input**: User description: "we want to change how we define AI effects for events. Let's drop old predefined events (background swap and deep fake). From now on user can simply define: prompt and reference images. If the prompt is provided then during transform stage in guest experience it should run AI transformation, otherwise just copy input photo to the result photo. Remove any hardcoded AI prompts in backend and use prompt from scene directly. defaultPrompt on scene is deprecated now and can be removed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Custom AI Effect with Prompt (Priority: P1)

An event creator wants to define a custom AI transformation using their own prompt (e.g., "Make the person look like a 1920s movie star") and optional reference images to guide the AI style.

**Why this priority**: This is the core capability that replaces the hardcoded effects system. Without this, creators have no way to define AI transformations.

**Independent Test**: Can be fully tested by creating a scene with a custom prompt and reference images, submitting a photo as a guest, and verifying the AI transformation follows the prompt. Delivers complete custom AI effect functionality.

**Acceptance Scenarios**:

1. **Given** an event creator is editing a scene, **When** they enter a custom AI prompt like "Transform into anime style" and optionally upload reference images, **Then** the prompt and reference images are saved to the scene
2. **Given** a scene has a custom prompt and reference images, **When** a guest uploads a photo, **Then** the AI transformation uses the scene's custom prompt and reference images to generate the result
3. **Given** a scene has a custom prompt and reference images, **When** transformation completes, **Then** the result reflects the style and instructions from the prompt and reference images

---

### User Story 2 - No-Transform Passthrough (Priority: P2)

An event creator wants to create a scene where guests can upload photos without any AI transformation (e.g., simple photo collection or manual post-processing later).

**Why this priority**: Enables simpler use cases and reduces AI costs when transformation isn't needed. Important for event types like "submit your photo for a contest" or "photo gallery collection."

**Independent Test**: Can be fully tested by creating a scene with an empty prompt, submitting a photo as a guest, and verifying the input photo is directly copied to the result without transformation. Delivers complete passthrough functionality.

**Acceptance Scenarios**:

1. **Given** an event creator is editing a scene, **When** they leave the prompt field empty, **Then** the scene is configured for passthrough mode (no AI transformation)
2. **Given** a scene has no prompt (empty string), **When** a guest uploads a photo, **Then** the system skips AI transformation and copies the input photo directly to the result
3. **Given** passthrough mode is active, **When** a guest views their result, **Then** they see their original uploaded photo unchanged

---

### User Story 3 - Remove Legacy Effect System (Priority: P3)

The predefined effect types (background_swap, deep_fake) and associated UI components need to be removed from the codebase, since all existing events already have prompts populated and will work with the new prompt-based system.

**Why this priority**: Simplifies codebase by removing deprecated code paths. Existing events already have `prompt` field populated, so no migration logic is needed.

**Independent Test**: Can be fully tested by verifying existing scenes with predefined effects continue to work using their `prompt` field, and new scene creation UI only shows custom prompt editor (no effect type selector). Delivers clean removal of legacy code.

**Acceptance Scenarios**:

1. **Given** an existing scene has effect type "background_swap" or "deep_fake" and a populated `prompt` field, **When** a guest submits a photo, **Then** the transformation uses the scene's `prompt` field (effect type is ignored)
2. **Given** an event creator creates a new scene, **When** they configure AI effects, **Then** they only see custom prompt editor (no predefined effect dropdown)
3. **Given** the `effect` field and `defaultPrompt` field exist in legacy schemas, **When** cleanup is complete, **Then** both fields are safely removed from Scene type definitions and UI components

---

### Edge Cases

- What happens when a prompt is provided but no reference images? (System uses only the prompt text for transformation)
- What happens when reference images are uploaded but no prompt? (No AI transformation occurs; passthrough mode is used regardless of reference images)
- How does the system handle very long prompts (e.g., 2000+ characters)? (Prompt length is limited to 600 characters with validation on both client and backend)
- What happens to scenes with `defaultPrompt` field after migration? (Field can be safely deleted from the schema)
- How are existing events with predefined effects handled during migration? (All existing events already have `prompt` field populated, so they work without changes)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Scene MUST store a single custom `prompt` field (string) that defines the AI transformation instructions
- **FR-002**: Scene MUST support optional reference images (one or more image files) to guide AI style
- **FR-003**: System MUST use the scene's `prompt` field directly for AI transformation without applying hardcoded effect templates
- **FR-004**: System MUST skip AI transformation and copy input photo to result photo when `prompt` is empty or null
- **FR-005**: System MUST remove the `effect` field (EffectType: "background_swap" | "deep_fake") from new scene creation
- **FR-006**: System MUST remove the `defaultPrompt` field from Scene schema
- **FR-007**: System MUST remove hardcoded prompt templates from backend (buildPromptForEffect function)
- **FR-008**: Event creators MUST be able to enter custom prompt text (up to 600 characters) when configuring a scene
- **FR-009**: Event creators MUST be able to upload reference images for AI style guidance
- **FR-010**: System MUST validate prompt length does not exceed 600 characters on both client and backend
- **FR-011**: Guests MUST see AI-transformed results when scene has a non-empty prompt
- **FR-012**: Guests MUST see their original photo as the result when scene has no prompt (passthrough mode)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Prompt editor MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Prompt text input MUST be easily editable on mobile with appropriate keyboard type
- **MFR-003**: Reference image upload button MUST meet minimum touch target size (44x44px)
- **MFR-004**: Reference images preview MUST be responsive and viewable on small screens

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Scene prompt field MUST be validated with Zod schema (string, max 600 chars, nullable)
- **TSR-002**: Reference image uploads MUST be validated for file type (image/png, image/jpeg, image/webp) and size (max 10MB per image)
- **TSR-003**: AI transformation logic MUST type-check prompt as string | null | undefined before processing

### Key Entities

- **Scene**: Represents a configurable AI photo booth experience within an event
  - `prompt` (string | null): Custom AI transformation instructions; if empty/null, passthrough mode is used
  - `referenceImagePath` (string | undefined): Storage path to reference images for AI style guidance
  - Removal of: `effect` (EffectType), `defaultPrompt` (deprecated)

- **Session**: Represents a guest interaction with a scene
  - `inputImagePath` (string): Original photo uploaded by guest
  - `resultImagePath` (string): AI-transformed result or passthrough copy
  - `state` (SessionState): Includes "transforming" for AI processing or direct "ready" for passthrough

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can configure custom AI prompts in under 2 minutes without technical assistance
- **SC-002**: 100% of scenes with non-empty prompts successfully generate AI-transformed results using custom prompts (no hardcoded templates)
- **SC-003**: 100% of scenes with empty prompts deliver passthrough results (original photo) within 5 seconds
- **SC-004**: Zero legacy prompt template code remains in backend after migration (verified via code review)
- **SC-005**: Existing events with predefined effects continue to function without errors during transition period
