# Research: Project UX & Actions

**Branch**: `076-project-ux-actions` | **Date**: 2026-02-22

## R1: Project Identity Badge Pattern

**Decision**: Create `ProjectIdentityBadge` following the `ExperienceIdentityBadge` pattern but without thumbnail.

**Rationale**: The experience badge (`ExperienceIdentityBadge`) renders a clickable `<button>` with thumbnail + name + hover pencil icon. Projects have no cover image, so the badge is simpler: name + hover pencil icon only. The TopNavBar breadcrumb `label` prop accepts `React.ReactNode`, so the badge component can be passed directly as the breadcrumb label.

**Alternatives considered**:
- Inline editable text field in breadcrumb — rejected because it differs from the experience pattern and adds complexity (managing edit mode state, form submission inline)
- Reusing `ExperienceIdentityBadge` with optional thumbnail — rejected because the components live in different domains and the prop shapes differ

**Reference files**:
- `domains/experience/designer/components/ExperienceIdentityBadge.tsx` — button with `group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent`
- `domains/navigation/components/TopNavBar.tsx` — `BreadcrumbItem.label: React.ReactNode`

## R2: Rename Dialog Reuse

**Decision**: Reuse existing `RenameProjectDialog` from `domains/workspace/projects/components/`.

**Rationale**: The dialog already handles validation (non-empty, max 100 chars via `updateProjectInputSchema`), the `useRenameProject` mutation (Firestore transaction + serverTimestamp + query invalidation), and toast notifications. No modifications needed — just wire it into `ProjectLayout`.

**Props required**: `projectId`, `workspaceId`, `initialName`, `open`, `onOpenChange`

**Reference files**:
- `domains/workspace/projects/components/RenameProjectDialog.tsx`
- `domains/workspace/projects/hooks/useRenameProject.ts`

## R3: Project Duplication Pattern

**Decision**: Create `useDuplicateProject` following the `useDuplicateExperience` pattern.

**Rationale**: The experience duplication hook uses: Zod input validation → Firestore transaction → read source → verify active status → `structuredClone()` deep clone → `generateDuplicateName()` → `transaction.set()` new doc → query invalidation. The project duplication follows the same pattern but targets the `projects` collection (top-level, not nested under workspace).

**Key differences from experience duplication**:
- Projects are stored at top level (`projects/{id}`) not nested (`workspaces/{wid}/experiences/{eid}`)
- Projects have `draftConfig`/`publishedConfig` instead of `draft`/`published`
- Projects have `exports` field (set to null on duplicate)
- Projects have `type` field (copy as-is, typically `'standard'`)
- No `sourceProjectId` field exists in schema — skip origin tracking (or add if needed)

**Naming convention**: Use existing `generateDuplicateName()` from `domains/experience/shared/lib/generate-duplicate-name.ts`. This appends " (Copy)" suffix and handles truncation at 100 chars. Can be reused directly — it's a pure string utility with no domain coupling.

**Reference files**:
- `domains/experience/shared/hooks/useDuplicateExperience.ts`
- `domains/experience/shared/lib/generate-duplicate-name.ts`
- `domains/workspace/projects/hooks/useCreateProject.ts` — project field structure

## R4: Context Menu Migration

**Decision**: Migrate `ProjectListItem` from inline `DropdownMenu` to shared `ContextDropdownMenu`, and lift menu construction to parent.

**Rationale**: `ExperienceListItem` already uses `ContextDropdownMenu` with `menuSections` prop passed from `ExperiencesPage`. Adopting the same pattern for projects ensures visual and behavioral consistency. The shared component handles section separators, destructive styling, and 44px touch targets.

**Menu sections structure**:
```
Section 1: [Rename, Duplicate]
Section 2: [Delete] (destructive)
```

**Reference files**:
- `shared/components/ContextDropdownMenu.tsx` — `MenuSection[]` and `MenuAction[]` interfaces
- `domains/experience/library/containers/ExperiencesPage.tsx` — `getMenuSections()` pattern
- `domains/experience/library/components/ExperienceListItem.tsx` — `menuSections` prop

## R5: Fully Clickable Card Pattern

**Decision**: Wrap the entire card content in a `<Link>` component, with context menu positioned as an overlay that stops event propagation.

**Rationale**: The Card component is a plain `<div>` (no `asChild`). The best approach is to make the `<Link>` the primary interactive surface — either wrapping the Card or using a card-like `<Link>` with card classes. The context menu button uses `e.stopPropagation()` to prevent the Link from catching menu clicks.

**Existing hover patterns in codebase**:
- `hover:bg-accent` — sidebar nav items, breadcrumb links
- `hover:scale-[1.02]` — experience cards in connect drawer
- `hover:border-foreground/20` — not yet used but consistent with design system

**Chosen hover style**: `transition-colors hover:bg-accent/50` — subtle background shift consistent with other interactive surfaces. Combined with `cursor-pointer` for clear affordance.

**Keyboard accessibility**: `<Link>` renders as `<a>`, natively focusable and activatable with Enter. No additional keyboard handling needed.

**Context menu isolation**: Position the menu trigger button with `relative z-10` and attach `onClick={(e) => e.stopPropagation()}` (or use `e.preventDefault()` on the wrapping link if nested). Since `<a>` tags don't have nested interactive content restrictions enforced in practice (but semantically problematic), an alternative is to use the card as a non-link div with `onClick` handler that calls `router.navigate()`, keeping the `<a>` only for the context-menu-less flow. However, the simpler approach — Link as wrapper with stopPropagation on menu — is widely used and works well.

**Reference files**:
- `ui-kit/ui/card.tsx` — Card is a plain div, accepts className
- `domains/experience/library/components/ExperienceListItem.tsx` — current Link-inside-Card pattern
- `domains/workspace/projects/components/ProjectListItem.tsx` — same pattern
