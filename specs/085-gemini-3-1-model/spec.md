# Feature Specification: Gemini 3.1 Flash Image Model Support

**Feature Branch**: `085-gemini-3-1-model`
**Created**: 2026-02-28
**Status**: Draft
**Input**: User description: "Add support for new gemini image generation model gemini-3.1-flash-image-preview. It is only available in the global region. Same as gemini-3-pro-image-preview. Experience builder should use this model. Functions backend should utilise this model."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experience Creator Selects Gemini 3.1 Flash Model (Priority: P1)

An experience creator setting up an AI image experience wants to choose the Gemini 3.1 Flash model from the model dropdown in the experience builder. They open the AI image configuration, see "Gemini 3.1 Flash" as an option alongside existing models (Gemini 2.5 Flash and Gemini 3 Pro), and select it. The experience saves with this model choice.

**Why this priority**: This is the core user-facing capability. Without model selection in the experience builder, the new model cannot be used at all.

**Independent Test**: Can be fully tested by creating a new experience, selecting "Gemini 3.1 Flash" from the model dropdown, saving the experience, and confirming the selection persists on reload.

**Acceptance Scenarios**:

1. **Given** a creator is configuring an AI image experience, **When** they open the model dropdown, **Then** "Gemini 3.1 Flash" appears as a selectable option alongside existing models.
2. **Given** a creator has selected "Gemini 3.1 Flash" as the model, **When** they save the experience, **Then** the model choice is persisted and reflected when the experience is reopened.
3. **Given** an experience was previously configured with a different model, **When** the creator changes it to "Gemini 3.1 Flash" and saves, **Then** the new model selection replaces the old one.

---

### User Story 2 - Guest Receives AI-Transformed Image Using Gemini 3.1 Flash (Priority: P1)

A guest visits an experience link configured with Gemini 3.1 Flash, uploads their photo, and receives an AI-transformed result. The backend processing pipeline uses the Gemini 3.1 Flash model in the global region to generate the image.

**Why this priority**: Equally critical to model selection — the end-to-end processing pipeline must work for the feature to deliver value.

**Independent Test**: Can be tested by triggering an image generation job with a Gemini 3.1 Flash-configured experience and verifying a transformed image is returned.

**Acceptance Scenarios**:

1. **Given** an experience is configured with "Gemini 3.1 Flash", **When** a guest submits a photo for processing, **Then** the system generates an AI-transformed image using the Gemini 3.1 Flash model.
2. **Given** the backend receives a generation request for "Gemini 3.1 Flash", **When** it initializes the AI client, **Then** it uses the "global" region (not the default regional endpoint).
3. **Given** a guest submits a photo to a Gemini 3.1 Flash experience, **When** the image is processed, **Then** the result quality and format are consistent with other supported image models.

---

### Edge Cases

- What happens if the Gemini 3.1 Flash model becomes unavailable or returns errors? The system uses the same error handling as existing models — the job fails with a clear error message and the guest is notified.
- What happens if the global region endpoint is temporarily unreachable? Existing retry and error handling logic applies, consistent with gemini-3-pro-image-preview behavior.
- What happens to existing experiences configured with other models? They remain completely unaffected — their saved model choice does not change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST include "gemini-3.1-flash-image-preview" as a valid AI image generation model option in the shared model schema.
- **FR-002**: The experience builder MUST display "Gemini 3.1 Flash" as a selectable model option in the AI image configuration model dropdown.
- **FR-003**: The backend processing pipeline MUST route requests for "gemini-3.1-flash-image-preview" to the "global" region endpoint (not the default regional endpoint).
- **FR-004**: The system MUST allow experiences to be saved, loaded, and updated with "gemini-3.1-flash-image-preview" as the selected model.
- **FR-005**: The system MUST generate AI-transformed images when "gemini-3.1-flash-image-preview" is the configured model for an experience.

### Key Entities

- **AI Image Model**: The model identifier used for image generation. A new value ("gemini-3.1-flash-image-preview") is added to the existing set of supported models.
- **Experience Configuration**: The saved configuration for an AI image experience, which includes the selected model. The image generation config's model field accepts the new model value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Experience creators can select "Gemini 3.1 Flash" from the model dropdown and save their experience with that choice.
- **SC-002**: Guests submitting photos to experiences configured with Gemini 3.1 Flash receive AI-transformed images.
- **SC-003**: All requests using the Gemini 3.1 Flash model are routed to the global region, matching the behavior of Gemini 3 Pro.
- **SC-004**: Existing experiences using other models continue to function without any changes.

## Assumptions

- The "gemini-3.1-flash-image-preview" model is already available and accessible via the Vertex AI API in the "global" region.
- The model accepts the same request format (prompt, reference images, aspect ratio) as existing supported models.
- No new API permissions or credentials are required beyond what is already configured for existing Gemini models.
- The default model for new experiences remains "gemini-2.5-flash-image" (unchanged).
- Pricing and rate limits for the new model are handled externally and do not require in-app changes.
