# Feature Specification: Company Context Architecture

**Feature Branch**: `001-company-context`
**Created**: 2025-12-01
**Status**: Draft
**Input**: Phase 0 PRD - Transform Clementine from flat admin structure into company-centric multi-tenant architecture

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate to Company Workspace via URL Slug (Priority: P1)

As an admin user, I want to access a company's workspace using a human-readable URL slug (e.g., `/acme-corp`) instead of cryptic IDs, so that I can easily share links and navigate between companies.

**Why this priority**: URL slugs are the foundation of the new routing architecture. Without slug-based routing, none of the other navigation features can work. This is the entry point for all company-scoped work.

**Independent Test**: Can be fully tested by creating a company with a name, verifying a slug is generated, and navigating to `/{slug}` to access the company workspace.

**Acceptance Scenarios**:

1. **Given** a company named "Acme Corporation" exists, **When** I navigate to `/acme-corporation`, **Then** I see the company workspace with the company's context loaded
2. **Given** I am creating a new company with name "Brand X", **When** I submit the form without manually entering a slug, **Then** the system auto-generates a valid slug (e.g., `brand-x`) from the name
3. **Given** a company with slug "test-co" exists, **When** another user tries to create a company with the same slug, **Then** they receive a validation error indicating the slug is already taken
4. **Given** I navigate to `/non-existent-slug`, **When** no company with that slug exists, **Then** I see an appropriate error page (404)

---

### User Story 2 - Company Workspace with Contextual Navigation (Priority: P2)

As an admin user, I want a consistent navigation bar within each company workspace that shows breadcrumbs and context-specific tabs, so I can easily move between sections (Projects, Experiences, Settings) without losing my place.

**Why this priority**: Once users can access a company via slug, they need navigation to move within that context. This provides the UX framework for all company-scoped activities.

**Independent Test**: Can be fully tested by navigating to a company workspace and verifying the navigation bar displays breadcrumbs showing the current location and tabs for Projects/Experiences/Settings.

**Acceptance Scenarios**:

1. **Given** I am at `/acme-corp/projects`, **When** I view the page, **Then** I see breadcrumbs showing "🍊 / Acme Corp" and tabs for "Projects" (active), "Experiences", and "Settings"
2. **Given** I am at `/acme-corp/projects`, **When** I click the "Settings" tab, **Then** I navigate to `/acme-corp/settings` and the Settings tab becomes active
3. **Given** I am at `/acme-corp/settings`, **When** I view the breadcrumbs, **Then** clicking "Acme Corp" in the breadcrumbs navigates me back to `/acme-corp`
4. **Given** I am at the company root `/acme-corp`, **When** the page loads, **Then** I am redirected to `/acme-corp/projects` (default landing page)

---

### User Story 3 - Company Settings with Slug Management (Priority: P3)

As an admin user, I want to view and edit company settings including the company name and slug, so I can manage the company's identity and update the URL path if needed.

**Why this priority**: Settings management allows users to maintain company information. While less frequently used than navigation, it's essential for company administration.

**Independent Test**: Can be fully tested by navigating to company settings, editing the company name, and verifying the slug can be customized.

**Acceptance Scenarios**:

1. **Given** I am at `/acme-corp/settings`, **When** the page loads, **Then** I see a form pre-populated with the company's current name and slug
2. **Given** I am editing company settings, **When** I change the name but not the slug, **Then** the slug remains unchanged after save
3. **Given** I am editing company settings, **When** I change the slug to a valid unique value, **Then** the company is accessible at the new slug URL after save
4. **Given** I am editing company settings, **When** I enter an invalid slug (e.g., with uppercase letters or special characters), **Then** I see validation feedback indicating the allowed format (lowercase letters, numbers, hyphens)

---

### User Story 4 - Project Context Navigation (Priority: P4)

As an admin user, I want to navigate into a project's workspace from the company level and see project-specific navigation (Events, Distribute, Results), so I can manage project-level resources with appropriate context.

**Why this priority**: Project navigation extends the company context pattern. It demonstrates the scalable architecture for nested contexts without layout stacking.

**Independent Test**: Can be fully tested by navigating from company to a project and verifying isolated project navigation appears (no company navbar stacking).

**Acceptance Scenarios**:

1. **Given** I am at `/acme-corp/proj123`, **When** the page loads, **Then** I see breadcrumbs "🍊 / Acme Corp / Project Name" and project tabs (Events, Distribute, Results) - NOT the company tabs
2. **Given** I am at `/acme-corp/proj123/events`, **When** I click "Distribute" tab, **Then** I navigate to `/acme-corp/proj123/distribute`
3. **Given** I am at the project root `/acme-corp/proj123`, **When** the page loads, **Then** I am redirected to `/acme-corp/proj123/events` (default landing page)

---

### User Story 5 - Event and Experience Context Navigation (Priority: P5)

As an admin user, I want to navigate into event and experience editors with their own isolated navigation contexts, so I can work on specific resources without confusing navbar stacking.

**Why this priority**: Completes the navigation hierarchy for all entity levels. Lower priority as these build on the patterns established in P1-P4.

**Independent Test**: Can be fully tested by navigating to event and experience routes and verifying each has isolated navigation appropriate to its context.

**Acceptance Scenarios**:

1. **Given** I am at `/acme-corp/proj123/evt456`, **When** the page loads, **Then** I see breadcrumbs "🍊 / Acme Corp / Project Name / Event Name" and event tabs (Experiences, Theme)
2. **Given** I am at `/acme-corp/exps/exp789`, **When** the page loads, **Then** I see breadcrumbs "🍊 / Acme Corp / experiences / Experience Name" with no tabs (experience editor context)
3. **Given** I am at any nested context (project, event, experience), **When** I view the layout, **Then** only that context's navbar is visible - no stacked navbars from parent contexts

---

### User Story 6 - Companies List at Root (Priority: P6)

As an admin user, I want to see a list of all companies at the root URL (`/`), so I can select which company to work in.

**Why this priority**: Entry point for the admin experience. Lowest priority in this feature because the existing companies list functionality already exists and mainly needs to be relocated.

**Independent Test**: Can be fully tested by visiting `/` and verifying the companies list is displayed with navigation links to each company via their slug.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I navigate to `/`, **Then** I see a list of all companies I have access to
2. **Given** the companies list is displayed, **When** I click on a company card for "Acme Corp", **Then** I navigate to `/acme-corp` (using the slug, not the ID)

---

### Edge Cases

- What happens when a company's name contains special characters (e.g., "Tom's Pizzeria & Co.")? → Slug generation strips special characters and converts to lowercase with hyphens (e.g., `toms-pizzeria-co`)
- What happens when a company's name is very long (>50 characters)? → Slug is truncated to 50 characters maximum
- What happens when a company's name would generate an empty slug (e.g., all special characters)? → Validation error requiring manual slug entry
- What happens when a user navigates to a valid company slug but lacks permission? → Existing authentication middleware handles access control
- What happens when a company slug conflicts with a reserved route (e.g., `projects`, `exps`, `settings`)? → These are route-group specific and don't conflict at the top level
- How does the system handle concurrent slug updates? → Last write wins with optimistic locking via Firestore

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support URL-friendly slugs for companies (lowercase letters, numbers, hyphens only)
- **FR-002**: System MUST auto-generate a slug from company name when creating a new company if no slug is provided
- **FR-003**: System MUST enforce slug uniqueness across all companies
- **FR-004**: System MUST validate slug format (1-50 characters, pattern: `^[a-z0-9-]+$`, no leading/trailing hyphens)
- **FR-005**: System MUST allow looking up companies by slug
- **FR-006**: System MUST display contextual navigation (breadcrumbs + tabs) appropriate to the current route context
- **FR-007**: System MUST prevent layout nesting/stacking when navigating between different contexts (company → project → event)
- **FR-008**: System MUST redirect from context root to default sub-route (e.g., `/acme-corp` → `/acme-corp/projects`)
- **FR-009**: System MUST display placeholder "Coming Soon" pages for features not yet implemented (Projects list, Distribute, Results, Theme)
- **FR-010**: System MUST preserve existing old routes during transition (parallel operation)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Navigation bar MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Navigation tabs MUST be scrollable horizontally on mobile if they overflow
- **MFR-003**: Breadcrumbs MUST truncate or collapse gracefully on narrow viewports
- **MFR-004**: Interactive tab elements MUST meet minimum touch target size (44x44px)
- **MFR-005**: Typography in navigation MUST be readable on mobile (≥14px for tab labels)

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Company slug input MUST be validated with Zod schema before persistence
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-003**: Route parameters (companySlug, projectId, eventId, expId) MUST be type-checked at layout boundaries
- **TSR-004**: Slug generation utility MUST have defined input/output types

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Company slug lookup (`getCompanyBySlug`) MUST use Admin SDK via Server Action
- **FAR-002**: Company creation with slug MUST use Admin SDK via Server Action
- **FAR-003**: Slug uniqueness check MUST be performed server-side before creation/update
- **FAR-004**: Company schema extensions MUST follow existing feature-local pattern in `features/companies/schemas/`

### Key Entities

- **Company (extended)**: Existing company entity with new `slug` field for URL-friendly identification. Slug is unique across all companies, auto-generated from name if not provided.
- **Navigation Context**: Conceptual entity representing the current user's position in the app hierarchy (company, project, event, experience). Determines which breadcrumbs and tabs to display.

## Assumptions

- Authentication and authorization remain handled by existing proxy.ts middleware
- Existing company CRUD functionality is stable and will be extended (not rewritten)
- Old `(admin)` routes will coexist with new `(workspace)` routes during transition
- Projects, Events, and Experiences entities already exist in the data model and have IDs that can be used in URLs
- User session includes access to company context once authenticated

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate to any company via human-readable slug URL (100% slug-based navigation for new routes)
- **SC-002**: Navigation context switches occur in under 500ms (no perceptible lag when changing tabs/contexts)
- **SC-003**: Zero layout stacking issues - each context displays exactly one navbar appropriate to that context
- **SC-004**: 100% of new routes are accessible and render without errors (including placeholder pages)
- **SC-005**: Slug validation rejects 100% of invalid inputs (uppercase, special characters, too long, duplicates)
- **SC-006**: Mobile users can access all navigation elements with appropriate touch targets and readable text
