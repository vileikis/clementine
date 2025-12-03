# Research: Nested Events

**Feature**: 017-nested-events
**Date**: 2025-12-03

## Research Summary

This feature builds directly on existing patterns in the codebase. The research phase identified that all technical decisions can follow established conventions from the Projects feature module.

---

## Decision 1: Firestore Subcollection Pattern

**Context**: Events need to be nested under Projects for the Company → Project → Event hierarchy.

**Decision**: Use Firestore subcollection at `/projects/{projectId}/events/{eventId}`

**Rationale**:
- Subcollections maintain parent-child relationship naturally
- Query scope is automatically limited to parent document
- Aligns with target architecture in `new-data-model-v5.md`
- Security rules can leverage parent document context

**Alternatives Considered**:
- Root collection with `projectId` field: Would require composite index for project-scoped queries, loses natural hierarchy
- Embedded array in Project document: Limited to 1MB document size, no real-time subscriptions on individual events

---

## Decision 2: companyId Denormalization

**Context**: Events are nested under Projects, which already have `companyId`. Should Events also store `companyId`?

**Decision**: Yes, denormalize `companyId` on Event documents

**Rationale**:
- Enables company-scoped queries without joining through Project
- Simplifies Firestore security rules for company-level access control
- Supports future analytics and reporting requirements
- User explicitly chose this option during spec creation

**Alternatives Considered**:
- Derive from parent Project: Requires join for company-scoped operations, complicates security rules

**Invariant**: `event.companyId` MUST always equal parent `project.companyId`

---

## Decision 3: Switchboard Pattern (No Status on Events)

**Context**: How to determine which Event is "active" for guests?

**Decision**: Use `Project.activeEventId` as single source of truth (no status field on Event)

**Rationale**:
- Simplifies Event schema
- Single point of control for guest routing
- Prevents state synchronization issues between Event.status and Project.activeEventId
- Aligns with PRD specification

**Alternatives Considered**:
- Status field on Event: Adds complexity, requires keeping status and activeEventId in sync
- Multiple active events: Out of scope, one active event per project is sufficient

---

## Decision 4: Theme Schema Reuse

**Context**: Events need theme configuration identical to current Project theme.

**Decision**: Copy EventTheme types and schemas from ProjectTheme (same structure, different names)

**Rationale**:
- Exact same configuration needs
- Enables future divergence if needed
- EventThemeEditor can be adapted from existing ThemeEditor with minimal changes
- Clear separation between Project and Event domains

**Alternatives Considered**:
- Shared BaseTheme type: Over-engineering for MVP, creates coupling
- Import ProjectTheme directly: Creates cross-feature dependency

---

## Decision 5: Real-time Events List

**Context**: How should the events list update when changes are made?

**Decision**: Use Client SDK `onSnapshot` for real-time events list subscription

**Rationale**:
- Follows Firebase Architecture Standards (Constitution Principle VI)
- Immediate feedback when events are created/updated/deleted
- Consistent with existing patterns in Projects feature

**Implementation**: `useEvents` hook with `onSnapshot` subscription to `/projects/{projectId}/events` collection

---

## Decision 6: Soft Delete Strategy

**Context**: How to handle event deletion?

**Decision**: Soft delete using `deletedAt` timestamp, filter in queries

**Rationale**:
- Consistent with Project soft delete pattern
- Enables data recovery if needed
- Prevents accidental permanent data loss

**Implementation**:
- Set `deletedAt = Date.now()` on delete
- Filter `where("deletedAt", "==", null)` in list queries
- Retain hard delete for future admin cleanup

---

## Decision 7: UI Component Strategy

**Context**: How to implement Event detail page tabs?

**Decision**: Use existing tab pattern from Project detail page

**Rationale**:
- Consistent UX across studio interface
- Proven pattern that works on mobile
- Minimal custom implementation needed

**Implementation**:
- Two tabs: "Experiences" (placeholder) and "Theme"
- Theme tab renders EventThemeEditor
- Experiences tab renders placeholder message

---

## Dependencies Identified

1. **Projects feature module** - Must be stable (Phase 4 complete)
2. **ThemeEditor component** - Adapt for Events (minimal changes needed)
3. **Firebase Admin SDK** - Server Actions pattern
4. **Firebase Client SDK** - Real-time subscriptions

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Should Events have status? | No - switchboard pattern via Project.activeEventId |
| Should Events have companyId? | Yes - denormalized for query efficiency |
| Keep theme on Project? | Yes - backwards compatibility during transition |
| Event scheduling enforcement? | No - stored but not enforced (deferred) |

---

## Next Steps

All technical decisions resolved. Proceed to Phase 1: Data Model and Contracts.
