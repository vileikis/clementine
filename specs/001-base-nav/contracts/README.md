# API Contracts: Base Navigation System

**Feature**: 001-base-nav | **Date**: 2025-12-26

## No API Contracts Required

This feature does **not** require any API contracts because:

1. **No Backend Integration**: Navigation uses mock data only (hardcoded const arrays)
2. **No External APIs**: No calls to Firebase, third-party services, or server functions
3. **Pure Client-Side**: All navigation logic lives in client-side React components
4. **No Data Fetching**: Workspace data is static mock data, not fetched from APIs

## Future API Contracts (Out of Scope)

When Firebase integration is added in future features, the following API contracts may be defined:

### GET /workspaces (Future)
Fetch user's workspaces from Firestore
- **Not implemented in this feature**
- Will use Firebase client SDK `getDocs(collection(firestore, 'workspaces'))`

### GET /workspace/:id (Future)
Fetch workspace details by ID
- **Not implemented in this feature**
- Will use Firebase client SDK `getDoc(doc(firestore, 'workspaces', id))`

---

## Current Implementation

Navigation uses:
- TanStack Router for routing (file-based, type-safe)
- React components for UI rendering
- Mock data from `src/domains/navigation/constants/mockWorkspaces.ts`

No API calls, no contracts needed.
