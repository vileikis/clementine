# Feature Specification: Welcome Screen Customization

**Feature Branch**: `025-welcome-screen`
**Created**: 2024-12-11
**Status**: Draft
**Input**: User description: "Enable event creators to customize the guest welcome/landing screen with personalized content and flexible experience display layouts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customize Welcome Content (Priority: P1)

As an event creator, I want to customize the title, description, and hero media shown on the welcome screen so that guests see branded, event-specific content when they arrive at my event link.

**Why this priority**: The welcome content is the first impression guests have of the event. Custom title and description are the most fundamental customization options and deliver immediate branding value.

**Independent Test**: Can be fully tested by editing welcome title/description fields and verifying they persist and appear in preview. Delivers personalized first impression value.

**Acceptance Scenarios**:

1. **Given** an event with default welcome settings, **When** the creator enters a custom welcome title, **Then** the title is saved automatically and the preview updates to show the custom title.
2. **Given** an event with a custom welcome title, **When** the creator clears the title field, **Then** the preview falls back to displaying the event name as the title.
3. **Given** an event welcome screen, **When** the creator enters a custom description, **Then** the description appears below the title in the preview.
4. **Given** an event with a custom description, **When** the creator clears the description field, **Then** the description area is hidden in the preview.

---

### User Story 2 - Upload Welcome Hero Media (Priority: P1)

As an event creator, I want to upload hero media (image or video) for the welcome screen so that I can create a visually engaging first impression.

**Why this priority**: Visual media significantly enhances the guest experience and is a core differentiator for branded events. Combined with welcome content, this completes the essential customization options.

**Independent Test**: Can be fully tested by uploading an image or video and verifying it displays as the hero element in the preview. Delivers visual branding value.

**Acceptance Scenarios**:

1. **Given** the welcome content section, **When** the creator uploads an image file, **Then** the image displays as the hero element in the preview and the media type is detected as "image".
2. **Given** the welcome content section, **When** the creator uploads a video file, **Then** the video displays as the hero element in the preview and the media type is detected as "video".
3. **Given** an event with hero media uploaded, **When** the creator removes the media, **Then** the preview shows only the themed background without hero media.
4. **Given** no hero media is set, **When** viewing the preview, **Then** the themed background from the event theme is displayed.

---

### User Story 3 - Choose Experience Layout (Priority: P2)

As an event creator, I want to choose how linked experiences are displayed on the welcome screen (list or grid) so that the layout matches my event's visual style and number of experiences.

**Why this priority**: Layout customization is valuable but secondary to content. It enhances visual presentation but the default list layout works well for most events.

**Independent Test**: Can be fully tested by toggling between list and grid layouts and verifying the preview updates. Delivers layout flexibility value.

**Acceptance Scenarios**:

1. **Given** an event with linked experiences, **When** the creator selects "List" layout, **Then** experiences display as full-width cards stacked vertically in the preview.
2. **Given** an event with linked experiences, **When** the creator selects "Grid" layout, **Then** experiences display as a two-column grid in the preview.
3. **Given** an event with only one linked experience, **When** any layout is selected, **Then** the single experience displays as a full-width card regardless of layout setting.
4. **Given** a new event, **When** the welcome section loads, **Then** the default layout is "List".

---

### User Story 4 - Preview Welcome Screen with Theme (Priority: P2)

As an event creator, I want to see a live preview of the welcome screen with my event's theme applied so that I can verify the appearance before guests see it.

**Why this priority**: Real-time preview reduces iteration time and prevents mismatches between creator expectations and guest experience. It builds confidence in the configuration.

**Independent Test**: Can be fully tested by making changes to welcome settings and verifying the preview updates immediately with correct theme styling. Delivers WYSIWYG confidence.

**Acceptance Scenarios**:

1. **Given** the General tab with welcome settings, **When** the tab loads, **Then** the preview panel displays showing the current welcome screen configuration.
2. **Given** a configured welcome screen, **When** any welcome setting changes, **Then** the preview updates in real-time to reflect the change.
3. **Given** an event with custom theme colors, **When** viewing the preview, **Then** the preview applies the event's theme (background, text colors, button styles).
4. **Given** the preview panel, **When** the creator switches viewport modes, **Then** the preview displays in the selected device frame (mobile/tablet).

---

### User Story 5 - Autosave Changes (Priority: P2)

As an event creator, I want my welcome screen changes to save automatically so that I don't lose work and don't need to remember to click save.

**Why this priority**: Autosave is a quality-of-life improvement that prevents data loss. It's important but not as critical as the core customization features.

**Independent Test**: Can be fully tested by editing a field, waiting for the save indicator, and refreshing the page to verify persistence. Delivers data safety and convenience.

**Acceptance Scenarios**:

1. **Given** the welcome content form, **When** the creator stops typing for 500ms, **Then** a saving indicator appears and changes are persisted.
2. **Given** changes being saved, **When** the save completes successfully, **Then** a success confirmation appears briefly.
3. **Given** changes being saved, **When** the save fails, **Then** an error notification appears with an option to retry.
4. **Given** the creator is actively typing, **When** more keystrokes occur within the debounce period, **Then** the save is delayed until typing stops.

---

### Edge Cases

- What happens when no experiences are linked to the event? Show empty state message in preview indicating no experiences available.
- What happens when all linked experiences are disabled? Show empty state message identical to no experiences linked.
- What happens when welcome title exceeds 100 characters? Prevent additional input and show character count indicator.
- What happens when welcome description exceeds 500 characters? Prevent additional input and show character count indicator.
- What happens when media upload fails? Show error notification with option to retry.
- What happens when autosave fails repeatedly? Show persistent error indicator and option to manually retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display welcome content configuration fields (title, description, media upload) in the Event General tab.
- **FR-002**: System MUST support optional welcome title with maximum 100 characters, falling back to event name when empty.
- **FR-003**: System MUST support optional welcome description with maximum 500 characters.
- **FR-004**: System MUST support uploading hero media (image or video) for the welcome screen.
- **FR-005**: System MUST auto-detect media type (image or video) based on uploaded file.
- **FR-006**: System MUST provide layout selection toggle between "List" and "Grid" options for experience display.
- **FR-007**: System MUST default to "List" layout for new events.
- **FR-008**: System MUST persist layout selection per event.
- **FR-009**: System MUST display a live preview panel in the General tab showing the configured welcome screen.
- **FR-010**: System MUST update preview in real-time when any welcome setting changes.
- **FR-011**: System MUST apply event theme to the preview via the theming module.
- **FR-012**: System MUST use the preview-shell module for device frame and viewport switching.
- **FR-013**: System MUST show only enabled experiences from the experiences array in preview.
- **FR-014**: System MUST autosave changes with 500ms debounce after user stops editing.
- **FR-015**: System MUST display saving indicator during persistence.
- **FR-016**: System MUST display success confirmation after successful save.
- **FR-017**: System MUST display error notification with retry option on save failure.
- **FR-018**: System MUST show character count indicators for title (100 max) and description (500 max) fields.

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Feature MUST work on mobile viewport (320px-768px) as primary experience.
- **MFR-002**: Interactive elements (buttons, toggles, upload areas) MUST meet minimum touch target size (44x44px).
- **MFR-003**: Typography MUST be readable on mobile (14px minimum for body text).
- **MFR-004**: Preview panel MUST be accessible and usable on mobile admin viewports.
- **MFR-005**: Form fields MUST have adequate spacing for touch interaction.

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Welcome title input MUST be validated with maximum 100 character constraint.
- **TSR-002**: Welcome description input MUST be validated with maximum 500 character constraint.
- **TSR-003**: Media upload MUST validate file type (image or video formats only).
- **TSR-004**: Layout selection MUST be validated against allowed values ("list" | "grid").
- **TSR-005**: EventWelcome schema MUST be defined with Zod for all welcome screen fields.
- **TSR-006**: TypeScript strict mode MUST be maintained (no `any` escapes).

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Welcome content updates MUST use Admin SDK via Server Actions.
- **FAR-002**: Preview rendering MUST use Client SDK for real-time theme data access.
- **FAR-003**: EventWelcome Zod schema MUST be defined in `features/events/schemas/`.
- **FAR-004**: Uploaded welcome media MUST be stored as full public URLs in Firebase Storage.
- **FAR-005**: Media uploads MUST follow existing storage path convention: `media/{companyId}/welcome/{timestamp}-{filename}`.

### Key Entities

- **EventWelcome**: Welcome screen configuration including title, description, mediaUrl, mediaType, and layout. Nested within Event document.
- **ExperienceLayout**: Enum type defining layout options ("list" | "grid") for experience card display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event creators can configure all welcome screen fields (title, description, media, layout) in under 3 minutes.
- **SC-002**: Preview updates reflect changes within 200ms of user input stopping.
- **SC-003**: Autosave completes within 2 seconds of debounce trigger.
- **SC-004**: 100% of welcome content changes persist correctly across page refreshes.
- **SC-005**: Media uploads complete successfully for files up to 50MB (images) and 200MB (videos).
- **SC-006**: Preview accurately renders welcome screen with event theme applied.

## Scope Boundaries

### In Scope

- Welcome content configuration (title, description, hero media)
- Experience layout selection (list/grid)
- Live preview with theme integration
- Autosave functionality
- General tab layout reorganization

### Out of Scope

- Guest-facing welcome screen implementation (separate feature)
- Custom CSS or advanced styling beyond theme settings
- Animation or transition customization
- Multiple welcome screen variants (A/B testing)
- Conditional content based on guest attributes
- Rich text formatting in description
- Media gallery (multiple hero images/videos)
- Scheduling different welcome content for different times
- Experience card customization (thumbnail, description) beyond label

## Assumptions

- The preview-shell and theming modules are fully implemented and stable.
- The Event General tab exists and can be extended with new sections.
- Media upload infrastructure exists and supports image/video uploads.
- The experiences array and EventExperienceLink structure are already implemented.
- Debounce timing (500ms) is appropriate for typical user editing behavior.
- Character limits (100 for title, 500 for description) are sufficient for typical welcome content.
