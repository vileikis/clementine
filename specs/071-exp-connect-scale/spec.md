# Feature Specification: Experience Loading Refactor — Scalable Connect & Fetch

**Feature Branch**: `071-exp-connect-scale`
**Created**: 2026-02-14
**Status**: Draft
**Input**: Refactor experience loading in WelcomeEditorPage and ConnectExperienceDrawer to separate concerns and support scalability. WelcomeEditorPage should fetch connected experiences by ID. ConnectExperienceDrawer should support paginated loading with a "Load More" button.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Welcome Editor Displays Connected Experiences Efficiently (Priority: P1)

An experience creator opens the Welcome Editor for a project. The editor displays a live preview of the welcome screen, including cards for each connected main experience. Instead of loading all workspace experiences, the editor fetches only the specific experiences that are already connected to the project — by their IDs. This keeps the editor fast even when the workspace contains hundreds of experiences.

**Why this priority**: This is the core concern-separation fix. The Welcome Editor should never load the full experience catalog — it only needs the experiences already assigned to the project. This directly addresses the scalability issue and fixes the mixed-concern architecture.

**Independent Test**: Can be tested by opening the Welcome Editor for a project with 2–3 connected experiences in a workspace that has many more. Verify only the connected experiences appear in the preview, and that the page loads quickly without fetching unrelated experiences.

**Acceptance Scenarios**:

1. **Given** a project has 3 main experiences connected, **When** the creator opens the Welcome Editor, **Then** only those 3 experiences are fetched and displayed in the preview — not all workspace experiences.
2. **Given** a project has no main experiences connected, **When** the creator opens the Welcome Editor, **Then** no experience fetch occurs and the preview shows an empty experience list.
3. **Given** a connected experience is updated (e.g., name or thumbnail changes), **When** the Welcome Editor is open, **Then** the preview reflects the updated experience details.

---

### User Story 2 — Connect Drawer Loads Experiences in Pages (Priority: P1)

An experience creator opens the "Connect Experience" drawer to add a new experience to a slot. The drawer loads an initial batch of compatible experiences (configurable page size). If more experiences exist, a "Load More" button appears at the bottom of the list. Clicking it loads the next batch, appending results to the existing list. Search filtering continues to work across all loaded experiences.

**Why this priority**: Equally critical as US1 — this is the pagination fix that prevents the drawer from loading hundreds of experiences at once. Without this, large workspaces will have poor performance and potentially hit query limits.

**Independent Test**: Can be tested by opening the Connect Experience drawer in a workspace with more experiences than the page size. Verify the initial batch loads, the "Load More" button appears, and clicking it appends the next batch.

**Acceptance Scenarios**:

1. **Given** a workspace has more experiences than the page size, **When** the drawer opens, **Then** only the first page of compatible experiences loads and a "Load More" button is visible.
2. **Given** the first page is displayed and more pages exist, **When** the creator clicks "Load More", **Then** the next page of experiences is appended to the list and the button remains if more pages exist.
3. **Given** all pages have been loaded, **When** the creator views the list, **Then** the "Load More" button is no longer visible.
4. **Given** experiences are loaded across multiple pages, **When** the creator types a search query, **Then** the search filters across all currently loaded experiences.
5. **Given** a loading operation is in progress, **When** the creator views the "Load More" area, **Then** a loading indicator is shown instead of the button.

---

### User Story 3 — Configurable Page Size (Priority: P2)

The system supports a configurable page size for the Connect Experience drawer as a developer experience (DX) concern. The default page size is a reasonable value, but developers can adjust it in code when integrating the drawer into different contexts. This is not exposed in the UI — it is a code-level configuration option (e.g., a parameter or constant).

**Why this priority**: Lower priority since a sensible default covers most cases, but important for DX flexibility as different slots or contexts may benefit from different batch sizes.

**Independent Test**: Can be tested by rendering the paginated experience loading with different page size values in code and verifying the correct number of experiences loads per page.

**Acceptance Scenarios**:

1. **Given** the default page size is configured in code, **When** the drawer opens, **Then** exactly that number of experiences (or fewer if not enough exist) are loaded.
2. **Given** a developer passes a custom page size of N in code, **When** experiences load, **Then** each page contains at most N experiences.

---

### Edge Cases

- What happens when a connected experience ID no longer exists (deleted experience)? The system gracefully handles missing experiences — displays the available ones and silently omits missing ones.
- What happens when more than 30 experiences are connected to a project? Since batch-by-ID queries are limited to 30 values per query, the system should batch the ID queries if needed. (Current project configs are unlikely to exceed 30 main experiences, but the system should not break if they do.)
- What happens when the drawer is opened with zero compatible experiences in the workspace? An empty state message is shown with no "Load More" button.
- What happens when a new experience is created while the drawer is open? The next "Load More" fetch or a drawer re-open should include the new experience.
- What happens when search returns no results across loaded pages? A "No experiences found" empty state is shown. The "Load More" button should still be available (more results may exist in unloaded pages).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Welcome Editor MUST fetch connected experience details by their IDs only — not load all workspace experiences.
- **FR-002**: The Welcome Editor MUST derive experience IDs from the project's draft configuration (main experience references).
- **FR-003**: The Welcome Editor MUST display experience card data (name, thumbnail) in the preview using the fetched experience details.
- **FR-004**: The Connect Experience drawer MUST load experiences in configurable page-sized batches.
- **FR-005**: The Connect Experience drawer MUST display a "Load More" button when additional pages of experiences exist beyond what is currently loaded.
- **FR-006**: The Connect Experience drawer MUST append newly loaded experiences to the existing list (not replace).
- **FR-007**: The Connect Experience drawer MUST hide the "Load More" button when all compatible experiences have been loaded.
- **FR-008**: The Connect Experience drawer MUST show a loading indicator while a page is being fetched.
- **FR-009**: The Connect Experience drawer MUST continue to support client-side search filtering across all loaded experiences.
- **FR-010**: The Connect Experience drawer MUST continue to filter experiences by slot-compatible profiles.
- **FR-011**: The Connect Experience drawer MUST continue to mark already-assigned experiences with an "in use" indicator.
- **FR-012**: The page size MUST be configurable in code (DX concern, not user-facing UI), with a sensible default value.
- **FR-013**: The system MUST gracefully handle cases where a connected experience ID refers to a deleted or missing experience (omit it from results, do not error).

### Key Entities

- **Experience**: A configured AI photo/video experience with name, thumbnail, profile type, and status. Belongs to a workspace.
- **MainExperienceReference**: A reference linking an experience to a project slot, containing experienceId, enabled status, and overlay configuration.
- **ExperienceCardData**: A minimal projection of an Experience containing only id, name, and thumbnailUrl — used for preview display.
- **SlotType**: Determines which experience profiles are compatible (main, pregate, preshare).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Welcome Editor loads only the connected experiences (not the full workspace catalog), reducing unnecessary data transfer proportionally to workspace size.
- **SC-002**: The Connect Experience drawer initially loads no more than one page of experiences, regardless of total workspace experience count.
- **SC-003**: Users can browse all compatible experiences via "Load More" without any single load exceeding the configured page size.
- **SC-004**: Search filtering works correctly across all loaded experience pages with no user-perceived lag.
- **SC-005**: No regressions — all existing experience connection, reordering, and configuration functionality continues to work as before.

## Assumptions

- The number of connected experiences per project is small (typically under 10, maximum under 30), making fetch-by-ID an appropriate strategy for WelcomeEditorPage.
- Cursor-based pagination (ordered results with a page cursor) is the appropriate mechanism for paginating the Connect Experience drawer.
- Client-side search filtering (existing behavior) is acceptable for the loaded pages — server-side search is out of scope.
- Real-time updates for the paginated drawer are not required for this iteration. The existing real-time listener approach will be replaced by the paginated approach.
- The "Create New Experience" button and external link behavior in the drawer remain unchanged.
