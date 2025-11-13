# Research: Events Builder Redesign

**Date**: 2025-11-13
**Branch**: `001-events-builder-redesign`

## Overview

This document consolidates research findings for the events builder redesign. The goal is to transition from the current scene-based architecture to a more scalable experience-collection model with a tabbed builder interface (Welcome, Experiences, Survey, Ending).

## Research Questions & Findings

### 1. Firestore Subcollections Architecture

**Decision**: Use Firestore subcollections under each event document for experiences, experienceItems, surveySteps, surveyResponses, participants, sessions, and shares.

**Rationale**:
- **Data locality**: Subcollections keep related data under a single event path (`/events/{eventId}/experiences/{experienceId}`), making it easy to query and manage all event-related data
- **Security rules simplicity**: Firebase security rules can leverage path hierarchy to enforce access control at the event level
- **Scalability**: Subcollections scale independently - an event can have hundreds of experiences/survey steps without impacting the parent document size
- **Existing pattern**: The codebase already uses subcollections for scenes under events, so this pattern is familiar and consistent

**Alternatives considered**:
- **Top-level collections with eventId foreign key**: Rejected because it requires complex security rules and doesn't leverage Firestore's hierarchical structure
- **Embedded arrays in event document**: Rejected because Firestore has a 1MB document size limit, and embedding experiences/survey steps would quickly exceed this limit for events with many items

### 2. Tab Navigation Architecture (Next.js App Router)

**Decision**: Use Next.js App Router parallel routes with a shared layout for tab navigation (Content, Distribute, Results).

**Rationale**:
- **URL-based routing**: Each tab gets its own URL (`/events/{id}/content`, `/events/{id}/distribute`, `/events/{id}/results`), making tabs bookmarkable and shareable
- **Server Components by default**: App Router enables Server Components for initial page load, improving performance
- **Layout composition**: Shared layout can render the tab navigation UI and breadcrumb once, while each tab's page.tsx handles its own content
- **Existing pattern**: The codebase already uses App Router with nested layouts
- **Route group separation**: Event builder pages use a separate `(event-builder)` route group (instead of `(admin)`) to avoid layout conflicts and eliminate conditional rendering, following Next.js best practices

**Alternatives considered**:
- **Client-side tab state**: Rejected because it doesn't support deep linking to specific tabs and loses state on page refresh
- **Pages Router with query params**: Rejected because the project is already using App Router (Next.js 16), and Pages Router would be a step backward

### 3. Builder Sidebar Navigation Pattern

**Decision**: Use a fixed left sidebar on desktop (≥1024px) that collapses to a bottom sheet or dropdown on mobile (320px-768px).

**Rationale**:
- **Mobile-first**: On small screens, a fixed sidebar consumes too much horizontal space. A collapsible bottom sheet preserves screen real estate for the main content
- **Desktop ergonomics**: On larger screens, a persistent sidebar provides fast navigation between Welcome, Experiences, Survey, and Ending sections
- **Existing UI patterns**: shadcn/ui provides Sheet component for mobile drawer patterns, and the codebase already uses shadcn/ui throughout

**Alternatives considered**:
- **Always fixed sidebar**: Rejected because it sacrifices mobile usability (primary use case per constitution)
- **Tab navigation for sections**: Rejected because tabs are already used for Content/Distribute/Results at the event level. Nested tabs would be confusing

### 4. Preview Panel Strategy (Static vs Live)

**Decision**: Implement static preview panels for Welcome, Survey, and Ending sections. Defer live interactive previews for Experiences to a future phase.

**Rationale**:
- **YAGNI principle**: User requirements state "experience does not need preview at this stage" and "we prefer to implement new Events builder without logic first"
- **Scope management**: Static previews for Welcome/Survey/Ending are sufficient to validate the layout, while interactive Experience previews are complex (camera simulation, AI transformation preview)
- **Performance**: Static previews render instantly without client-side JavaScript, improving builder page load time

**Alternatives considered**:
- **Live iframe preview**: Rejected because it adds complexity (iframe communication, state sync) and isn't needed for this phase
- **No previews at all**: Rejected because visual feedback is important for Welcome/Ending screens with custom colors/images

### 5. Experience Type Scope (Photo Only)

**Decision**: Only implement photo experience type in this phase. Video, GIF, and wheel types are defined in the type system but marked as "Coming soon" in the UI.

**Rationale**:
- **Focused scope**: User requirements state "We only implement photo ExperienceType, others can be present but disabled (coming soon)"
- **Reduced complexity**: Photo experiences are simpler (single image capture + optional AI transformation). Video, GIF, and wheel experiences require additional infrastructure
- **Future extensibility**: Type system includes all experience types for forward compatibility, but implementation is phased

**Implications**:
- ExperienceType enum includes all types: "photo" | "video" | "gif" | "wheel"
- ExperienceItem collection (used by wheel experiences) is out of scope for this phase
- Experience type selector dialog shows all types, but only photo is selectable (others show "Coming soon" badge)

**Alternatives considered**:
- **Hide non-photo types entirely**: Rejected because it's useful to show users what's coming and avoid confusion about why the type selector exists
- **Implement all types at once**: Rejected because it violates YAGNI principle and extends timeline unnecessarily

### 6. Experience Type Selector (Dialog vs Inline)

**Decision**: Use a shadcn/ui Dialog component triggered by the "+" button in the Experiences section to select experience type (photo initially, others marked as "Coming soon").

**Rationale**:
- **Focus**: A modal dialog forces the user to make a deliberate choice before adding an experience, reducing accidental clicks
- **Progressive disclosure**: Only photo experiences are fully implemented; other types (video, gif, wheel) can show "Coming soon" states in the dialog
- **Existing pattern**: The codebase already uses dialogs for similar workflows (see EventForm, CompanyForm)

**Alternatives considered**:
- **Inline dropdown**: Rejected because it's less discoverable and doesn't support showing "Coming soon" states with explanatory text
- **Dedicated page**: Rejected because it adds unnecessary navigation overhead for a simple type selection

### 7. Survey Step Reordering UI

**Decision**: Use drag-and-drop handles (using lucide-react GripVertical icon) for reordering survey steps in the sidebar list. Store order in `event.surveyStepsOrder` array.

**Rationale**:
- **Intuitive**: Drag-and-drop is a familiar pattern for reordering list items, especially on desktop
- **Mobile-friendly**: Touch-friendly drag handles with 44x44px touch targets work well on mobile devices
- **State management**: Storing order in `surveyStepsOrder` array (rather than `order` field on each step) enables atomic reordering operations and handles race conditions

**Alternatives considered**:
- **Up/down arrow buttons**: Rejected because they require multiple clicks for large reorders and are less intuitive than drag-and-drop
- **Order field on each step**: Rejected because it's prone to race conditions (concurrent updates to multiple steps) and requires updating multiple documents for reordering

### 8. Data Model Migration Strategy

**Decision**: No migration required. New builder reads from new subcollections (experiences, surveySteps). Old builder (scenes) remains functional until deprecated.

**Rationale**:
- **Zero downtime**: Existing events with scenes continue to work unchanged during the transition period
- **Gradual rollout**: Creators can experiment with the new builder on new events before migrating existing events
- **Decoupled deployment**: Builder UI and data model changes can be deployed independently

**Alternatives considered**:
- **Automatic migration script**: Rejected because it's risky (potential data loss) and unnecessary (old and new models can coexist)
- **Breaking change with full cutover**: Rejected because it would require downtime and coordinated deployment

## Technology Choices & Best Practices

### Tailwind CSS v4 for Builder Layout

The builder uses Tailwind CSS v4 utility classes for responsive layout:

```css
/* Sidebar: fixed on desktop, collapsible on mobile */
.sidebar {
  @apply fixed inset-y-0 left-0 z-50 w-64 border-r bg-background lg:block;
}

/* Main content: offset by sidebar width on desktop */
.main-content {
  @apply lg:pl-64;
}
```

**Best practices**:
- Use mobile-first breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- Leverage Tailwind's built-in `group` and `peer` utilities for hover/focus states
- Use CSS custom properties for dynamic colors (e.g., `brandColor` from event document)

### Zod Validation for New Types

All new Firestore types in scope (Experience, SurveyStep) must have corresponding Zod schemas in `lib/schemas/firestore.ts`. ExperienceItem and other types are out of scope for this phase.

```typescript
export const experienceTypeSchema = z.enum(["photo", "video", "gif", "wheel"]);

export const experienceSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  label: z.string().min(1).max(100),
  type: experienceTypeSchema,
  enabled: z.boolean(),
  // ... rest of fields
});
```

**Best practices**:
- Co-locate TypeScript types and Zod schemas (types in `lib/types/firestore.ts`, schemas in `lib/schemas/firestore.ts`)
- Use `z.infer<typeof schema>` to derive TypeScript types from schemas (ensures 1:1 mapping)
- Validate all external inputs (API requests, form submissions) with `.parse()` or `.safeParse()`

### Server Actions for Mutations

All builder mutations (create/update/delete experiences, survey steps) use Next.js Server Actions:

```typescript
// lib/actions/experiences.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { experienceSchema } from "@/lib/schemas/firestore";

export async function createExperience(eventId: string, data: unknown) {
  const parsed = experienceSchema.parse(data);
  const ref = adminDb.collection(`events/${eventId}/experiences`).doc();
  await ref.set({ ...parsed, id: ref.id, createdAt: Date.now(), updatedAt: Date.now() });
  return { id: ref.id };
}
```

**Best practices**:
- Always use Firebase Admin SDK in Server Actions (never client SDK for writes)
- Validate input with Zod before database operations
- Return minimal data (IDs, not full documents) to reduce network payload
- Handle errors gracefully and return user-friendly messages

## Unknowns Resolved

All technical unknowns from the initial spec have been resolved:

1. **How to structure Firestore subcollections?** → Use subcollections under each event document (see section 1)
2. **How to implement tab navigation in App Router?** → Use parallel routes with shared layout (see section 2)
3. **How to handle mobile sidebar navigation?** → Fixed sidebar on desktop, collapsible Sheet on mobile (see section 3)
4. **How to preview experiences?** → Static previews for Welcome/Survey/Ending, defer Experience previews (see section 4)
5. **How to reorder survey steps?** → Drag-and-drop with order stored in `event.surveyStepsOrder` (see section 6)

## Next Steps

All research complete. Ready to proceed to Phase 1 (Design & Contracts):
1. Generate `data-model.md` with detailed entity definitions
2. Generate API contracts in `contracts/` (Server Actions signatures)
3. Generate `quickstart.md` for implementation guidance
4. Update agent context with new technologies/patterns
