# Data Model: Fix SSR Firestore Offline Crash

**Feature**: 077-fix-ssr-offline
**Date**: 2026-02-22

## Summary

This bug fix does not introduce or modify any data models. The existing `Project` entity and its schema (`projectSchema` from `@clementine/shared`) remain unchanged.

## Existing Entities (Reference Only)

### Project

- **Source**: `@clementine/shared` package (`projectSchema`)
- **Storage**: Firestore collection `projects`
- **Key fields used by the fix**:
  - `id` (string): Document ID
  - `status` (string): Project status — relevant value is `"deleted"` for soft-delete detection
- **Access pattern**: Read via `onSnapshot` real-time listener in `useProject` hook
- **Validation**: Zod schema validation via `convertFirestoreDoc()`

## No Changes Required

The fix removes a redundant server-side data fetch. The same `Project` entity continues to be fetched client-side via the existing `useProject` hook with identical schema validation.
