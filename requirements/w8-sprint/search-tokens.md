## Search Tokens for Experience & Project Documents

### 1) Problem

Firestore does not support substring/contains text search. Current search in the Connect Experience drawer (`ConnectExperienceDrawer`) filters client-side over already-loaded pages only. With pagination (20 per page), users miss results sitting on unloaded pages — making search unreliable for workspaces with many experiences.

The same limitation applies to any future project search.

### 2) Goal

Add a `searchTokens` array field to **Experience** and **Project** documents. This enables Firestore `array-contains` queries to find documents by partial name match server-side, eliminating the client-side-only search limitation.

First consumer: the Connect Experience drawer search, which currently uses `usePaginatedExperiencesForSlot` with client-side filtering.

### 3) Non-goals

- Full-text search (Algolia, Typesense, Meilisearch)
- Fuzzy/typo-tolerant matching
- Searching fields other than `name` (can be extended later)
- Retroactively updating existing documents in this ticket (migration is a separate task listed below)

---

## Data Model

### Search tokens field

Add to both `experienceSchema` and `projectSchema`:

```ts
/** Lowercase search tokens derived from name, for array-contains queries */
searchTokens: z.array(z.string()).default([])
```

**Firestore path (experience):** `workspaces/{workspaceId}/experiences/{experienceId}.searchTokens`
**Firestore path (project):** `projects/{projectId}.searchTokens`

### Token generation algorithm

Given a name like `"Summer Photo Booth"`, generate all **prefixes of each lowercase word**:

```
Input:  "Summer Photo Booth"
Words:  ["summer", "photo", "booth"]
Tokens: ["s", "su", "sum", "summ", "summe", "summer",
         "p", "ph", "pho", "phot", "photo",
         "b", "bo", "boo", "boot", "booth"]
```

Rules:
- Lowercase the name
- Split on whitespace
- Generate prefixes from length 1 to full word length for each word
- Deduplicate
- Cap total tokens at **100** (Firestore `array-contains` indexing limit per field is 1500 entries, but keeping it lean)

This supports **starts-with matching per word** — typing "pho" matches "Summer Photo Booth".

### Token generation utility

Create a shared utility in `packages/shared`:

```
packages/shared/src/utils/search-tokens.ts
```

```ts
export function generateSearchTokens(name: string, maxTokens?: number): string[]
```

This utility is shared so it can be used by:
- Frontend (optimistic writes, if applicable)
- Cloud Functions (write triggers, migrations)

---

## Schema Changes

### `packages/shared/src/schemas/experience/experience.schema.ts`

Add to `experienceSchema`:

```ts
searchTokens: z.array(z.string()).default([]),
```

### `packages/shared/src/schemas/project/project.schema.ts`

Add to `projectSchema`:

```ts
searchTokens: z.array(z.string()).default([]),
```

Since both schemas use `z.looseObject()`, existing documents without the field will pass validation (the `.default([])` handles it).

---

## Write-time Token Sync

Tokens must be regenerated whenever `name` changes.

### Option A: Cloud Function trigger (recommended)

`onDocumentWritten` trigger on experience and project collections. On create/update, if `name` changed, regenerate `searchTokens` and write back.

Pros: single source of truth, no client coordination needed.
Cons: slight delay (typically <1s) between name save and tokens being queryable.

### Option B: Client-side on save

Generate tokens client-side before writing the document.

Pros: immediate consistency.
Cons: every write path must remember to call the token generator.

**Recommendation:** Option A (Cloud Function trigger) as the canonical sync, with Option B as an optional optimization for immediate search consistency.

---

## Migration

A one-time migration script to backfill `searchTokens` for all existing experience and project documents.

**Location:** `functions/scripts/migrations/`

The migration should:
1. Query all experience documents across all workspaces
2. Query all project documents
3. For each document, generate tokens from `name` and write `searchTokens`
4. Use batched writes (500 per batch) for efficiency
5. Be idempotent (safe to re-run)

---

## Consumer: Connect Experience Drawer

### Current behavior

- `usePaginatedExperiencesForSlot` — paginated fetch with `limit(20)` + `startAfter`
- `ConnectExperienceDrawer` — client-side `experiences.filter(exp => exp.name.includes(query))`
- Search only covers loaded pages

### Target behavior

When `searchQuery` is non-empty:
- Switch from paginated mode to **search mode**
- Query Firestore with `array-contains` on `searchTokens` using the lowercased search term
- Apply a reasonable limit (e.g., 200) to bound cost
- No pagination controls in search mode (single fetch of matching results)

When `searchQuery` is empty:
- Use the existing paginated infinite query (unchanged)

### Implementation approach

Update `usePaginatedExperiencesForSlot` (or create a companion hook) to accept a `searchQuery` parameter:

- **No search query** → current `useInfiniteQuery` with pagination
- **Has search query** → `useQuery` with `array-contains` filter on `searchTokens`, `limit(200)`, no cursor pagination

The drawer already debounces input. The hook switches query strategy based on whether search is active.

### Firestore query (search mode)

```ts
query(
  experiencesRef,
  where('status', '==', 'active'),
  where('profile', 'in', allowedProfiles),
  where('searchTokens', 'array-contains', searchTerm.toLowerCase()),
  orderBy('createdAt', 'desc'),
  limit(200),
)
```

**Note:** Firestore does not allow `in` + `array-contains` in the same query (both are disjunctive operators). If this composite query is rejected, the workaround is to issue one query per profile and merge client-side, or restructure the query to use `array-contains-any` on a combined field.

**Firestore index required:** Composite index on `status` + `profile` + `searchTokens` + `createdAt` (or per the actual query shape after resolving the `in` + `array-contains` constraint).

---

## Tasks breakdown

1. **Shared utility** — `generateSearchTokens()` in `packages/shared`
2. **Schema updates** — Add `searchTokens` to experience and project schemas
3. **Cloud Function trigger** — Regenerate tokens on name change for both collections
4. **Migration script** — Backfill existing documents
5. **Firestore indexes** — Add composite indexes for search queries
6. **Hook update** — Dual-mode query in `usePaginatedExperiencesForSlot` (paginated vs search)
7. **Drawer update** — Pass debounced search query to hook, remove client-side filter when searching

### Firestore constraint to resolve first

Before implementation, validate whether `where('profile', 'in', [...])` + `where('searchTokens', 'array-contains', term)` is supported in a single Firestore query. If not, decide on the workaround (parallel queries per profile, or a combined `profileSearchTokens` field).
