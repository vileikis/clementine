# Projects Feature Cleanup Report

> Generated: 2025-12-03
> Scope: `web/src/features/projects/`
> Status: **CLEANUP COMPLETED** (2025-12-03)

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Event/event text occurrences | 30+ | Deferred (ThemeEditor out of scope) |
| Unused components | 6 | **DELETED** |
| Unused actions | 1 | **DELETED** |
| TEMPORARY field markers | 4 | Deferred (Phase 5) |
| Legacy route patterns | 2 | **DELETED** (with components) |

## Cleanup Actions Completed

- Deleted `components/shared/` folder (all 4 components unused)
- Deleted `components/studio/ProjectBreadcrumb.tsx`
- Deleted `components/studio/ProjectForm.tsx`
- Removed `updateProjectBrandingAction` from actions
- Removed `updateProjectBranding` from repository
- Updated all barrel exports

---

## 1. Event(s) / event(s) Text Usage

### HIGH PRIORITY - Semantic Confusion

#### Issue 1.1: `activeEventId` Field Naming

**Files:**
- `types/project.types.ts:57-58`
- `schemas/projects.schemas.ts:59-60`
- `actions/projects.actions.ts:399-408`

**Problem:** Field name `activeEventId` actually stores Experience IDs in Phase 4.

```typescript
// types/project.types.ts
// TEMPORARY SEMANTICS - points to Experience IDs in Phase 4, will point to nested Event IDs in Phase 5
activeEventId?: string | null; // renamed from activeJourneyId
```

**Recommendation:** Rename to `activeExperienceId` for Phase 4 clarity, or add clearer documentation.

---

#### Issue 1.2: UI Text References "Event Theme"

**File:** `components/designer/ThemeEditor.tsx:157-159, 229, 508`

```tsx
<h2 className="text-2xl font-semibold">Event Theme</h2>
<p className="text-sm text-muted-foreground mt-1">
  Configure event-wide theme settings for visual customization
</p>
```

**Recommendation:** Change to "Project Theme" or "Theme Settings".

---

#### Issue 1.3: Comment References to "Event" Architecture

**Files:**
- `components/designer/index.ts:1-2`
- `types/project.types.ts:54-60`

```typescript
// designer/index.ts
// Designer Components - Event builder UI
// These components are used in the event design/configuration interface
```

**Recommendation:** Update comments to reference "Project" architecture.

---

### MEDIUM PRIORITY - UI Text

#### Issue 1.4: EmptyProjects Text

**File:** `components/EmptyProjects.tsx:26`

```tsx
<p className="text-sm text-muted-foreground max-w-md mb-6">
  Create your first project to start organizing your campaigns and events.
</p>
```

**Assessment:** This is acceptable - projects DO organize events. Keep as-is or simplify.

---

## 2. Unused Components

### HIGH PRIORITY - Remove or Document

| Component | Location | Status |
|-----------|----------|--------|
| `EventTabs` | `components/shared/EventTabs.tsx` | Exported, never imported |
| `DesignSubTabs` | `components/shared/DesignSubTabs.tsx` | Exported, never imported |
| `TabLink` | `components/shared/TabLink.tsx` | Exported, never imported |
| `EditableProjectName` | `components/shared/EditableProjectName.tsx` | Exported, never imported |
| `ProjectBreadcrumb` | `components/studio/ProjectBreadcrumb.tsx` | Exported, never imported |
| `ProjectForm` | `components/studio/ProjectForm.tsx` | Exported, never imported |

### Details

#### `EventTabs.tsx` & `DesignSubTabs.tsx`
- Reference legacy `/events/{eventId}/...` routes
- Contain hardcoded event-based navigation
- **Action:** DELETE - legacy code that doesn't fit projects architecture

#### `TabLink.tsx`
- Generic tab link component
- Used by EventTabs/DesignSubTabs (which are unused)
- **Action:** DELETE along with EventTabs/DesignSubTabs

#### `EditableProjectName.tsx`
- Click-to-edit project name in heading
- Duplicate functionality: `RenameProjectDialog.tsx` is used instead
- **Action:** DELETE - redundant

#### `ProjectBreadcrumb.tsx`
- Breadcrumb showing "Projects > [name]"
- Similar to navigation in `ProjectDetailsHeader.tsx`
- **Action:** DELETE - redundant

#### `ProjectForm.tsx`
- Full form for project creation
- Alternative: `CreateProjectButton.tsx` is used instead (simpler)
- **Action:** DELETE or keep for future advanced creation flow

---

## 3. Unused Actions

### MEDIUM PRIORITY

#### `updateProjectBrandingAction`

**File:** `actions/projects.actions.ts:151-180`

```typescript
export async function updateProjectBrandingAction(
  projectId: string,
  branding: { brandColor?: string; showTitleOverlay?: boolean }
): Promise<ActionResponse<Project>> {
```

**Problem:** Parameters don't match current Project schema (which uses `theme` object).

**Action:** DELETE - superseded by theme-based actions.

---

## 4. Deprecated Code / Migration Debt

### LOW PRIORITY - Phase 5 Placeholders

These are intentionally temporary and documented:

| Field | File | Notes |
|-------|------|-------|
| `publishStartAt` | `types/project.types.ts:54` | Will move to Event in Phase 5 |
| `publishEndAt` | `types/project.types.ts:55` | Will move to Event in Phase 5 |
| `activeEventId` | `types/project.types.ts:57-58` | Temporary semantics |
| `theme` | `types/project.types.ts:60` | Will move to Event in Phase 5 |

**Action:** Keep - properly documented for Phase 5 migration.

---

### HIGH PRIORITY - Legacy Route Patterns

**Files:**
- `components/shared/EventTabs.tsx:20-24`
- `components/shared/DesignSubTabs.tsx:19-21`

```typescript
const tabs = [
  { label: "Journeys", href: `/events/${eventId}/journeys` },
  { label: "Experiences", href: `/events/${eventId}/experiences` },
  // ...
];
```

**Problem:** Routes reference non-existent `/events/` structure.

**Action:** DELETE these components (already marked unused above).

---

## 5. Recommended Actions

### Immediate (Can do now)

1. **Delete unused components:**
   - `components/shared/EventTabs.tsx`
   - `components/shared/DesignSubTabs.tsx`
   - `components/shared/TabLink.tsx`
   - `components/shared/EditableProjectName.tsx`
   - `components/studio/ProjectBreadcrumb.tsx`
   - `components/studio/ProjectForm.tsx`

2. **Delete unused action:**
   - `updateProjectBrandingAction` from `actions/projects.actions.ts`

3. **Update exports:**
   - `components/shared/index.ts` - remove deleted exports
   - `components/studio/index.ts` - remove deleted exports
   - `actions/index.ts` - remove deleted export

### Quick Fixes

4. **Update UI text in ThemeEditor.tsx:**
   - "Event Theme" → "Project Theme"
   - "event-wide" → "project-wide"

5. **Update comments in designer/index.ts:**
   - "Event builder UI" → "Project designer UI"

### Defer to Phase 5

6. **`activeEventId` field naming** - Will naturally resolve when Phase 5 introduces real nested events

---

## 6. Files to Modify

```
DELETE:
├── components/shared/EventTabs.tsx
├── components/shared/DesignSubTabs.tsx
├── components/shared/TabLink.tsx
├── components/shared/EditableProjectName.tsx
├── components/studio/ProjectBreadcrumb.tsx
└── components/studio/ProjectForm.tsx

EDIT:
├── components/shared/index.ts (remove 4 exports)
├── components/studio/index.ts (remove 2 exports)
├── components/designer/index.ts (update comments)
├── components/designer/ThemeEditor.tsx (update UI text)
└── actions/projects.actions.ts (remove updateProjectBrandingAction)
└── actions/index.ts (remove export)
```
