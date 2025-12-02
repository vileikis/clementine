# Feature Specification: Router Simplification

**Feature Branch**: `014-router-simplify`
**Created**: 2024-12-02
**Status**: Draft
**Input**: User description: "Simplify workspace router by flattening 4 route groups with identical layouts into a single layout with page-based breadcrumbs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Navigates Simplified Codebase (Priority: P1)

As a developer working on the Clementine platform, I need to understand and maintain the routing structure. Currently, I must navigate through 4 nearly-identical route group layouts. After simplification, I will work with a single layout file, making code changes faster and reducing cognitive overhead.

**Why this priority**: This is the core value proposition—reducing code duplication and maintenance burden. All other benefits flow from this structural simplification.

**Independent Test**: Can be fully tested by verifying that a single layout file renders the sidebar correctly for all workspace routes (company, project, event, experience pages) and that the old route group layouts have been removed.

**Acceptance Scenarios**:

1. **Given** the workspace route structure exists, **When** a developer navigates to `/[companySlug]`, **Then** the single layout at `(workspace)/[companySlug]/layout.tsx` handles the request
2. **Given** the layout fetches company data, **When** navigating to any nested route (project, event, experience), **Then** the same layout is reused without duplicate company fetches
3. **Given** the old route group layouts existed, **When** migration is complete, **Then** all 4 old layout files (company, project, event, experience route groups) are removed

---

### User Story 2 - Creator Views Correct Breadcrumbs (Priority: P2)

As an Experience Creator navigating through the dashboard, I need to see accurate breadcrumbs that reflect my current location. When viewing an event theme page, I should see breadcrumbs like "Company > Project > Event > Theme" to understand my context and navigate easily.

**Why this priority**: Breadcrumbs are essential for user orientation. Without correct breadcrumbs, users lose context in nested pages. This directly impacts user experience but depends on the layout consolidation being complete first.

**Independent Test**: Can be fully tested by navigating to deeply nested pages (e.g., event theme) and verifying the breadcrumb trail accurately reflects the path: Company Name → Project Name → Event Name → Current Page.

**Acceptance Scenarios**:

1. **Given** a user is on the company dashboard, **When** the page loads, **Then** breadcrumbs show only the company name
2. **Given** a user navigates to a project page, **When** the page loads, **Then** breadcrumbs show "Company > Project"
3. **Given** a user navigates to the event theme page, **When** the page loads, **Then** breadcrumbs show "Company > Project > Event > Theme"
4. **Given** a user navigates to an experience detail page, **When** the page loads, **Then** breadcrumbs show "Company > Experiences > Experience Name"

---

### User Story 3 - User Experiences Fast Page Navigation (Priority: P3)

As an Experience Creator navigating between workspace pages, I should experience fast page loads because the layout is cached and company data is fetched only once per session/route segment, not redundantly on every nested route.

**Why this priority**: Performance is important but secondary to correctness. Once the structure is simplified and breadcrumbs work, optimizing fetch behavior solidifies the architecture's benefits.

**Independent Test**: Can be tested by navigating from company dashboard to a deeply nested event page and verifying that company data fetching occurs only once in the layout, not repeated in child pages.

**Acceptance Scenarios**:

1. **Given** the single layout fetches company data, **When** navigating from dashboard to project to event, **Then** the company fetch occurs only once in the layout
2. **Given** pages need entity data for breadcrumbs, **When** a nested page loads, **Then** the page fetches only its specific entity data (project, event) using parallel requests
3. **Given** the layout includes the sidebar, **When** any workspace page is viewed, **Then** the sidebar renders immediately without waiting for page-specific data

---

### Edge Cases

- What happens when the company slug is invalid? System should return 404 via `notFound()` from the layout
- What happens when a project/event ID doesn't exist? Individual pages should handle their own 404 responses
- What happens when a user navigates to an old route group URL structure? URLs remain the same; only internal file organization changes
- How does the system handle breadcrumbs when an entity name is very long? Breadcrumb component should truncate with ellipsis
- What happens during migration when some pages use old layout and some use new? Migration must be atomic per route group to avoid inconsistent states

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single layout file at `(workspace)/[companySlug]/layout.tsx` that handles all workspace routes
- **FR-002**: Layout MUST fetch company data by slug once and pass it to the sidebar component
- **FR-003**: Layout MUST render the sidebar component with company context for all child routes
- **FR-004**: Layout MUST return 404 when company slug is invalid or company not found
- **FR-005**: System MUST provide a breadcrumbs helper function that builds breadcrumb arrays from entity data
- **FR-006**: Each page MUST define its own breadcrumbs using the helper function and ContentHeader component
- **FR-007**: Breadcrumbs MUST include clickable links for all ancestor segments and non-clickable text for the current page
- **FR-008**: System MUST remove all duplicate layout files from the old route group structure after migration
- **FR-009**: All existing page URLs MUST remain unchanged after migration (only internal file structure changes)
- **FR-010**: Pages requiring entity data (project, event, experience) MUST fetch their data independently using parallel requests

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Breadcrumbs MUST be visible and usable on mobile viewport (320px-768px)
- **MFR-002**: Breadcrumb overflow on mobile MUST be handled gracefully (horizontal scroll or truncation with ellipsis)
- **MFR-003**: Touch targets for breadcrumb links MUST meet minimum size (44x44px tap area)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Breadcrumbs helper function MUST have strict TypeScript types for all parameters and return values
- **TSR-002**: Company, Project, Event, and Experience entities used in breadcrumbs MUST use their existing typed schemas
- **TSR-003**: Route params MUST be typed according to Next.js 15+ conventions (Promise-based params)

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Company fetch in layout MUST use existing `getCompanyBySlugAction` server action
- **FAR-002**: Entity fetches for breadcrumbs MUST use existing server actions from respective feature modules
- **FAR-003**: No new Firestore collections or schemas are required for this feature

### Key Entities *(include if feature involves data)*

- **Breadcrumb**: Represents a single navigation segment with label (display text) and optional href (navigation link). No persistence required—computed at render time.
- **Company, Project, Event, Experience**: Existing entities used to build breadcrumb paths. No schema changes required.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Route group layouts reduced from 4 to 1 (100% reduction in duplicate layout files)
- **SC-002**: All existing workspace page URLs continue to function without changes
- **SC-003**: Breadcrumbs accurately reflect navigation path on 100% of workspace pages
- **SC-004**: Users can navigate from any breadcrumb segment to that location successfully
- **SC-005**: Time to implement new workspace pages reduced (1 layout to understand vs 4)
- **SC-006**: No increase in page load time compared to current multi-layout structure

## Assumptions

- The current route group structure has 4 layouts with nearly identical code (company, project, event, experience)
- Each existing layout fetches company data and renders the same Sidebar component
- The `getCompanyBySlugAction` server action exists and returns company data by slug
- Projects, events, and experiences each have their own fetch actions that can be called from pages
- The ContentHeader component already accepts breadcrumbs as a prop
- URL structure will remain unchanged; only internal file organization is being modified
- Migration can be done incrementally by route group but each group should be migrated atomically
