# Feature Specification: Theme Editor

**Feature Branch**: `003-theme-editor`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Theme Editor - Enable users to configure visual theme settings for events via the Event → Design → Theme page"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Event Theme (Priority: P1)

An event creator wants to customize their event's visual appearance so that guests see a branded, consistent experience throughout their journey. The creator accesses the Theme page from the Design section, modifies colors, fonts, buttons, and backgrounds, then saves their changes.

**Why this priority**: This is the core value proposition - without theme configuration, the feature has no purpose. Events cannot be visually customized, resulting in generic, unbranded experiences.

**Independent Test**: Can be fully tested by creating an event, navigating to Design → Theme, modifying theme properties, saving, and verifying changes persist after page refresh.

**Acceptance Scenarios**:

1. **Given** an event creator is on the Theme configuration page, **When** they modify any theme property (color, font, button style, background), **Then** the change is immediately reflected in the preview panel.

2. **Given** an event creator has made theme changes, **When** they click "Save Changes", **Then** the changes are persisted and a success notification appears.

3. **Given** an event creator has made theme changes, **When** they use the keyboard shortcut (Cmd+S on Mac, Ctrl+S on Windows), **Then** the save action is triggered.

4. **Given** an event creator attempts to save, **When** the save operation fails, **Then** an error notification appears with a descriptive message.

---

### User Story 2 - Preview Theme Changes in Real-Time (Priority: P2)

An event creator wants to see how their theme changes will look on a guest's mobile device before committing to saving. The preview panel shows a mobile device frame with sample content styled according to the current (unsaved) theme values.

**Why this priority**: Preview functionality validates the creator's choices before saving, reducing trial-and-error iterations. Without preview, creators would need to save and check the live experience repeatedly.

**Independent Test**: Can be fully tested by opening the Theme page and modifying each theme property, verifying the preview panel updates instantly to reflect each change.

**Acceptance Scenarios**:

1. **Given** the theme editor is open, **When** the creator views the preview panel, **Then** they see a mobile device frame with 9:19.5 aspect ratio containing sample content.

2. **Given** the preview panel is visible, **When** the creator changes the primary color, **Then** the preview updates instantly to show the new color.

3. **Given** a logo has been uploaded, **When** viewing the preview, **Then** the logo appears in the designated preview area.

4. **Given** a background image is configured with overlay opacity, **When** viewing the preview, **Then** the background image appears with the specified overlay darkness.

---

### User Story 3 - Upload Brand Assets (Priority: P3)

An event creator wants to upload their brand logo and background image to further customize the event experience. They use image upload fields to select files that are stored and displayed in both the configuration panel and preview.

**Why this priority**: Brand assets (logo, background) provide the most visually impactful customization but are optional enhancements to the core color/typography theming.

**Independent Test**: Can be fully tested by uploading a logo image, verifying it appears in the preview, saving, and confirming the URL is persisted.

**Acceptance Scenarios**:

1. **Given** the creator is in the Identity section, **When** they upload a logo image, **Then** the image is stored and immediately visible in the preview panel.

2. **Given** the creator is in the Background section, **When** they upload a background image, **Then** the image is stored and displayed as the preview background.

3. **Given** an image upload fails, **When** the error occurs, **Then** the creator sees an error message explaining the issue.

---

### Edge Cases

- What happens when the creator leaves the page with unsaved changes? (Assumption: Browser handles via standard navigation - no custom confirmation dialog required for MVP)
- How does the system handle invalid color values? (Validation enforces 6-digit hex format with # prefix)
- What happens if image upload exceeds size limits? (Error message displayed, upload rejected)
- How does the preview handle missing optional fields? (Graceful fallbacks - no logo shown if none uploaded, solid color background if no image)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow creators to configure logo image via file upload (recommended: 512x512px, PNG with transparency, max 5MB)
- **FR-002**: System MUST allow creators to specify a custom font family as a text string (optional field)
- **FR-003**: System MUST allow creators to set primary color using color picker and hex input (6-digit hex with # prefix, required field)
- **FR-004**: System MUST allow creators to configure text appearance (color and alignment: left/center/right)
- **FR-005**: System MUST allow creators to configure button styling (background color, text color, border radius: none/small/medium/full)
- **FR-006**: System MUST allow creators to configure background (color, optional image upload, overlay opacity 0-100%)
- **FR-007**: System MUST display a live preview panel showing current theme values in a mobile device frame
- **FR-008**: System MUST update preview instantly when any theme property changes (before save)
- **FR-009**: System MUST persist theme changes only when creator explicitly saves (no auto-save)
- **FR-010**: System MUST support keyboard shortcut for save (Cmd+S on Mac, Ctrl+S on Windows)
- **FR-011**: System MUST display success notification after successful save
- **FR-012**: System MUST display error notification with message if save fails
- **FR-013**: System MUST disable save button while save operation is in progress
- **FR-014**: Button background color MUST inherit from primary color when not explicitly set

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Theme editor MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Color pickers and form controls MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography in forms MUST be readable on mobile (≥14px for body text)
- **MFR-004**: Preview panel MUST be viewable on mobile (may require scroll or toggle between editor/preview)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All theme form inputs MUST be validated (color format, file types, file sizes)
- **TSR-002**: Color values MUST validate as 6-digit hex with # prefix (e.g., #3B82F6)
- **TSR-003**: Image uploads MUST validate file type (PNG, JPG, WebP) and size limits (logo: 5MB, background: 10MB)

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Theme updates MUST use Server Actions for write operations
- **FAR-002**: Uploaded images MUST be stored as full public URLs for instant rendering
- **FAR-003**: Logo images MUST be stored in the logos storage bucket
- **FAR-004**: Background images MUST be stored in the backgrounds storage bucket

### Key Entities

- **EventTheme**: Represents the complete visual configuration for an event, including identity (logo, font), colors (primary), text (color, alignment), button (background, text color, radius), and background (color, image, overlay opacity)
- **Event**: The parent container that owns the theme configuration; theme is stored as a nested object within the event document

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can configure all theme properties and save changes in under 2 minutes
- **SC-002**: Preview updates are visible within 100ms of any property change (instant feedback)
- **SC-003**: 95% of save operations complete successfully within 3 seconds
- **SC-004**: Image uploads complete within 10 seconds for files under the size limit
- **SC-005**: Theme changes are correctly reflected in guest-facing experiences after save

## Assumptions

- The navigation route will be Event → Design → Theme (renamed from existing "Branding" path)
- No unsaved changes confirmation dialog is required for MVP (browser default behavior acceptable)
- The existing PreviewPanel component provides the mobile device frame wrapper
- Font loading from external sources (e.g., Google Fonts) is out of scope - creators provide font family strings that reference fonts already available on guest devices
- Real-time collaboration (multiple editors) is out of scope
- Theme presets/templates are out of scope
- Undo/redo functionality is out of scope
- Auto-save/draft functionality is out of scope
