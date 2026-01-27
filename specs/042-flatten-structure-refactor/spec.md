# Flatten Project/Event Structure Refactor

## Status: Proposed

**Created:** 2026-01-23
**Priority:** MVP Blocking
**Estimated Effort:** 15-22 hours

---

## Problem Statement

### Original Design Intent

The current data model was designed to support multi-event campaigns:

- A **Project** represents a marketing campaign spanning multiple months
- **Events** nested under projects allow scheduling different activations over time
- One project join link serves as a persistent entry point across the campaign lifecycle
- Customers could manage large campaigns with multiple sequential events

### Reality Check

After evaluating actual use cases and customer needs:

| Assumption | Reality |
|------------|---------|
| Campaigns span months with multiple events | **90% of cases are single isolated events** |
| Customers want one link for entire campaign | Customers need **per-event galleries and analytics** |
| Multi-event scheduling is essential | This is **too far-fetched** for current needs |
| Guests and sessions span projects | Guests and sessions are **associated with specific events** |

### The Core Issue

We have unnecessary complexity in our data model that:

1. **Adds cognitive overhead** - Two concepts (project + event) when one suffices
2. **Complicates queries** - Must fetch project, then fetch event, then fetch config
3. **Confuses the domain model** - Sessions/jobs are under projects but logically belong to events
4. **Creates UX friction** - Extra navigation layers for creators
5. **Risks future technical debt** - Shipping MVP with this complexity will compound problems

### Why Not Use "Event" as the Top-Level Term?

We considered promoting "Event" to replace "Project" but rejected this because:

1. **Code collision** - "Event" is overloaded in programming (DOM events, event emitters, event-driven architecture). Having `eventId` everywhere creates developer experience friction.

2. **Semantic ambiguity** - A customer's real-world "event" might span multiple venues simultaneously. Our "thing" doesn't perfectly map to their mental model of "event" either.

3. **Massive refactoring** - Would require changing 1000+ references across 177 files.

4. **UI decoupling** - We can use customer-friendly terminology ("Event", "Activation") in the UI regardless of internal naming.

---

## Current State

### Firestore Collection Structure

```
/workspaces/{workspaceId}
  └── /experiences/{experienceId}    # Reusable step-based flows

/projects/{projectId}                 # Campaign container (mostly metadata)
  ├── /events/{eventId}              # ⚠️ NESTED - contains all real config
  ├── /sessions/{sessionId}          # Guest interactions
  ├── /jobs/{jobId}                  # Transform processing
  └── /guests/{guestId}              # Guest records
```

### Schema Distribution

| Schema | Contains | Real Value |
|--------|----------|------------|
| `Project` | name, status, workspaceId, activeEventId, type | ~5% (metadata shell) |
| `ProjectEventFull` | ALL guest-facing config (theme, welcome, share, overlays, experiences) | ~95% (actual configuration) |

### Coupling Metrics

- **1,034** `projectId` references across **177 files**
- **413** `eventId` references across **86 files**
- Deep coupling in: routes, schemas, hooks, repositories, security rules

---

## Proposed Solution

### Approach: Flatten Event Config into Project

Merge the nested event configuration directly into the project document, eliminating the events subcollection entirely.

### New Structure

```
/workspaces/{workspaceId}
  └── /experiences/{experienceId}    # Unchanged

/projects/{projectId}                 # Now contains ALL config
  ├── /sessions/{sessionId}          # Unchanged path
  ├── /jobs/{jobId}                  # Unchanged path
  └── /guests/{guestId}              # Unchanged path

# ELIMINATED:
# /projects/{projectId}/events/{eventId}
```

### New Project Schema

```typescript
// packages/shared/src/schemas/project/project.schema.ts

export const projectSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string().min(1).max(100),
  workspaceId: z.string(),

  // Status
  status: z.enum(['draft', 'live', 'deleted']),
  type: z.enum(['standard', 'ghost']),  // ghost for preview sessions

  // Configuration (merged from ProjectEventConfig)
  draftConfig: projectConfigSchema.nullable(),
  publishedConfig: projectConfigSchema.nullable(),

  // Versioning
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable(),
  publishedAt: z.number().nullable(),

  // Timestamps
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});
```

### Renamed Schemas

| Before | After |
|--------|-------|
| `ProjectEventFull` | Eliminated (merged into `Project`) |
| `ProjectEventConfig` | `ProjectConfig` |
| `projectEventSchema` | Eliminated |
| `projectEventConfigSchema` | `projectConfigSchema` |

### Eliminated Fields

- `activeEventId` on Project (no longer needed - only one config per project)

---

## Benefits

### Developer Experience

| Aspect | Before | After |
|--------|--------|-------|
| Queries | Fetch project → fetch event → get config | Fetch project → get config |
| Mental model | "Project contains events which have config" | "Project has config" |
| Code collision | N/A | No "event" term pollution |
| Path complexity | `projects/${pid}/events/${eid}` | `projects/${pid}` |

### Refactoring Scope

| Aspect | Full "Event" Rename | Flatten Approach |
|--------|---------------------|------------------|
| Collection paths | All change | **Unchanged** |
| Route params | `projectId` → `eventId` | **Unchanged** |
| Hook names | All rename | Merge only |
| Security rules | Restructure | Remove one block |
| Estimated hours | 40-60 | **15-22** |

### Future Flexibility

If multi-scope is needed later (e.g., customer runs event at 5 venues):

- Projects can contain "scopes" or "locations" as a future subcollection
- The flattened structure doesn't prevent this evolution
- We're not closing doors, just removing premature complexity

### UI Terminology Freedom

Internal code uses `project` / `projectId`, but UI can display:

- "Your Events" or "Your Projects"
- "Create Event" button
- "Event Settings" page
- Any terminology that resonates with customers

---

## Implementation Scope

### Phase 1: Schema Changes

**Files affected:**
- `packages/shared/src/schemas/project/project.schema.ts` - Expand with config fields
- `packages/shared/src/schemas/event/project-event.schema.ts` - Delete
- `packages/shared/src/schemas/event/project-event-config.schema.ts` - Rename to `project-config.schema.ts`
- `packages/shared/src/schemas/event/index.ts` - Update exports
- `packages/shared/src/schemas/index.ts` - Update exports

**Tasks:**
- [ ] Add config fields to project schema
- [ ] Rename `ProjectEventConfig` → `ProjectConfig`
- [ ] Remove `activeEventId` field
- [ ] Delete `ProjectEventFull` schema
- [ ] Update all schema exports

### Phase 2: Backend Changes

**Files affected:**
- `functions/src/repositories/` - Remove event repository, update project repository
- `functions/src/services/` - Update any event-related services
- `functions/src/triggers/` - Update Firestore triggers if any

**Tasks:**
- [ ] Delete event repository
- [ ] Update project repository to handle config
- [ ] Update job creation to reference project config directly
- [ ] Update any event-related cloud functions

### Phase 3: Frontend Routes

**Files affected:**
- `apps/clementine-app/src/app/` - Remove event routes, flatten structure

**Tasks:**
- [ ] Remove `/projects/$projectId/events/$eventId` routes
- [ ] Move event config pages directly under project routes
- [ ] Update route params and loaders
- [ ] Update navigation/breadcrumbs

### Phase 4: Frontend Hooks & Queries

**Files affected:**
- `apps/clementine-app/src/domains/project/` - Merge event hooks
- `apps/clementine-app/src/domains/event/` - Delete or merge

**Tasks:**
- [ ] Delete `useProjectEvent`, `useProjectEvents` hooks
- [ ] Update `useProject` to return full config
- [ ] Merge event mutation hooks into project mutations
- [ ] Update all components using event hooks

### Phase 5: Components & UI

**Files affected:**
- All components that consume event data

**Tasks:**
- [ ] Update components to use project config directly
- [ ] Remove event-specific components or merge into project
- [ ] Update forms and editors
- [ ] Verify all UI flows work correctly

### Phase 6: Security Rules

**Files affected:**
- `firebase/firestore.rules`

**Tasks:**
- [ ] Remove `/projects/{projectId}/events/{eventId}` match block
- [ ] Verify project-level rules cover config access

---

## Effort Estimate

| Area | Hours | Notes |
|------|-------|-------|
| Schema merge | 2-3 | Combine project + event schemas |
| Backend repositories | 2-3 | Remove event repo, update project repo |
| Frontend routes | 1-2 | Remove event routes, flatten |
| Hooks/queries | 4-6 | Merge event hooks into project hooks |
| Components | 3-4 | Update to use project directly |
| Security rules | 0.5-1 | Remove events block |
| Testing | 2-3 | Verify flows work |
| **Total** | **15-22** | |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missed references | Medium | Low | Grep for all event-related imports, TypeScript will catch type errors |
| Breaking guest flow | Low | High | Test guest journey end-to-end before merging |
| Session/job references | Low | Medium | Sessions already have projectId, just remove eventId |
| Ghost project pattern | Low | Low | Pattern works same way, just no nested event |

---

## Success Criteria

- [ ] No `ProjectEvent` or `ProjectEventFull` types in codebase
- [ ] No `/projects/{projectId}/events/{eventId}` Firestore paths
- [ ] All project hooks return config directly
- [ ] Guest flow works: join → capture → transform → share
- [ ] Admin flow works: create project → configure → publish → view analytics
- [ ] Preview flow works: ghost project with draft config
- [ ] TypeScript compiles with no errors
- [ ] All existing tests pass (updated as needed)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-23 | Flatten event into project (not promote event to top-level) | Avoids "event" naming collision in code, reduces refactoring scope by ~60% |
| 2026-01-23 | Keep "project" terminology in code | 1000+ existing references, UI copy can differ from internal naming |
| 2026-01-23 | Eliminate activeEventId | Only one config per project, field becomes meaningless |

---

## References

- Current project schema: `packages/shared/src/schemas/project/project.schema.ts`
- Current event schema: `packages/shared/src/schemas/event/project-event.schema.ts`
- Security rules: `firebase/firestore.rules`
