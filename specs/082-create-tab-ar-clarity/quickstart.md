# Quickstart: Create Tab Aspect Ratio Clarity

**Feature**: `082-create-tab-ar-clarity`
**Branch**: `082-create-tab-ar-clarity`

## Setup

```bash
git checkout 082-create-tab-ar-clarity
pnpm install
pnpm app:dev
```

## What to Build

Reorganize the Create tab's per-type config forms into two clearly labeled sections:

1. **Subject Photo** — shows capture step name + its AR (read-only display with "change" option)
2. **Output** — shows output AR selector + model/prompt config

## Key Files

| File | Purpose |
|------|---------|
| `apps/clementine-app/src/domains/experience/create/components/ai-image-config/AIImageConfigForm.tsx` | AI Image config — reorganize layout, remove AR from PromptComposer controls |
| `apps/clementine-app/src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx` | AI Video config — reorganize layout |
| `apps/clementine-app/src/domains/experience/create/components/photo-config/PhotoConfigForm.tsx` | Photo config — reorganize layout |
| `apps/clementine-app/src/domains/experience/create/components/shared-controls/AspectRatioSelector.tsx` | Reusable AR selector (no changes) |
| `apps/clementine-app/src/domains/experience/create/components/shared-controls/SourceImageSelector.tsx` | Capture step dropdown (no changes) |
| `apps/clementine-app/src/domains/experience/create/components/PromptComposer/ControlRow.tsx` | PromptComposer controls — AR auto-hides when not passed |

## Testing

1. Open an experience in the designer
2. Go to Create tab
3. Select AI Image type → verify Subject Photo + Output sections visible
4. Select AI Video type → verify same two-section layout
5. Select Photo type → verify same layout (no prompt section)
6. With 1 capture step → verify static display (no dropdown)
7. With multiple capture steps → verify dropdown appears
8. Change output AR → verify only output AR updates
9. Verify PromptComposer no longer shows AR selector inside it (AI Image)

## Validation

```bash
pnpm app:check       # Format + lint
pnpm app:type-check  # TypeScript
pnpm app:test        # Tests
```
