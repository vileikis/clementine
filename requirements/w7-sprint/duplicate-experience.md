## Duplicate Experience

### Goal

From the **Experience list**, let a creator duplicate an existing experience into a new one, safely and predictably.

### Core UX

- Experience list item has action: **Duplicate**
- Click → instant duplicate (no modal) **OR** small inline confirm (“Duplicated as …”) with an optional “Rename” quick action.
- New experience appears in list near the top as:
  `"{Original name} (Copy)"` (or “Copy of …”)

### The decision: copy Draft only, or Draft + Published?

**Recommendation: copy BOTH, but set the new experience to DRAFT as the active state.**

Why:

- If you only copy draft, you lose the “known-good live version” that teams often want as the baseline.
- If you copy published and auto-publish the new one, you’ll create accidental launches.

So the rule should be:

#### Duplication rules

- Create new experience `E2`.
- Copy:
  - `draftConfig` = **source.draftConfig**
  - `publishedConfig` = **source.publishedConfig** (if exists)

- Set:
  - `E2.status = "draft"` (or equivalent)
  - `E2.publishedAt = null` (unless you explicitly track “hasPublishedBefore”)
  - `E2.isPublished = false` (whatever your canonical publish flag is)

- Any “live binding” fields reset:
  - share/public slug (must be new)
  - analytics counters
  - session/gallery references
  - any job history
  - webhook endpoints / third-party IDs (if any)

This gives maximum safety + preserves the production baseline.

### Data + Implementation requirements

- New experience must have:
  - `id` new
  - `createdAt` now
  - `createdBy` current user
  - `sourceExperienceId` stored for provenance (useful later)

- Deep copy all nested config objects (no shared references).
- If your experience references **project-level overlays or media assets**:
  - Prefer to copy references, **not duplicate assets** (cheap + avoids storage bloat).
  - But validate permissions: if the referenced asset is not accessible in the new context, strip it and surface a warning banner.

### Naming rules

- If “(Copy)” already exists, increment:
  `Name (Copy 2)`, `Name (Copy 3)` etc.

### Acceptance criteria

- Duplicated experience:
  - shows up immediately
  - has identical draft behavior/output as source (when run as draft)
  - **is not publicly accessible** unless explicitly published

- Published version is preserved internally but not live.
- No sessions/results are carried over.

### Failure cases to handle

- Source experience is deleted mid-action → show “Couldn’t duplicate”
- Missing referenced assets → duplicate succeeds but with warnings and safe fallbacks
