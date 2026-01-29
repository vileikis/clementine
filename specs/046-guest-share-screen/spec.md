# Feature Specification: Guest Share Screen with Renderer Integration

**Feature Branch**: `046-guest-share-screen`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "implement @apps/clementine-app/src/domains/guest/containers/SharePage.tsx to display share screen renderers from @apps/clementine-app/src/domains/project-config/share/containers/ShareEditorPage.tsx . For this implementation we just handle renderers integration. While share data (jobStatus and resultMedia should be mocked for now).  Make fake local 3 sec transition from loading to ready renderer. And use mock resultMedia with some public image. Do not implement logic for share buttons yet, just display them. Start over and Cta buttons should work."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Loading State Display (Priority: P1)

A guest who has just completed a photo experience sees a loading screen while waiting for their AI-generated result, providing feedback that processing is in progress.

**Why this priority**: This is the first touchpoint in the share experience flow. Without this, guests see nothing or an error while their content is being processed, creating confusion and potential abandonment.

**Independent Test**: Can be fully tested by navigating to the share page with a mainSessionId parameter and observing the loading state for 3 seconds, delivering visual confirmation that processing is happening.

**Acceptance Scenarios**:

1. **Given** a guest has completed an experience, **When** they land on the share page, **Then** they see the ShareLoadingRenderer displaying a skeleton placeholder image, loading title, and loading description
2. **Given** the guest is viewing the loading state, **When** 3 seconds elapse, **Then** the display automatically transitions to the ready state without page reload
3. **Given** the loading state is displayed, **When** the guest refreshes the page, **Then** the 3-second loading cycle restarts from the beginning

---

### User Story 2 - Ready State with Result Display (Priority: P2)

After the 3-second processing simulation, the guest sees their generated result image along with share options and action buttons.

**Why this priority**: This delivers the core value of seeing the result. Without this, the loading state has no payoff. This is the second critical step in the share experience journey.

**Independent Test**: Can be tested by waiting through the 3-second loading transition, then verifying the ShareReadyRenderer displays with mock image, text content, share icons, and action buttons.

**Acceptance Scenarios**:

1. **Given** the loading state has completed, **When** the ready state displays, **Then** the guest sees a mock result image (a public placeholder image)
2. **Given** the ready state is displayed, **When** viewing the content, **Then** the guest sees the configured title and description text
3. **Given** the ready state is displayed, **When** viewing the share options, **Then** enabled share platform icons appear (Instagram, Facebook, Twitter, etc.) but are not yet interactive
4. **Given** the ready state is displayed, **When** viewing action buttons, **Then** both "Start Over" and CTA buttons are visible at the bottom

---

### User Story 3 - Interactive Buttons (Priority: P3)

The guest can interact with "Start Over" and CTA buttons to navigate away from the share screen to begin a new experience or visit an external link.

**Why this priority**: These navigation options allow guests to take the next action after viewing their result. While important for flow completion, the core value (seeing the result) is already delivered in P2.

**Independent Test**: Can be tested independently by clicking each button and verifying the correct navigation occurs - "Start Over" returns to the welcome screen, CTA opens the configured URL.

**Acceptance Scenarios**:

1. **Given** the ready state is displayed with a configured CTA, **When** the guest clicks the CTA button, **Then** they are navigated to the configured URL
2. **Given** the ready state is displayed, **When** the guest clicks "Start Over", **Then** they are navigated back to the project's welcome screen
3. **Given** no CTA is configured (label or URL is null), **When** the ready state displays, **Then** only the "Start Over" button is shown

---

### Edge Cases

- What happens when the mainSessionId parameter is missing or invalid from the URL?
- How does the system handle extremely long title or description text that might overflow the layout?
- What happens if the mock image URL fails to load?
- How does the component behave when all share options are disabled (empty share icons array)?
- What happens if both the CTA label and URL are null/empty?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: SharePage MUST display the ShareLoadingRenderer component on initial load
- **FR-002**: SharePage MUST use mock data for ShareLoadingConfig (title and description)
- **FR-003**: SharePage MUST automatically transition from loading to ready state after exactly 3 seconds
- **FR-004**: SharePage MUST display the ShareReadyRenderer component after the transition
- **FR-005**: SharePage MUST use mock data for ShareReadyConfig (title, description, CTA)
- **FR-006**: SharePage MUST display a mock result image using a public placeholder URL
- **FR-007**: SharePage MUST display share platform icons based on mock ShareOptionsConfig
- **FR-008**: Share platform icons MUST be visible but non-interactive (no click handlers implemented yet)
- **FR-009**: "Start Over" button MUST navigate back to the project welcome screen when clicked
- **FR-010**: CTA button MUST navigate to the configured URL when clicked
- **FR-011**: CTA button MUST only be displayed when CTA label is not null/empty
- **FR-012**: SharePage MUST apply the project theme using ThemeProvider
- **FR-013**: SharePage MUST receive mainSessionId as a prop from the route
- **FR-014**: The loading-to-ready transition MUST use client-side state (useState/useEffect), not route navigation
- **FR-015**: The component MUST preserve the mainSessionId throughout the loading-to-ready transition

### Key Entities *(include if feature involves data)*

- **Main Session**: Represents a guest's completed experience session, identified by mainSessionId passed from the route
- **Share Config**: Contains display settings for both loading and ready states (titles, descriptions, CTA configuration)
- **Share Options**: Boolean flags determining which share platform icons appear
- **Result Media**: The AI-generated image URL that guests receive after completing an experience (mocked as a public placeholder)
- **Project Theme**: Visual styling configuration (colors, fonts) applied to the share screen

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests see visual feedback within 100ms of landing on the share page (loading state appears immediately)
- **SC-002**: The transition from loading to ready state occurs within 3 seconds ± 50ms
- **SC-003**: 100% of functional requirements are met and independently testable
- **SC-004**: "Start Over" and CTA buttons execute navigation actions within 200ms of click

## Assumptions

- The project theme configuration exists and can be accessed via useGuestContext or similar hook
- A suitable public placeholder image URL exists (e.g., via Unsplash or similar service)
- The welcome screen route pattern is `/join/$projectId` as shown in the existing SharePage code
- Share platform icons are already available via lucide-react and react-icons packages
- ThemedBackground, ThemedText, ThemedButton components handle theme application automatically
- The mainSessionId parameter is always present in the route (edge case handling can be added later)

## Out of Scope

- Real job status tracking via Firebase/Firestore
- Actual share button functionality (download, copy link, social media sharing)
- Real result media fetching from storage
- Error handling for failed media loads
- Analytics/tracking of share interactions
- Responsive design optimizations beyond what the renderers already provide
- Server-side data fetching or caching

## Dependencies

- Existing ShareLoadingRenderer component (`@/domains/project-config/share/components/ShareLoadingRenderer`)
- Existing ShareReadyRenderer component (`@/domains/project-config/share/components/ShareReadyRenderer`)
- Existing ThemeProvider component (`@/shared/theming`)
- Existing useGuestContext hook (`@/domains/guest/contexts`)
- React hooks: useState, useEffect
- TanStack Router for navigation
