# 📋 Technical Requirements: Router Restructure

## 1. Overview

This document outlines the router restructure for Clementine's admin interface. We're reorganizing `web/src/app` to separate the **Studio** (management UI) from **Editors** (fullscreen canvas UI) while keeping both under a shared authentication boundary.

**Current State:**
- Mixed routing with `(admin)` and `(studio)` zones
- Auth handled via `web/src/proxy.ts` middleware
- Design sidebar with welcome/experiences/ending navigation

**Target State:**
- Clean separation: `(dashboard)` → `(studio)` + `(editors)`
- Companies management stays in `(dashboard)` at root level
- Design tab gets 3 sub-tabs: Journeys, Experiences, Branding (all placeholder/WIP)
- Each editor (journey/experience) has its own layout with dynamic breadcrumbs (placeholder/WIP)
- Public routes `(public)` remain unchanged

**IMPORTANT - Scope:**
This project **ONLY** restructures routing. All new pages show placeholder/WIP content. No business logic implementation or modification.

### Placeholder Content Requirements

All new routes must display simple placeholder content:

**Option 1: Empty State**
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <p className="text-muted-foreground">Coming soon</p>
</div>
```

**Option 2: WIP Message**
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <div className="text-center">
    <h2 className="text-lg font-semibold">Work in Progress</h2>
    <p className="text-sm text-muted-foreground">This feature is under development</p>
  </div>
</div>
```

**Applies to:**
- `/design/journeys` page
- `/design/experiences` page
- `/design/branding` page
- `/events/[eventId]/journeys/[journeyId]` page
- `/events/[eventId]/experiences/[experienceId]` page

---

## 2. Directory Structure

```text
web/src/app/
├── (public)/                          # PUBLIC ZONE (unchanged)
│   └── join/[eventId]/
│       ├── layout.tsx
│       └── page.tsx
│
├── login/                             # Standalone login page
│   └── page.tsx
│
└── (dashboard)/                       # AUTH BOUNDARY (proxy.ts enforced)
    ├── layout.tsx                     # Auth check + Global Providers
    │
    ├── companies/                     # Companies Management (root level)
    │   ├── page.tsx                   # URL: /companies
    │   └── [companyId]/
    │       └── page.tsx               # URL: /companies/123
    │
    ├── events/
    │   ├── page.tsx                   # URL: /events (Events List)
    │   └── new/
    │       └── page.tsx               # URL: /events/new
    │
    ├── (studio)/                      # ZONE A: Management UI
    │   └── events/[eventId]/
    │       ├── layout.tsx             # Event header (breadcrumb, tabs, status)
    │       │
    │       ├── design/                # URL: /events/123/design
    │       │   ├── layout.tsx         # Design sidebar + sub-tabs context
    │       │   │
    │       │   ├── journeys/          # Design Sub-Tab 1
    │       │   │   └── page.tsx       # URL: /events/123/design/journeys
    │       │   │
    │       │   ├── experiences/       # Design Sub-Tab 2
    │       │   │   ├── page.tsx       # URL: /events/123/design/experiences
    │       │   │   └── create/
    │       │   │       └── page.tsx   # URL: /events/123/design/experiences/create
    │       │   │
    │       │   └── branding/          # Design Sub-Tab 3
    │       │       └── page.tsx       # URL: /events/123/design/branding
    │       │
    │       ├── distribution/
    │       │   └── page.tsx           # URL: /events/123/distribution (unchanged)
    │       │
    │       └── results/
    │           └── page.tsx           # URL: /events/123/results (unchanged)
    │
    └── (editors)/                     # ZONE B: Canvas UI
        └── events/[eventId]/
            ├── journeys/
            │   └── [journeyId]/
            │       ├── layout.tsx     # Editor layout (minimal header, breadcrumbs)
            │       └── page.tsx       # URL: /events/123/journeys/abc
            │
            └── experiences/
                └── [experienceId]/
                    ├── layout.tsx     # Editor layout (minimal header, breadcrumbs)
                    └── page.tsx       # URL: /events/123/experiences/xyz
```

> **⚠️ Critical Router Rule:**
> Both `(studio)` and `(editors)` share the `events/[eventId]/` segment.
> - **Studio owns:** `design`, `distribution`, `results`
> - **Editors owns:** `journeys`, `experiences`
> - **Result:** No URL conflicts

---

## 3. Navigation Structure

### Visual Hierarchy

**Event Studio Pages** (e.g., `/events/123/design/journeys`):
```
┌─────────────────────────────────────────────────────────────┐
│ Event Navigation Bar (sticky)                               │
│ [← Events] | Event Name | Design Distribute Results | [⚙️]  │
├─────────────────────────────────────────────────────────────┤
│ Design Sub-Navigation (sticky, below event nav)             │
│           Journeys  Experiences  Branding                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Main Content Area                                           │
│ (Journey list, Experience list, or Branding settings)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Editor Pages** (e.g., `/events/123/journeys/abc`):
```
┌─────────────────────────────────────────────────────────────┐
│ Editor Header (minimal, sticky)                             │
│ Events > Event Name > Journey Name     [Save] [Exit]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│            Fullscreen Canvas (h-screen)                     │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Layout Implementation

### A. Dashboard Root Layout
**File:** `web/src/app/(dashboard)/layout.tsx`

**Responsibility:**
- Authentication verification (redirect if no auth)
- Global providers: `QueryClientProvider`, `ToastProvider`
- **No visual UI** (no header/nav - those go in child layouts)

**Note:** Auth is already handled by `web/src/proxy.ts` middleware, so this layout primarily handles providers and context setup.

---

### B. Companies Layout (Root Level)
**File:** `web/src/app/(dashboard)/companies/layout.tsx` (if needed)

**Current State:** Companies currently live in `(admin)` with a shared layout showing Events/Companies tabs.

**Target State:** Move to `(dashboard)` root level, maintaining the current header with Events/Companies tab navigation.

---

### C. Studio Layout (Zone A)
**File:** `web/src/app/(dashboard)/(studio)/events/[eventId]/layout.tsx`

**Visuals:**
- Event header with breadcrumb, main tabs (Design/Distribution/Results), status switcher
- Standard dashboard layout with container padding

**Components:**
- `EventBreadcrumb` - editable event name
- `EventTabs` - Design, Distribution, Results
- `EventStatusSwitcher` - Draft/Live toggle
- `CopyLinkButton` - share link action

**Behavior:**
- Mounts when user visits any studio route (`/design`, `/distribution`, `/results`)
- Unmounts when entering editor routes

---

### D. Design Sub-Layout
**File:** `web/src/app/(dashboard)/(studio)/events/[eventId]/design/layout.tsx`

**Visuals:**
- Sub-navigation tabs rendered as an additional row below the event navigation bar
- Similar to `EventTabs` pattern: horizontal tab list with Journeys, Experiences, Branding
- Full-width container, sticky positioning to stay visible on scroll

**Components:**
- `DesignSubTabs` - New component following the `EventTabs` pattern
  - Location: `web/src/features/events/components/shared/DesignSubTabs.tsx`
  - Props: `eventId: string`
  - Tabs: Journeys, Experiences, Branding
  - Uses `pathname.startsWith()` for active state detection

**Layout Structure:**
```tsx
<div className="border-b bg-background sticky top-[73px] z-10"> {/* Stick below event nav */}
  <div className="container mx-auto px-6 py-3">
    <DesignSubTabs eventId={eventId} />
  </div>
</div>
<main className="container mx-auto px-6 py-8">{children}</main>
```

**Context:**
- Can optionally provide context for future features
- Not required for initial router structure implementation

**Current Implementation (to be removed):**
- ~~`DesignSidebar`~~ → Remove (tightly coupled with experiences)
- ~~Sidebar with Welcome/Experiences/Ending~~ → Remove entirely
- ~~Welcome route~~ → Remove (`/design/welcome`)
- ~~Ending route~~ → Remove (`/design/ending`)
- ~~Individual experience edit routes~~ → Remove (`/design/experiences/[experienceId]`)

**New Sub-Routes (All Placeholder/WIP):**
1. **Journeys** (`/design/journeys`)
   - **Content:** Empty state or "Work in Progress" text
   - **Purpose:** Future journey list and management

2. **Experiences** (`/design/experiences`)
   - **Content:** Empty state or "Work in Progress" text
   - **Purpose:** Future experience list and management

3. **Branding** (`/design/branding`)
   - **Content:** Empty state or "Work in Progress" text
   - **Purpose:** Future event-level branding settings

---

### E. Editor Layouts (Zone B)

#### Journey Editor Layout
**File:** `web/src/app/(dashboard)/(editors)/events/[eventId]/journeys/[journeyId]/layout.tsx`

**Visuals:**
- Fullscreen (`h-screen`, `overflow-hidden`)
- Minimal header with breadcrumbs + action buttons

**Components:**
- `EditorHeader` component with:
  - **Left:** `EditorBreadcrumbs` (Events → Event Name → "Journey" [placeholder])
  - **Right:** Save button (primary), Exit button (secondary, links to `/design/journeys`)

**Data Fetching (Future):**
- In future: Fetch journey document to get journey name for breadcrumbs
- For now: Use placeholder text like "Journey" or journey ID

**Page Content:**
- Show empty state or "Work in Progress - Journey Editor" text

**Location:** Define `EditorHeader` and `EditorBreadcrumbs` in `web/src/components/shared/`

#### Experience Editor Layout
**File:** `web/src/app/(dashboard)/(editors)/events/[eventId]/experiences/[experienceId]/layout.tsx`

**Visuals:**
- Same as Journey Editor (fullscreen, minimal header)

**Components:**
- Same `EditorHeader` with dynamic breadcrumbs
- **Left:** `EditorBreadcrumbs` (Events → Event Name → "Experience" [placeholder])
- **Right:** Save button, Exit button (links to `/design/experiences`)

**Data Fetching (Future):**
- In future: Fetch experience document to get experience name for breadcrumbs
- For now: Use placeholder text like "Experience" or experience ID

**Page Content:**
- Show empty state or "Work in Progress - Experience Editor" text

---

## 5. Shared Components

### Event Feature Components
Create in `web/src/features/events/components/shared/`:

### 1. `DesignSubTabs.tsx`
```tsx
interface DesignSubTabsProps {
  eventId: string
}
```

**Purpose:** Sub-navigation tabs for the Design section

**Pattern:** Follows `EventTabs` component pattern
- Horizontal tab list with active state detection
- Uses `pathname.startsWith()` for nested route highlighting
- Tabs: Journeys, Experiences, Branding

**Styling:** Matches `EventTabs` visual style for consistency

---

### General Shared Components
Create in `web/src/components/shared/`:

### 2. `EditorHeader.tsx`
```tsx
interface EditorHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  onSave: () => void | Promise<void>
  onExit: () => void
  saveLabel?: string
  exitLabel?: string
}
```

**Purpose:** Consistent header for all editor layouts

**Features:**
- Left: Dynamic breadcrumbs
- Right: Save (primary), Exit (secondary)
- Mobile-responsive

---

### 3. `EditorBreadcrumbs.tsx`
```tsx
interface BreadcrumbItem {
  label: string
  href?: string // Optional link
}

interface EditorBreadcrumbsProps {
  items: BreadcrumbItem[]
}
```

**Purpose:** Dynamic breadcrumb navigation for editors

**Usage (Initial Implementation):**
```tsx
<EditorBreadcrumbs
  items={[
    { label: "Events", href: "/events" },
    { label: "Event Name", href: `/events/${eventId}/design` },
    { label: "Journey" } // or "Experience" - placeholder text
  ]}
/>
```

**Note:** Event name and item names will be fetched in future iterations. Use placeholders or IDs for now.

---

### 4. `LoadingScreen.tsx`
**Purpose:** Consistent loading states

**Usage:** Import in `loading.tsx` files across routes

**Design:** Centered spinner or skeleton using ShadCN/UI components

---

### 5. `ErrorScreen.tsx`
**Purpose:** Consistent error states

**Features:**
- Icon: `AlertTriangle` (Lucide)
- Message: "Something went wrong"
- Action: "Try Again" button that calls `reset()`

**Usage:** Import in `error.tsx` files

---

## 6. Migration Notes

### What Changes:
1. **Companies** - Move from `(admin)/companies` to `(dashboard)/companies`
2. **Events List** - Move from `(admin)/events` to `(dashboard)/events`
3. **Studio Routes** - Move from `(studio)` to `(dashboard)/(studio)`
4. **Design Routes** - Complete restructure:
   - Remove: `/design/welcome`, `/design/ending`, `/design/experiences/[experienceId]`
   - Add: `/design/journeys` (WIP), `/design/experiences` (WIP), `/design/branding` (WIP)
5. **Editor Routes** - Create new `(dashboard)/(editors)` zone:
   - Add: `/events/[eventId]/journeys/[journeyId]` (WIP)
   - Add: `/events/[eventId]/experiences/[experienceId]` (WIP)

### What Stays Unchanged:
- `(public)` routes - no changes
- `/login` - stays at root level
- `proxy.ts` middleware - continues handling auth
- **Distribution page** - content and functionality unchanged (only path changes)
- **Results page** - content and functionality unchanged (only path changes)

### What Gets Removed:
- `DesignSidebar` component and all related logic
- Welcome screen route and configuration pages
- Ending screen route and configuration pages
- Individual experience edit pages under `/design/`

### Data Migration:
- **No Firestore schema changes**
- **No business logic changes**
- Existing data remains untouched
- Welcome/Ending screen data stays in Event document (unused for now)

---

## 7. Implementation Checklist

**Phase 1: Setup**
- [ ] Create `(dashboard)` folder structure
- [ ] Move companies routes to `(dashboard)/companies`
- [ ] Move events list to `(dashboard)/events`
- [ ] Create `(studio)` and `(editors)` route groups

**Phase 2: Studio Zone**
- [ ] Create `(dashboard)/(studio)/events/[eventId]/layout.tsx`
- [ ] Create `DesignSubTabs` component (following `EventTabs` pattern)
- [ ] Update design layout to render sub-tabs below event navigation
- [ ] Create Journeys page with WIP/empty content (`/design/journeys/page.tsx`)
- [ ] Create Experiences page with WIP/empty content (`/design/experiences/page.tsx`)
- [ ] Create Branding page with WIP/empty content (`/design/branding/page.tsx`)
- [ ] Remove old `DesignSidebar` component and layout
- [ ] Remove welcome route (`/design/welcome/`)
- [ ] Remove ending route (`/design/ending/`)
- [ ] Remove experience edit routes (`/design/experiences/[experienceId]/`)
- [ ] Move Distribution and Results to studio zone (content unchanged)

**Phase 3: Editors Zone**
- [ ] Create shared components: `EditorHeader`, `EditorBreadcrumbs` (with placeholder text)
- [ ] Implement Journey Editor layout with placeholder breadcrumbs
- [ ] Create Journey Editor page with WIP/empty content
- [ ] Implement Experience Editor layout with placeholder breadcrumbs
- [ ] Create Experience Editor page with WIP/empty content

**Phase 4: Cleanup**
- [ ] Create `LoadingScreen.tsx` and `ErrorScreen.tsx` (optional)
- [ ] Add `loading.tsx` and `error.tsx` files to key routes (optional)
- [ ] Remove unused feature code related to old design sidebar
- [ ] Update any hardcoded navigation links

**Phase 5: Testing**
- [ ] Verify: `/events` → `/events/123/design/journeys` navigation works
- [ ] Verify: All 3 design sub-tabs render and switch correctly
- [ ] Verify: Layout switch when entering editor (event nav disappears, editor header shows)
- [ ] Verify: Breadcrumbs render in editor layouts (placeholder text is fine)
- [ ] Verify: Exit button returns to correct design sub-tab
- [ ] Verify: Auth redirects work via `proxy.ts`
- [ ] Verify: Companies section accessible from dashboard
- [ ] Verify: Distribution and Results pages still work (content unchanged)
- [ ] Verify: Clean URLs (no route group names in browser)
- [ ] Verify: No broken links from removed routes

---

## 8. Out of Scope

**This is ONLY a router restructure. The following are explicitly out of scope:**

- **Business logic implementation** - No new features or functionality
- **Data fetching** - No Firestore queries for journeys/experiences/event names
- **Form implementations** - All new pages show placeholder/WIP content only
- **Welcome/Ending screen migration** - These features are removed, not reimplemented
- **Public zone changes** - `(public)/join/[eventId]` remains unchanged
- **Auth system changes** - `proxy.ts` continues handling authentication unchanged
- **Distribution/Results content changes** - Only routing paths change, content stays identical
- **Survey functionality** - Remains not implemented
- **Backend/Firestore changes** - No schema migrations or data updates
- **Component styling changes** - Use existing patterns, no visual redesigns

---

## 9. Key Design Decisions

**Why separate Journey and Experience editor layouts?**
- Allows for future specialized contexts/providers per editor type
- Clear separation of concerns for future feature development
- Each can have different actions/toolbars in the future

**Why move Companies to dashboard root?**
- Companies are a top-level entity, not event-specific
- Keeps Companies/Events tabs at same hierarchy level
- Cleaner mental model: Dashboard → Companies OR Events → Studio/Editors

**Why 3 design sub-tabs instead of sidebar?**
- Journeys and Experiences are distinct content types
- Branding centralizes event-level styling configuration
- Tab-based navigation matches the existing EventTabs pattern for consistency
- Horizontal tabs scale better on mobile than sidebar navigation
- Old DesignSidebar was tightly coupled with experiences - cleaner to start fresh

**Why remove Welcome/Ending routes instead of moving them?**
- Simplifies the migration - fewer routes to manage
- Branding tab can house this functionality in future iterations
- Current implementation was incomplete/not in active use
- Easier to rebuild when needed than maintain deprecated routes

**Why placeholder/WIP content for new pages?**
- Focus is purely on router structure, not feature implementation
- Allows testing of navigation flows without complex business logic
- Future features can be built on top of clean routing foundation
- Prevents scope creep and keeps migration focused
