# Feature Specification: Loading State Editor for Share Screen

**Feature Branch**: `044-loading-state-editor`
**Created**: 2026-01-28
**Status**: Draft
**Input**: User description: "Add configuration and preview capabilities for the share screen's loading/processing state. Currently, admins can only configure the "ready" state (when results are available). This feature adds a separate configuration for the "loading" state (when AI generation is in progress)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Loading State Content (Priority: P1)

As an admin creating a photo booth experience, I want to customize the loading screen title and description so that guests understand what's happening while they wait for AI generation to complete.

**Why this priority**: This is the core value proposition of the feature. Without the ability to configure loading state content, admins cannot customize the guest waiting experience, which is the primary user need.

**Independent Test**: Can be fully tested by navigating to the share screen editor, entering custom loading title and description, saving the configuration, and verifying the values persist on page reload. Delivers immediate value by allowing admins to set custom waiting messages.

**Acceptance Scenarios**:

1. **Given** I am on the share screen editor, **When** I enter a custom loading title "Hang tight!", **Then** the title saves automatically after 2 seconds of inactivity
2. **Given** I am on the share screen editor, **When** I enter a custom loading description, **Then** the description saves automatically after 2 seconds of inactivity
3. **Given** I have configured loading state content, **When** I reload the page, **Then** my custom title and description are preserved
4. **Given** I clear the loading title field, **When** the auto-save triggers, **Then** the system stores null and displays the default loading title in preview

---

### User Story 2 - Preview Loading State Appearance (Priority: P1)

As an admin, I want to preview how the loading screen will look to guests so that I can ensure the content is appropriate and displays correctly before going live.

**Why this priority**: Previewing is essential for quality assurance. Without preview capability, admins would need to test in production by actually submitting photos, which is inefficient and error-prone.

**Independent Test**: Can be fully tested by switching to the "Loading" preview tab, verifying that a skeleton loader appears with custom title/description, and confirming that no CTA or share buttons are shown. Delivers value by allowing admins to validate their configuration without submitting test photos.

**Acceptance Scenarios**:

1. **Given** I am on the share screen editor, **When** I click the "Loading" tab in the preview panel, **Then** I see a skeleton loader with my configured loading title and description
2. **Given** I am viewing the loading state preview, **When** I type in the loading title field, **Then** the preview updates in real-time to reflect my changes
3. **Given** I am viewing the loading state preview, **When** I look for share buttons or CTA buttons, **Then** they are not displayed (since these only appear in ready state)
4. **Given** I switch between "Ready" and "Loading" tabs, **When** I observe the preview, **Then** the preview accurately reflects each state's configuration

---

### User Story 3 - Switch Between Ready and Loading Configuration (Priority: P2)

As an admin, I want to easily switch between configuring the ready state and loading state so that I can manage both experiences efficiently within a single interface.

**Why this priority**: This is important for workflow efficiency but is secondary to the core functionality of configuring and previewing. Users can still accomplish their goals even if the switching mechanism is basic.

**Independent Test**: Can be fully tested by clicking state tabs and verifying that both the preview and configuration panel update to show the selected state. Delivers value by providing a smooth editing experience across both states.

**Acceptance Scenarios**:

1. **Given** I am editing the ready state configuration, **When** I click the "Loading" tab, **Then** both the preview and config panel switch to show loading state
2. **Given** I am editing the loading state configuration, **When** I click the "Ready" tab, **Then** both the preview and config panel switch to show ready state
3. **Given** I switch between states rapidly, **When** I observe the interface, **Then** the preview and config panel remain synchronized without lag or errors
4. **Given** I have unsaved changes in one state, **When** I switch to another state, **Then** the auto-save triggers for my previous state before switching

---

### Edge Cases

- What happens when loading title or description fields are left empty? System should store null and display default fallback text in preview.
- How does system handle very long loading titles or descriptions? Text should wrap appropriately in the preview without breaking layout.
- What happens when admin switches between states while auto-save is pending? Auto-save should complete for the previous state before switching.
- How does the preview handle null/undefined values in configuration? Preview should display default text ("Creating your experience...") when no custom content is configured.
- What happens when viewport is switched while viewing loading state? Preview should maintain loading state and apply viewport sizing correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store separate configurations for loading state and ready state under distinct schema fields (shareLoading and shareReady)
- **FR-002**: System MUST provide editable fields for loading state title and description
- **FR-003**: System MUST auto-save loading state configuration changes after 2 seconds of user inactivity
- **FR-004**: System MUST display state switcher tabs in the preview panel header to toggle between "Ready" and "Loading" views
- **FR-005**: System MUST synchronize preview and configuration panel when state tabs are clicked
- **FR-006**: System MUST render loading state preview with skeleton loader, configured title, configured description, and no CTA or share buttons
- **FR-007**: System MUST render ready state preview with media, configured title, configured description, CTA button (if configured), and share buttons
- **FR-008**: System MUST update preview in real-time as user types in configuration fields
- **FR-009**: System MUST persist both loading and ready state configurations independently
- **FR-010**: System MUST validate loading state configuration using schema validation before saving
- **FR-011**: System MUST support null values for title and description fields (indicating no custom content)
- **FR-012**: System MUST display default loading text when custom content is not configured

### Key Entities *(include if feature involves data)*

- **ShareLoadingConfig**: Represents the loading state configuration with attributes for title (string or null) and description (string or null). Related to ProjectConfig as a top-level field.
- **ShareReadyConfig**: Represents the ready state configuration (renamed from existing ShareConfig) with attributes for title, description, and CTA configuration. Related to ProjectConfig as a top-level field.
- **ProjectConfig**: Top-level configuration object containing both shareLoading and shareReady as separate properties.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can configure loading state title and description and see changes reflected in preview within 200 milliseconds
- **SC-002**: Loading state configuration persists across browser sessions without data loss
- **SC-003**: Admins can switch between ready and loading state preview and configuration within 1 click
- **SC-004**: Preview accurately represents the actual guest experience for both loading and ready states
- **SC-005**: Auto-save successfully completes within 3 seconds of user stopping typing
- **SC-006**: 100% of admins using the share screen editor have access to loading state configuration without additional setup
- **SC-007**: Loading state preview displays skeleton loader and custom content without layout issues across mobile and desktop viewports

## Assumptions *(mandatory)*

- Admins are already familiar with the existing share screen editor for ready state configuration
- The existing PreviewShell component supports custom header content via props
- The existing auto-save mechanism can be reused for loading state with the same debounce settings (2 seconds)
- Default loading text will be provided by the system when no custom content is configured
- Future email capture functionality for loading state is not included in this feature scope
- The same theme styling applies to both loading and ready states
- Viewport switcher and fullscreen functionality remain independent of state switching

## Dependencies *(include if there are external dependencies)*

- Requires Zod schema validation library for ShareLoadingConfig validation
- Depends on existing useAutoSave hook for auto-save functionality
- Depends on existing PreviewShell component accepting headerSlot prop (may require minor update)
- Depends on existing form management patterns (React Hook Form) used in share screen editor
- Depends on existing Firestore persistence layer for project configuration updates

## Security & Privacy Considerations *(include if relevant)*

- Loading state content is not user-generated (admin-created only), reducing XSS risk
- Configuration data follows existing ProjectConfig security rules in Firestore
- No new authentication or authorization requirements beyond existing admin access
- Loading state content should follow existing content validation patterns to prevent script injection

## Out of Scope *(include if there are explicit exclusions)*

- Email capture form configuration for loading state (future enhancement)
- Custom loading animations or spinner configuration
- Progress indicators showing percentage completion (0%, 25%, 50%, etc.)
- Split-view comparison mode showing both states side-by-side
- Error state configuration (when AI generation fails)
- Timeout state configuration (when AI takes longer than expected)
- A/B testing between different loading messages
- Analytics tracking of which loading messages perform better
