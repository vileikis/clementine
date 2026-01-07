# Contracts: Themed Primitives

**Feature**: 016-themed-primitives | **Date**: 2026-01-07

## No New API Contracts Required

This feature is a **frontend-only change** that does not introduce new API endpoints or contracts.

### Data Flow

All data operations use existing Firestore mutations:

1. **Theme Updates**: `useUpdateTheme` mutation updates `event.draftConfig.theme` in Firestore
2. **Background Upload**: `useUploadAndUpdateBackground` hook uploads to Firebase Storage and returns `{ mediaAssetId, url }`
3. **Theme Read**: `useProjectEvent` query reads event data with theme included

### Schema Changes

The only data contract change is the `background.image` field structure:

**Before**: `string | null` (URL)
**After**: `MediaReference | null` (object with `mediaAssetId` and `url`)

This is documented in [data-model.md](../data-model.md).

### Component Contracts

The new components expose these interfaces (documented in spec.md):

- `ThemedText`: Typography component with variant, align, as, and theme props
- `ThemedButton`: Button component with size, disabled, and theme props

These are TypeScript interfaces, not API contracts.

### Why No API Contracts?

Per the Constitution's **Frontend Architecture** principle (VI):
- Client-first architecture using Firebase client SDKs
- Direct Firestore operations, not REST/GraphQL APIs
- Security enforced via Firestore rules, not server endpoints

Therefore, traditional OpenAPI/GraphQL contracts are not applicable to this feature.
