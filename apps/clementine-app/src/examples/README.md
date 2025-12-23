# Examples Directory

This directory contains reference examples for common patterns in the app.

## 📚 Current Examples

### Firestore + TanStack Query

**✅ USE THIS:** [`firestore-clean-example.tsx`](./firestore-clean-example.tsx)

- Clean, production-ready example
- Shows proper separation of client/server code
- Demonstrates real-time sync with TanStack Query
- Uses the utilities from `src/lib/firestore-client.ts` and `src/lib/firestore-server.ts`

**📖 Reference:** [`firestore-real-usage.tsx`](./firestore-real-usage.tsx)

- Comprehensive example showing nested routes (Company → Project → Event)
- Explains the full flow from SSR to real-time updates
- Good for understanding the architecture

**❌ OUTDATED:** [`firestore-tanstack-query.tsx`](./firestore-tanstack-query.tsx)

- Old version with weird inline imports
- Kept for reference only
- DO NOT USE - use `firestore-clean-example.tsx` instead

### TanStack Router Patterns

**📖 Reference:** [`nested-routes-example.tsx`](./nested-routes-example.tsx)

- Shows different approaches to nested route data sharing
- Explains when to use each pattern
- Good for understanding router context vs data flow

**📖 Reference:** [`real-world-nested-example.tsx`](./real-world-nested-example.tsx)

- Practical example of TanStack Query caching with nested routes
- Shows how to avoid refetching parent data
- Explains query options and cache management

## 🚀 Quick Start

1. **For Firestore integration:**
   - Start with `firestore-clean-example.tsx`
   - Adapt to your collections and data model

2. **For nested routes:**
   - Read `nested-routes-example.tsx` to understand patterns
   - Use `real-world-nested-example.tsx` for TanStack Query caching

3. **For production implementation:**
   - Use the utilities in `src/lib/firestore-client.ts` (client-side)
   - Use the utilities in `src/lib/firestore-server.ts` (server-side)

## 📝 Notes

- All examples are for reference only - not meant to be imported/run directly
- TypeScript errors in examples are expected (Firebase not installed yet)
- Copy patterns from examples into your actual route files
