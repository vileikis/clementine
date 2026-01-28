# Implementation Plan: Loading State Editor for Share Screen

**Branch**: `044-loading-state-editor` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/044-loading-state-editor/spec.md`

## Summary

Add configuration and preview capabilities for the share screen's loading/processing state. This feature extends the existing share screen editor to allow admins to customize both the "loading" state (while AI generation is in progress) and the "ready" state (when results are available). Implementation follows client-first architecture with Firebase Firestore for persistence, React Hook Form for form management, and real-time preview updates.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode enabled)
**Primary Dependencies**:
  - React 19.2.0
  - TanStack Start 1.132.0
  - TanStack Router 1.132.0
  - TanStack Query 5.66.5
  - React Hook Form 7.66.0
  - Zod 4.1.12 (validation)
  - Firebase SDK 12.5.0 (Firestore client)
  - Zustand 5.x (editor save state)
  - shadcn/ui + Radix UI (components)
  - Tailwind CSS 4.0.6

**Storage**: Firebase Firestore (client SDK) with transactional updates
**Testing**: Vitest 3.0.5 + Testing Library (React 16.2.0, Jest DOM 6.9.1)
**Target Platform**: Web (mobile-first responsive, desktop secondary)
**Project Type**: Web application (monorepo: apps/clementine-app/)
**Performance Goals**:
  - Preview updates < 200ms after typing
  - Auto-save debounce: 2 seconds
  - Tab switching < 100ms response time
**Constraints**:
  - Must maintain existing ShareEditorPage patterns
  - No breaking changes to existing share config schema
  - Client-first architecture (Firebase client SDK only)
  - Must follow existing auto-save patterns
**Scale/Scope**:
  - 2 new config panels (loading state panel)
  - 1 updated preview component (add loading state rendering)
  - 1 new Zod schema (shareLoadingConfigSchema)
  - 1 new mutation hook (useUpdateShareLoading)
  - Update 1 container (ShareEditorPage)
  - Update 1 shell component (PreviewShell for headerSlot)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Mobile-First Design
- **Status**: COMPLIANT
- **Rationale**: Share screen editor is already mobile-first. Loading state configuration uses same responsive patterns (viewport switcher, mobile preview). Preview updates work across mobile/desktop viewports.

### ✅ II. Clean Code & Simplicity
- **Status**: COMPLIANT
- **Rationale**: Feature extends existing patterns without adding complexity:
  - Reuses existing `useAutoSave` hook
  - Follows established form management patterns
  - Separates concerns (container orchestrates, panels present)
  - No new abstractions needed

### ✅ III. Type-Safe Development
- **Status**: COMPLIANT
- **Rationale**:
  - TypeScript strict mode enabled
  - Zod schema for ShareLoadingConfig
  - Runtime validation before Firestore writes
  - No `any` types

### ✅ IV. Minimal Testing Strategy
- **Status**: COMPLIANT
- **Rationale**:
  - Test critical flows: loading state save, preview switching, auto-save trigger
  - Focus on behavior, not implementation
  - Use existing testing patterns from share config tests

### ✅ V. Validation Gates
- **Status**: COMPLIANT - Will run before commit
- **Technical Validation**: `pnpm app:check` (format + lint + type-check)
- **Standards Compliance**:
  - `standards/frontend/design-system.md` (theme tokens, no hard-coded colors)
  - `standards/frontend/component-libraries.md` (shadcn/ui usage)
  - `standards/global/project-structure.md` (domain structure)
  - `standards/global/code-quality.md` (clean code principles)

### ✅ VI. Frontend Architecture
- **Status**: COMPLIANT
- **Rationale**:
  - Client-first: Firebase client SDK for all data operations
  - Real-time: Firestore subscriptions via TanStack Query
  - Security: Enforced by Firestore rules (not server code)
  - SSR: Not required (admin-only feature, no SEO needs)

### ✅ VII. Backend & Firebase
- **Status**: COMPLIANT
- **Rationale**:
  - Client SDK for reads and writes
  - No admin SDK needed (no elevated permissions required)
  - Security rules allow admins to write to project config
  - Transactional updates via `updateProjectConfigField` utility

### ✅ VIII. Project Structure
- **Status**: COMPLIANT
- **Rationale**:
  - Vertical slice: All loading state code within `domains/project-config/share/`
  - Organized by concern: `components/`, `containers/`, `hooks/`
  - Explicit naming: `ShareLoadingConfigPanel.tsx`, `useUpdateShareLoading.ts`
  - Barrel exports: Update `domains/project-config/share/index.ts`

**Overall Assessment**: ✅ ALL GATES PASSED - Feature aligns with all constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/044-loading-state-editor/
├── spec.md                   # Feature specification (completed)
├── plan.md                   # This file (/speckit.plan command output)
├── research.md               # Phase 0 output (research findings)
├── data-model.md             # Phase 1 output (schema design)
├── quickstart.md             # Phase 1 output (implementation guide)
├── contracts/                # Phase 1 output (API contracts - N/A for client-only)
│   └── [empty - no API contracts needed]
├── checklists/               # Quality checklists
│   └── requirements.md       # Specification quality checklist (completed)
└── tasks.md                  # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo structure (pnpm workspace)
apps/clementine-app/          # TanStack Start application
  src/
    domains/
      project-config/
        share/                # Share screen editor domain (EXISTING)
          components/
            ShareConfigPanel.tsx                  → RENAME TO → ShareReadyConfigPanel.tsx
            ShareLoadingConfigPanel.tsx           ← NEW
            SharePreview.tsx                      ← UPDATE (add loading state rendering)
          containers/
            ShareEditorPage.tsx                   ← UPDATE (add state tabs, loading form, loading auto-save)
          hooks/
            useUpdateShare.ts                     → RENAME TO → useUpdateShareReady.ts
            useUpdateShareLoading.ts              ← NEW
          constants/
            defaults.ts                           ← UPDATE (add DEFAULT_SHARE_LOADING)
          index.ts                                ← UPDATE (export new components/hooks)

    shared/
      preview-shell/
        containers/
          PreviewShell.tsx                        ← UPDATE (add headerSlot prop)
        components/
          PreviewShellHeader.tsx                  ← UPDATE (render headerSlot if provided)

packages/shared/              # Shared schemas and types
  src/
    schemas/
      project/
        project-config.schema.ts                  ← UPDATE (add shareLoadingConfigSchema, rename shareConfigSchema → shareReadyConfigSchema)
    index.ts                                      ← UPDATE (export new schema types)

firebase/
  firestore.rules                                 ← VERIFY (ensure draftConfig.shareLoading write allowed)
```

**Structure Decision**: Extends existing `apps/clementine-app/` monorepo workspace within the `domains/project-config/share/` vertical slice. All feature code resides in the share domain following established patterns. Shared schema updates in `packages/shared/` for type-safe validation across frontend and backend.

## Complexity Tracking

> **No violations** - This feature follows all constitution principles and does not introduce unnecessary complexity. It extends existing patterns without new abstractions.

## Phase 0: Research & Investigation

### Research Tasks

1. **Existing Auto-Save Patterns**
   - Review `shared/forms/hooks/useAutoSave.ts` implementation
   - Verify debounce timing (2 seconds) and change detection logic
   - Confirm form validation triggers before save
   - Document edge cases: pending saves during tab switching

2. **Preview Shell Extensibility**
   - Analyze `shared/preview-shell/containers/PreviewShell.tsx` structure
   - Verify if headerSlot prop pattern is feasible
   - Review existing header layout (viewport switcher, fullscreen toggle placement)
   - Confirm tab component placement won't break existing controls

3. **Form State Management Patterns**
   - Study ShareEditorPage form setup (React Hook Form + useWatch)
   - Review field update patterns (`form.setValue` with `shouldDirty`)
   - Document how multiple forms can coexist in single container
   - Verify auto-save works independently for multiple forms

4. **Schema Migration Patterns**
   - Review existing schema evolution patterns in `packages/shared/`
   - Verify if renaming `shareConfigSchema` → `shareReadyConfigSchema` breaks consumers
   - Document safe migration approach (export both names temporarily)
   - Check if any backend consumers rely on schema names

5. **Loading State UI Best Practices**
   - Research skeleton loader patterns in shadcn/ui
   - Review existing skeleton usage in codebase
   - Document accessibility requirements (ARIA attributes)
   - Verify skeleton component availability in ui-kit

6. **Firestore Transaction Patterns**
   - Review `updateProjectConfigField` utility implementation
   - Verify atomic updates for nested fields
   - Document version incrementing behavior
   - Confirm null value handling in Firestore

7. **Editor Save State Tracking**
   - Review `shared/editor-status/store/createEditorStore.ts` patterns
   - Verify how `useTrackedMutation` tracks pending saves
   - Document save indicator display logic
   - Confirm save state resets correctly after completion

### Research Outputs

**File**: `research.md` (generated in Phase 0)

Content structure:
```markdown
# Research Findings: Loading State Editor

## 1. Auto-Save Patterns
- **Decision**: Reuse existing useAutoSave hook with 2000ms debounce
- **Rationale**: Proven pattern, handles change detection and validation
- **Implementation Notes**: Create second useAutoSave instance for loading form

## 2. Preview Shell Header Extension
- **Decision**: Add headerSlot prop to PreviewShell
- **Rationale**: Non-breaking, follows render props pattern
- **Implementation Notes**: Render slot before viewport switcher in header

## 3. Multiple Forms in Container
- **Decision**: Create separate React Hook Form instances for ready and loading
- **Rationale**: Independent validation, auto-save, and change tracking
- **Implementation Notes**: Each form gets its own useAutoSave hook

## 4. Schema Migration Strategy
- **Decision**: Export both old and new schema names temporarily
- **Rationale**: Non-breaking migration, deprecate old name later
- **Implementation Notes**: Add @deprecated JSDoc to old export

## 5. Skeleton Loader Component
- **Decision**: Use shadcn/ui Skeleton component
- **Rationale**: Already available in ui-kit, accessible by default
- **Implementation Notes**: Apply to media placeholder in loading preview

## 6. Firestore Null Handling
- **Decision**: Store null for empty fields (not empty strings)
- **Rationale**: Consistent with existing share config patterns
- **Implementation Notes**: useAutoSave already normalizes empty strings to null

## 7. Save State Management
- **Decision**: Wrap both mutations with useTrackedMutation
- **Rationale**: Global save indicator tracks all pending saves
- **Implementation Notes**: Both ready and loading saves increment pendingSaves counter
```

## Phase 1: Design & Contracts

### 1. Data Model

**File**: `data-model.md` (generated in Phase 1)

#### Entity: ShareLoadingConfig

**Description**: Configuration for the share screen loading state shown while AI generation is in progress.

**Fields**:
- `title` (string | null): Loading state title text (e.g., "Creating your experience...")
  - Nullable: Yes (null = use default)
  - Validation: None (accept any string, defaults applied at display time)
  - Default: null
- `description` (string | null): Loading state description text (e.g., "This usually takes 30-60 seconds...")
  - Nullable: Yes (null = use default)
  - Validation: None (accept any string)
  - Default: null

**Relationships**:
- Parent: `ProjectConfig` (top-level field: `shareLoading`)
- Sibling: `ShareReadyConfig` (formerly `ShareConfig`, renamed for clarity)

**State Transitions**: None (simple configuration object, no state machine)

**Validation Rules**:
- Fields accept any string or null
- No max length constraints (trust admin input)
- Empty strings converted to null before storage (via useAutoSave normalization)

---

#### Entity: ShareReadyConfig (Renamed)

**Description**: Configuration for the share screen ready state shown when results are available.

**Changes**:
- Renamed from `ShareConfig` to `ShareReadyConfig` for consistency
- No schema changes (same fields: title, description, cta)
- Export both names temporarily for backward compatibility

**Fields**: (unchanged)
- `title` (string | null)
- `description` (string | null)
- `cta` (CtaConfig | null)

---

#### Entity: ProjectConfig (Updated)

**Changes**:
- Add `shareLoading` field (type: ShareLoadingConfig | null, default: null)
- Rename `share` field → `shareReady` (type: ShareReadyConfig | null, default: null)

**Firestore Path**: `projects/{projectId}/draftConfig`

**Version Management**: Increment `draftVersion` on any update

---

### 2. API Contracts

**N/A** - This feature uses Firebase client SDK exclusively. No custom API endpoints needed.

**Firestore Operations** (via client SDK):
- `updateProjectConfigField(projectId, { shareLoading: ShareLoadingConfig })` - Update loading config
- `updateProjectConfigField(projectId, { shareReady: ShareReadyConfig })` - Update ready config
- Uses existing transactional update utility (no new functions needed)

---

### 3. Quickstart Guide

**File**: `quickstart.md` (generated in Phase 1)

#### Implementation Checklist

**Phase A: Schema & Data Layer**
1. [ ] Update `packages/shared/src/schemas/project/project-config.schema.ts`:
   - Add `shareLoadingConfigSchema`
   - Rename `shareConfigSchema` → `shareReadyConfigSchema` (keep old export with @deprecated)
   - Update `projectConfigSchema` with both `shareReady` and `shareLoading` fields
   - Export `ShareLoadingConfig` and `ShareReadyConfig` types
2. [ ] Add default constants in `apps/clementine-app/src/domains/project-config/share/constants/defaults.ts`:
   - `DEFAULT_SHARE_LOADING` with default title and description
   - Rename `DEFAULT_SHARE` → `DEFAULT_SHARE_READY`
3. [ ] Create `useUpdateShareLoading` hook in `apps/clementine-app/src/domains/project-config/share/hooks/useUpdateShareLoading.ts`:
   - Follow `useUpdateShare` pattern
   - Wrap with `useTrackedMutation`
   - Validate with `shareLoadingConfigSchema`
4. [ ] Rename `useUpdateShare.ts` → `useUpdateShareReady.ts` (keep exports backward compatible)
5. [ ] Update barrel export `apps/clementine-app/src/domains/project-config/share/index.ts`

**Phase B: UI Components**
6. [ ] Update `PreviewShell.tsx`:
   - Add `headerSlot?: React.ReactNode` prop
   - Render slot in header before viewport switcher
7. [ ] Rename `ShareConfigPanel.tsx` → `ShareReadyConfigPanel.tsx`:
   - Update component name
   - Update prop types to use `ShareReadyConfig`
8. [ ] Create `ShareLoadingConfigPanel.tsx`:
   - Title field (Textarea, 2 rows)
   - Description field (Textarea, 4 rows)
   - Help text for each field
   - Follows `ShareReadyConfigPanel` structure
9. [ ] Update `SharePreview.tsx`:
   - Add `previewState: 'ready' | 'loading'` prop
   - Add `shareLoading: ShareLoadingConfig` prop
   - Rename `share` prop → `shareReady`
   - Add conditional rendering for loading state (skeleton + title + description)
   - Keep ready state rendering unchanged

**Phase C: Container Integration**
10. [ ] Update `ShareEditorPage.tsx`:
    - Add `previewState` state variable ('ready' | 'loading')
    - Create `shareLoadingForm` (second React Hook Form instance)
    - Add `useUpdateShareLoading` mutation
    - Add second `useAutoSave` for loading form
    - Create state tabs component (Tabs from shadcn/ui)
    - Pass tabs to PreviewShell via `headerSlot`
    - Add conditional config panel rendering based on `previewState`
    - Update preview to pass both configs and state

**Phase D: Validation & Testing**
11. [ ] Run validation gates:
    - `pnpm app:check` (format + lint + type-check)
    - Manual standards review (design-system, component-libraries, project-structure)
12. [ ] Test scenarios:
    - Edit loading title → auto-saves after 2 seconds
    - Edit loading description → auto-saves after 2 seconds
    - Switch between Ready/Loading tabs → preview updates
    - Reload page → loading config persists
    - Clear loading fields → stores null, shows defaults
    - Rapid tab switching → no errors, saves complete
13. [ ] Accessibility check:
    - Tab keyboard navigation works
    - Screen reader announces state changes
    - Save status indicators are accessible

---

#### File Modification Summary

| File | Action | Lines Changed (Est.) |
|------|--------|----------------------|
| `packages/shared/src/schemas/project/project-config.schema.ts` | Update | +15 (add schema, rename exports) |
| `apps/.../share/constants/defaults.ts` | Update | +5 (add DEFAULT_SHARE_LOADING) |
| `apps/.../share/hooks/useUpdateShareLoading.ts` | Create | +25 (new hook) |
| `apps/.../share/hooks/useUpdateShareReady.ts` | Rename | 0 (file rename only) |
| `apps/.../shared/preview-shell/containers/PreviewShell.tsx` | Update | +5 (add headerSlot prop) |
| `apps/.../share/components/ShareReadyConfigPanel.tsx` | Rename | +10 (rename component, update types) |
| `apps/.../share/components/ShareLoadingConfigPanel.tsx` | Create | +50 (new panel) |
| `apps/.../share/components/SharePreview.tsx` | Update | +30 (add loading state rendering) |
| `apps/.../share/containers/ShareEditorPage.tsx` | Update | +80 (add state tabs, loading form, auto-save) |
| `apps/.../share/index.ts` | Update | +3 (export new components/hooks) |

**Total Estimated LOC**: ~223 lines (new code + modifications)

---

### 4. Agent Context Update

**Run after Phase 1**:
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

**Purpose**: Update `.claude/context/clementine.md` with technology decisions from this plan (if any new tech introduced).

**Note**: This feature uses existing tech stack, so no new context entries needed. Script will preserve existing context.

---

## Phase 2: Task Generation

**Not included in this plan** - Run `/speckit.tasks` command to generate `tasks.md` after plan approval.

The tasks command will:
1. Read this plan
2. Generate dependency-ordered tasks
3. Create tasks.md in this specs directory
4. Include validation tasks at the end

---

## Summary

This plan extends the existing share screen editor to support loading state configuration without introducing complexity or breaking changes. The implementation:

- ✅ Follows client-first architecture (Firebase client SDK only)
- ✅ Reuses proven patterns (useAutoSave, React Hook Form, tracked mutations)
- ✅ Maintains clean separation of concerns (container orchestrates, panels present)
- ✅ Requires no new abstractions or libraries
- ✅ Passes all constitution gates
- ✅ Follows established domain structure

**Next Steps**:
1. Review and approve this plan
2. Run `/speckit.tasks` to generate implementation tasks
3. Begin implementation following task order
4. Run validation gates before marking complete
