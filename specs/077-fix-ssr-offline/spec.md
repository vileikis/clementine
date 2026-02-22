# Feature Specification: Fix SSR Firestore Offline Crash

**Feature Branch**: `077-fix-ssr-offline`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "SSR Firestore offline bug — page refresh on project routes causes 500 error because the route loader calls the Firebase client SDK on the server"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Page Refresh on Project Routes Works (Priority: P1)

A user is on any project route (e.g., designer, distribute, connect, analytics) and refreshes the browser page. Instead of seeing a "Something went wrong! Failed to get document because the client is offline" error with a 500 status, the page loads successfully — showing a brief loading state while client-side data fetching completes, then rendering the full project view.

**Why this priority**: This is the core bug. Every page refresh and direct URL navigation to project routes is currently broken in production, making the app unreliable for all users.

**Independent Test**: Can be tested by navigating directly to any project URL (e.g., `/workspace/my-workspace/projects/abc123/designer/welcome`) in a new browser tab and verifying the page loads without error.

**Acceptance Scenarios**:

1. **Given** a user is on a project designer page, **When** they refresh the browser, **Then** the page loads successfully showing a loading state followed by the full project view.
2. **Given** a user has a direct link to a project route, **When** they paste the link into a new browser tab, **Then** the page loads successfully without a 500 error.
3. **Given** a user shares a project link with a colleague, **When** the colleague opens the link for the first time, **Then** the page loads successfully.

---

### User Story 2 - Loading Feedback During Data Fetch (Priority: P2)

When a user lands on a project route via full page load (refresh or direct navigation), they see a meaningful loading indicator while the client-side data fetching completes. This replaces the previous instant-but-broken server-side data approach with a brief but user-friendly loading experience.

**Why this priority**: With the server-side loader removed, there will be a brief moment where project data is not yet available on the client. Users need visual feedback that the page is loading rather than seeing a blank screen.

**Independent Test**: Can be tested by refreshing any project page and observing that a loading skeleton or spinner appears before the project content renders.

**Acceptance Scenarios**:

1. **Given** a user refreshes a project page, **When** client-side data is still loading, **Then** a loading skeleton or spinner is displayed.
2. **Given** a user navigates directly to a project URL, **When** the page renders before data is available, **Then** the loading indicator is visible until project data loads.

---

### User Story 3 - Not-Found and Deleted Project Handling (Priority: P2)

When a user navigates to a project that does not exist or has been deleted, they see a clear "not found" message instead of a crash or blank screen. This check happens on the client side after data fetching completes.

**Why this priority**: The removed server-side loader previously handled not-found and deleted project checks. These checks must be preserved in the client-side flow to maintain the same user experience for invalid project URLs.

**Independent Test**: Can be tested by navigating to a URL with a non-existent project ID and verifying the not-found view is displayed.

**Acceptance Scenarios**:

1. **Given** a user navigates to a project URL with a non-existent project ID, **When** the client-side data fetch completes with no result, **Then** a not-found view is displayed.
2. **Given** a user navigates to a project URL for a project with status "deleted", **When** the client-side data fetch completes, **Then** a not-found view is displayed.
3. **Given** a user is viewing a project that gets deleted by another user, **When** the real-time data update reflects the deletion, **Then** the not-found view is displayed.

---

### User Story 4 - Client-Side Navigation Continues Working (Priority: P1)

When a user navigates between project routes using in-app links (without a full page load), the navigation continues to work exactly as it does today. Removing the server-side loader must not break or degrade the existing client-side navigation experience.

**Why this priority**: The fix must not introduce regressions. Client-side navigation currently works correctly, and this must be preserved.

**Independent Test**: Can be tested by clicking through project navigation links (designer, distribute, connect, analytics) and verifying all transitions work smoothly.

**Acceptance Scenarios**:

1. **Given** a user is on the project designer page, **When** they click a navigation link to the distribute page, **Then** the page transitions smoothly without any loading interruption.
2. **Given** a user navigates between multiple project sub-routes, **When** they use in-app navigation, **Then** all transitions work without errors.

---

### Edge Cases

- What happens when the network connection is lost while the client-side hook is fetching project data? The loading state should persist until the connection is restored, consistent with the app's existing offline behavior.
- What happens if authentication expires during page load? The existing parent route auth guard (beforeLoad) handles this before the project component renders.
- What happens when a project URL contains a valid format ID but the user lacks access? The existing security rules handle access control, and the client-side hook respects these rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST NOT execute database queries on the server during route loading for project pages.
- **FR-002**: The system MUST load project data exclusively through the existing client-side real-time data hook when rendering project routes.
- **FR-003**: The system MUST display a loading indicator when project data is not yet available during initial page render.
- **FR-004**: The system MUST display a not-found view when the requested project does not exist.
- **FR-005**: The system MUST display a not-found view when the requested project has a "deleted" status.
- **FR-006**: The system MUST return a successful server response (not 500) when a user navigates directly to any project route.
- **FR-007**: The system MUST preserve existing client-side navigation behavior between project sub-routes without degradation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All project routes load successfully on page refresh — 100% success rate for direct navigation with zero 500 errors.
- **SC-002**: Users see meaningful loading feedback within 1 second of page load when project data is not yet available.
- **SC-003**: Not-found and deleted projects display a clear not-found view within the same timeframe as the existing data fetch completes.
- **SC-004**: Client-side navigation between project sub-routes continues to work with zero new errors or regressions introduced.
- **SC-005**: All affected routes (designer, distribute, connect, analytics, and their sub-routes) function correctly under both full page load and client-side navigation.

## Assumptions

- The existing `useProject` client-side hook provides the same project data that the removed loader was fetching, including real-time updates.
- The existing parent route `beforeLoad` auth guard is sufficient for access control and does not depend on the project loader.
- The existing not-found component can be reused or adapted for client-side not-found rendering.
- The brief loading state on first render is an acceptable trade-off for eliminating the 500 error on page refresh, consistent with how other routes in the app (e.g., workspace routes) already behave.
