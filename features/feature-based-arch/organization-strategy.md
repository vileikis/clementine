# Feature Organization Strategy

This document addresses the organization of complex features like Events and Experiences that span multiple sub-domains.

## The Challenge

### Events Feature Complexity

Events spans **two distinct use cases**:

1. **Studio/Admin** - Event management UI
   - Event list, cards, filters
   - Create/delete events
   - Company association
   - Event status management
   - Navigation (breadcrumbs, tabs)

2. **Designer/Builder** - Event configuration UI
   - Design sidebar navigation
   - Welcome screen editor
   - Ending screen editor
   - Distribution settings
   - Results/analytics view

**Question:** Should these be one feature or two?

### Experiences Feature Complexity

Experiences has **multiple experience types**:

1. **Photo** (currently implemented)
2. **Video** (future)
3. **Gif** (future)
4. **Wheel of Fortune** (future)

Each type:
- Shares common components (settings patterns, preview, enable/disable)
- Has unique components (countdown for photo, duration for video, sectors for wheel)
- Uses same data model and validation base

**Question:** How to organize by experience type?

---

## Recommended Approach

### Option A: Single Feature with Internal Organization

Organize complex features **internally by sub-domain**, keep one public API.

#### Events Structure

```
features/events/
├── components/
│   ├── studio/              # Event management UI
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   ├── EventStatusSwitcher.tsx
│   │   └── EventBreadcrumb.tsx
│   ├── designer/            # Event builder UI
│   │   ├── BuilderSidebar.tsx
│   │   ├── DesignSidebar.tsx
│   │   ├── WelcomeEditor.tsx
│   │   ├── EndingEditor.tsx
│   │   ├── PreviewPanel.tsx
│   │   └── ImageUploadField.tsx
│   └── shared/              # Shared between studio & designer
│       ├── EventTabs.tsx
│       └── EditableEventName.tsx
├── hooks/
│   ├── useEvent.ts
│   └── useEventsList.ts
├── lib/
│   ├── actions.ts
│   ├── repository.ts
│   └── validation.ts
├── types/
│   └── event.types.ts
└── index.ts                 # Single public API
```

**Public API (`index.ts`):**
```typescript
// Export organized by domain
export {
  EventCard,
  EventForm,
  EventStatusSwitcher,
  EventBreadcrumb,
} from './components/studio/...';

export {
  BuilderSidebar,
  DesignSidebar,
  WelcomeEditor,
  EndingEditor,
} from './components/designer/...';

export {
  EventTabs,
  EditableEventName,
} from './components/shared/...';
```

**Pros:**
- ✅ Single feature for all event-related code
- ✅ Shared data model, actions, types
- ✅ Clear internal organization
- ✅ One public API to import from
- ✅ Easy to understand relationships

**Cons:**
- ❌ Large barrel export (but not a real problem)
- ❌ Studio and designer tightly coupled (but they share the Event model)

#### Experiences Structure

```
features/experiences/
├── components/
│   ├── shared/              # Shared across all types
│   │   ├── ExperiencesList.tsx
│   │   ├── CreateExperienceForm.tsx
│   │   ├── ExperienceEditor.tsx        # Base editor
│   │   ├── ExperienceEditorWrapper.tsx
│   │   └── PreviewMediaUpload.tsx      # Used by all types
│   ├── photo/               # Photo-specific
│   │   ├── PhotoSettings.tsx
│   │   ├── CountdownSettings.tsx
│   │   ├── OverlaySettings.tsx
│   │   └── AITransformSettings.tsx
│   ├── video/               # Future: Video-specific
│   │   ├── VideoSettings.tsx
│   │   ├── DurationSettings.tsx
│   │   └── QualitySettings.tsx
│   ├── gif/                 # Future: Gif-specific
│   │   └── ...
│   └── wheel/               # Future: Wheel-specific
│       └── ...
├── hooks/
│   ├── useExperience.ts
│   └── useExperiences.ts
├── lib/
│   ├── actions.ts
│   ├── repository.ts
│   ├── validation.ts
│   └── constants.ts         # AI models, etc.
├── types/
│   └── experience.types.ts
└── index.ts
```

**Public API (`index.ts`):**
```typescript
// Shared components
export {
  ExperiencesList,
  CreateExperienceForm,
  ExperienceEditor,
} from './components/shared/...';

// Photo experience
export {
  PhotoSettings,
  CountdownSettings,
  OverlaySettings,
  AITransformSettings,
} from './components/photo/...';

// When video is implemented:
// export { ... } from './components/video/...';
```

**Pros:**
- ✅ All experience types in one feature
- ✅ Shared validation, actions, types
- ✅ Easy to add new experience types (just add folder)
- ✅ Clear separation between types

**Cons:**
- ❌ Will grow large over time (but manageable)

---

### Option B: Split into Multiple Features

Split complex domains into **separate top-level features**.

#### Events Structure (Split)

```
features/
├── event-studio/            # Event management
│   ├── components/
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   └── EventStatusSwitcher.tsx
│   ├── lib/
│   └── index.ts

├── event-designer/          # Event builder
│   ├── components/
│   │   ├── BuilderSidebar.tsx
│   │   ├── WelcomeEditor.tsx
│   │   └── EndingEditor.tsx
│   ├── lib/
│   └── index.ts

├── events-shared/           # Shared code
│   ├── lib/
│   │   ├── actions.ts       # Event CRUD actions
│   │   └── repository.ts
│   ├── types/
│   └── index.ts
```

**Imports:**
```typescript
import { EventCard } from '@/features/event-studio';
import { WelcomeEditor } from '@/features/event-designer';
import { getEvent } from '@/features/events-shared';
```

**Pros:**
- ✅ Maximum separation
- ✅ Can develop studio/designer independently
- ✅ Clear boundaries

**Cons:**
- ❌ "Event" concept split across 3 features
- ❌ More features to navigate
- ❌ Shared code in separate feature (adds complexity)
- ❌ Harder to understand relationships

#### Experiences Structure (Split)

```
features/
├── experience-photo/
├── experience-video/
├── experience-gif/
├── experience-wheel/
└── experiences-shared/      # Shared code
```

**Pros:**
- ✅ Each type is independent

**Cons:**
- ❌ Too granular
- ❌ Shared code separated
- ❌ Harder to maintain consistency

---

## Recommendation

### For Events: **Option A** (Single feature with studio/designer/shared subfolders)

**Rationale:**
- Studio and designer both work with the **same Event domain model**
- They share actions, repository, types
- Internal organization (studio/, designer/, shared/) provides clarity
- One feature = one domain (Events)
- Easier to maintain and understand

**When to reconsider:** If event-designer grows to 30+ components and becomes unwieldy, then split into separate features.

### For Experiences: **Option A** (Single feature with photo/video/gif/wheel subfolders)

**Rationale:**
- All experience types share the **same Experience domain model**
- They share validation, actions, repository
- Only differences are in settings UI components
- Easy to add new types (create new subfolder)
- One feature = one domain (Experiences)

**Implementation note:** Since only Photo exists today, you can start with components directly in `components/` and create `photo/` subfolder when Video is added.

---

## Revised Migration Order

### Phase 1: Companies (Easiest)
- Simple, isolated feature
- Good warm-up for the pattern

### Phase 2: Distribution (Small)
- QR codes, sharing
- No complex sub-domains

### Phase 3: Guest (Medium)
- Guest flow components
- Camera hooks
- Self-contained

### Phase 4: Sessions (Small)
- Mostly actions and repository
- Few components

### Phase 5: Experiences (Medium-Large)
- Start with flat structure
- Add `photo/` subfolder if/when Video is added
- Include experience editor components

### Phase 6: Events (Large)
- Use studio/designer/shared structure
- Most complex migration
- Do last when pattern is well-established

### Phase 7: Future Features
- Analytics
- Gallery
- Survey (when implemented)

---

## Detailed Structure Proposals

### Events Feature (Final)

```
features/events/
├── components/
│   ├── studio/
│   │   ├── EventCard.tsx              # Event list card
│   │   ├── EventForm.tsx              # Create/edit form
│   │   ├── EventStatusSwitcher.tsx    # Draft/live/archived toggle
│   │   └── EventBreadcrumb.tsx        # Navigation breadcrumb
│   ├── designer/
│   │   ├── BuilderSidebar.tsx         # Main builder sidebar
│   │   ├── DesignSidebar.tsx          # Design tab sidebar nav
│   │   ├── WelcomeEditor.tsx          # Welcome screen config
│   │   ├── EndingEditor.tsx           # Ending screen config
│   │   ├── PreviewPanel.tsx           # Mobile preview
│   │   ├── BuilderContent.tsx         # Builder content area
│   │   └── ImageUploadField.tsx       # Image upload for welcome/ending
│   └── shared/
│       ├── EventTabs.tsx              # Tab navigation (design/dist/results)
│       ├── TabLink.tsx                # Individual tab link
│       └── EditableEventName.tsx      # Inline event name editor
├── hooks/
│   ├── useEvent.ts
│   ├── useEventsList.ts
│   └── useEventBuilder.ts
├── lib/
│   ├── actions.ts                     # Server actions (CRUD)
│   ├── actions.test.ts
│   ├── repository.ts                  # Firestore repository
│   ├── repository.test.ts
│   ├── validation.ts                  # Zod schemas
│   └── constants.ts
├── types/
│   └── event.types.ts                 # Event, EventStatus, etc.
└── index.ts                           # Public API
```

### Experiences Feature (Final)

```
features/experiences/
├── components/
│   ├── shared/
│   │   ├── ExperiencesList.tsx           # List all experiences
│   │   ├── CreateExperienceForm.tsx      # Create new experience
│   │   ├── ExperienceEditor.tsx          # Base editor component
│   │   ├── ExperienceEditorWrapper.tsx   # Editor wrapper with data loading
│   │   └── PreviewMediaUpload.tsx        # Upload preview media
│   ├── photo/                            # Photo-specific settings
│   │   ├── PhotoSettings.tsx             # Main photo settings container
│   │   ├── CountdownSettings.tsx         # Countdown config
│   │   ├── CountdownSettings.test.tsx
│   │   ├── OverlaySettings.tsx           # Frame overlay config
│   │   ├── OverlaySettings.test.tsx
│   │   ├── AITransformSettings.tsx       # AI settings
│   │   ├── AITransformSettings.test.tsx
│   │   ├── PromptEditor.tsx              # AI prompt editor
│   │   ├── RefImageUploader.tsx          # Reference image upload
│   │   └── ModeSelector.tsx              # Photo mode selector
│   ├── video/                            # Future
│   ├── gif/                              # Future
│   └── wheel/                            # Future
├── hooks/
│   ├── useExperience.ts
│   └── useExperiences.ts
├── lib/
│   ├── actions.ts                        # Server actions (CRUD)
│   ├── repository.ts                     # Firestore repository
│   ├── validation.ts                     # Zod schemas
│   └── constants.ts                      # AI models, aspect ratios
├── types/
│   └── experience.types.ts               # Experience, ExperienceType, etc.
└── index.ts
```

### Companies Feature (Final)

```
features/companies/
├── components/
│   ├── CompanyCard.tsx
│   ├── CompanyFilter.tsx
│   ├── CompanyForm.tsx
│   ├── DeleteCompanyDialog.tsx
│   ├── BrandColorPicker.tsx
│   └── BrandingForm.tsx
├── lib/
│   ├── actions.ts
│   ├── actions.test.ts
│   ├── repository.ts
│   ├── repository.test.ts
│   ├── cache.ts                # Company status cache
│   └── validation.ts
├── types/
│   └── company.types.ts
└── index.ts
```

---

## Implementation Guidelines

### 1. Use Subfolders for Internal Organization

When a feature has multiple sub-domains, use subfolders under `components/`:

```
components/
├── domain-a/
├── domain-b/
└── shared/
```

### 2. Keep One Public API

Always use a single `index.ts` at the feature root, even if internally organized:

```typescript
// features/events/index.ts
export * from './components/studio/EventCard';
export * from './components/designer/WelcomeEditor';
export * from './components/shared/EventTabs';
```

### 3. Don't Create "Shared" Features

If code is shared across features, put it in:
- `components/shared/` - UI components
- `lib/` - Utilities, helpers
- Not `features/events-shared/` ❌

### 4. When to Split a Feature

Only split a feature into multiple features when:
- ✅ It has 50+ components
- ✅ Sub-domains have different data models
- ✅ Sub-domains are developed by different teams
- ✅ Sub-domains could be used independently

Otherwise, use internal organization (subfolders).

---

## Migration Tips for Complex Features

### Events Migration Strategy

1. **Start with shared components** (EventTabs, EditableEventName)
2. **Migrate studio components** (simpler, fewer dependencies)
3. **Migrate designer components** (more complex)
4. **Move actions, repository, types**
5. **Create public API**
6. **Update imports**

### Experiences Migration Strategy

1. **Start with shared components** (ExperiencesList, CreateForm)
2. **Migrate photo-specific components** (put in `photo/` subfolder)
3. **Move actions, repository, constants**
4. **Create public API**
5. **Update imports**

---

## Questions & Decisions

### When should we add video/, gif/, wheel/ subfolders?

**Answer:** When you start implementing the second experience type (Video).

**Before Video:**
```
components/
├── shared/
└── photo/
```

**After Video:**
```
components/
├── shared/
├── photo/
└── video/
```

### Should EventTabs go in studio/ or shared/?

**Answer:** `shared/` - it's used in both studio (event detail page) and designer (navigation).

### Where should BuilderSidebar go?

**Answer:** `designer/` - it's specific to the event builder UI.

---

## Future: Analytics & Gallery Features

### Analytics Feature (Future)

```
features/analytics/
├── components/
│   ├── StatsOverview.tsx
│   ├── SessionsChart.tsx
│   └── SharesBreakdown.tsx
├── hooks/
│   └── useAnalytics.ts
├── lib/
│   ├── actions.ts
│   └── calculations.ts
└── index.ts
```

### Gallery Feature (Future)

```
features/gallery/
├── components/
│   ├── GalleryGrid.tsx
│   ├── GalleryItem.tsx
│   └── GalleryFilters.tsx
├── hooks/
│   └── useGallery.ts
├── lib/
│   └── actions.ts
└── index.ts
```

---

## Summary

**Recommendation:** Use **Option A** (single feature with internal organization) for both Events and Experiences.

**Structure:**
- Events: `studio/`, `designer/`, `shared/` subfolders
- Experiences: `shared/`, `photo/`, `video/`, etc. subfolders

**Migration Order:**
1. Companies (easiest)
2. Distribution (small)
3. Guest (medium)
4. Sessions (small)
5. Experiences (medium-large)
6. Events (large, complex)

**Key Principles:**
- One feature = one domain
- Use subfolders for internal organization
- Single public API (`index.ts`)
- Don't split unless truly necessary

---

**Last Updated:** 2024-11-18
