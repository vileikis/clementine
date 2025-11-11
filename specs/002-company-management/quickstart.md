# Quickstart Guide: Company Management Feature

**Feature**: Company Management (Admin Dashboard)
**Branch**: `002-company-management`
**Last Updated**: 2025-11-11

## Overview

This guide helps developers set up, test, and develop the Company Management feature locally.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Firebase project configured (already done)
- Environment variables set in `web/.env.local`:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_STORAGE_BUCKET`
  - `ADMIN_SECRET`

## Setup

### 1. Install Dependencies

```bash
# From repo root
pnpm install
```

### 2. Firestore Indexes Setup

**The indexes are already configured** in `firebase/firestore.indexes.json`:

- `companies` collection: `status + name` (for uniqueness checks and sorted lists)
- `events` collection: `companyId + createdAt` (for filtering events by company)

**Deploy indexes to production**:

```bash
# From repo root
firebase deploy --only firestore:indexes
```

**Note**:
- Indexes take 5-15 minutes to build after deployment
- Local development works without indexes (Firestore SDK handles simple queries)
- Production **requires** indexes for compound queries to work

**Monitor index build status**:
```bash
firebase firestore:indexes
```

Or check Firebase Console > Firestore > Indexes tab

### 3. Start Development Server

```bash
# From repo root
pnpm dev

# Or from web/ directory
cd web
pnpm dev
```

Server starts at http://localhost:3000

### 4. Authentication (Admin Access)

Set `ADMIN_SECRET` cookie to access admin dashboard:

**Option 1: Browser DevTools**
```javascript
// In browser console (F12)
document.cookie = "ADMIN_SECRET=your-secret-here; path=/; SameSite=Lax"
```

**Option 2: Login Page** (if implemented)
Navigate to `/admin/login` and enter admin secret.

## Testing Company Management

### Manual Testing Checklist

#### 1. Create Company (P1)

- [ ] Navigate to `/companies`
- [ ] Click "Create New Company"
- [ ] Enter company name (e.g., "Acme Corp")
- [ ] Click "Save"
- [ ] Verify company appears in list
- [ ] Verify event count shows "0 events"

**Test duplicate name validation**:
- [ ] Try creating another company with same name (should fail)
- [ ] Try creating with different case ("ACME CORP" should fail)

#### 2. Edit Company (P2)

- [ ] Click "Edit" on existing company
- [ ] Change name (e.g., "Acme Corporation")
- [ ] Click "Save"
- [ ] Verify name updated in list

#### 3. Create Event with Company (P1)

- [ ] Navigate to `/events`
- [ ] Click "Create Event"
- [ ] Fill event details
- [ ] Select company from dropdown
- [ ] Click "Create"
- [ ] Verify event shows company name in list

**Test inline company creation**:
- [ ] During event creation, click "Create new company"
- [ ] Enter new company name
- [ ] Verify company created and selected
- [ ] Complete event creation
- [ ] Verify both company and event exist

#### 4. Filter Events by Company (P2)

- [ ] Navigate to `/events`
- [ ] Use company filter dropdown
- [ ] Select specific company
- [ ] Verify only that company's events shown
- [ ] Select "No company"
- [ ] Verify only events without company shown
- [ ] Select "All"
- [ ] Verify all events shown

#### 5. Company Detail View (P2)

- [ ] Click company name or "View Events"
- [ ] Verify company detail page shows:
  - Editable name field
  - Total event count
  - Link to filtered events view
- [ ] Click "View events for this company"
- [ ] Verify redirected to `/events` with company filter applied

#### 6. Reassign Event Company (P3)

- [ ] Navigate to `/events/[eventId]/edit`
- [ ] Change company dropdown selection
- [ ] Click "Save"
- [ ] Verify event now shows new company in list

**Test removing company**:
- [ ] Edit event, select "No company"
- [ ] Verify event shows "No company" after save

#### 7. Soft Delete Company (P3)

- [ ] Navigate to `/companies`
- [ ] Click "Delete" on company with 0 events
- [ ] Confirm deletion
- [ ] Verify company removed from list

**Test with events**:
- [ ] Click "Delete" on company with events
- [ ] Verify warning/confirmation dialog
- [ ] Confirm deletion
- [ ] Verify company hidden from list
- [ ] Verify company's events still exist (show "No company" or keep company reference)

#### 8. Guest Link Validation (P3)

- [ ] Create event under a company
- [ ] Copy `/join/[eventId]` link
- [ ] Open link in incognito window
- [ ] Verify event loads correctly
- [ ] Soft delete the company
- [ ] Refresh guest link
- [ ] Verify error message "Event Unavailable"

### Automated Testing

Run unit and integration tests:

```bash
# From repo root
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test -- --coverage
```

**Test files**:
- `web/src/lib/repositories/companies.test.ts` - Company CRUD operations
- `web/src/app/actions/companies.test.ts` - Server Actions
- `web/src/__tests__/companies/crud.test.ts` - End-to-end company CRUD flows
- `web/src/__tests__/companies/event-association.test.ts` - Event-company relationship tests

### Type Checking

```bash
# From repo root
pnpm type-check

# Watch mode
cd web
pnpm type-check --watch
```

### Linting

```bash
# From repo root
pnpm lint

# Auto-fix
pnpm lint -- --fix
```

## Development Workflow

### 1. Implement a Task

Example: Implement company repository

```bash
# Create repository file
touch web/src/lib/repositories/companies.ts

# Implement CRUD operations (create, list, get, update, delete)
# Follow existing patterns from events.ts

# Create test file
touch web/src/lib/repositories/companies.test.ts

# Write tests (follow existing test patterns)
```

### 2. Validation Loop (Before Committing)

Run validation loop for every change:

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Run tests
pnpm test

# Manual testing in browser
pnpm dev
# Test affected functionality
```

### 3. Commit Changes

```bash
git add .
git commit -m "Add company repository with CRUD operations"
```

**Commit Message Guidelines**:
- Imperative mood: "Add", "Fix", "Update", "Remove"
- Concise but descriptive
- Reference tasks if applicable: "Add company filter (task P2-3)"

## Common Development Tasks

### Add New Server Action

```bash
# Edit actions file
vim web/src/app/actions/companies.ts

# Add new action function
export async function myNewAction(input: MyInput) {
  "use server"
  // Zod validation
  // Repository call
  // Revalidation
  return { success: true, ... }
}

# Add tests
vim web/src/app/actions/companies.test.ts
```

### Add New UI Component

```bash
# Create component file
touch web/src/components/organizer/MyComponent.tsx

# Implement component (follow shadcn/ui patterns)
# Import: import { Button } from "@/components/ui/button"

# Add to page
vim web/src/app/companies/page.tsx
```

### Add Firestore Query

```bash
# Edit repository file
vim web/src/lib/repositories/companies.ts

# Add query function
export async function getCompaniesByStatus(status: CompanyStatus) {
  const snapshot = await db.collection('companies')
    .where('status', '==', status)
    .orderBy('name', 'asc')
    .get();
  return snapshot.docs.map(doc => companySchema.parse({id: doc.id, ...doc.data()}));
}
```

## Debugging Tips

### Firestore Query Issues

```bash
# Check Firestore console for index build status
# Firebase Console > Firestore > Indexes

# Enable Firestore debug logging (in development)
# Add to web/src/lib/firebase/admin.ts:
// admin.firestore.setLogFunction(console.log);
```

### Server Action Not Working

```bash
# Verify "use server" directive at top of file
# Check browser network tab for action request/response
# Check Next.js server logs in terminal
```

### Type Errors

```bash
# Ensure types are up to date
pnpm type-check

# Check Zod schema matches TypeScript interface
# Ensure firestore.ts types match Zod schemas in schemas/firestore.ts
```

### Authentication Issues

```bash
# Verify ADMIN_SECRET cookie set in browser DevTools
# Application > Cookies > localhost > ADMIN_SECRET

# Check server logs for auth failures
# Server Actions should log "Authentication required" if failing
```

## Performance Monitoring

### Query Performance

Use Firestore console to monitor query performance:
- Firebase Console > Firestore > Usage tab
- Monitor reads/writes/deletes

**Expected reads for common operations**:
- List companies: 1 read per company
- Filter events by company: 1 read per event
- Get company event count: 0 reads (count aggregation)
- Guest link validation (cached): 0.1 reads average (90% cache hit)

### Page Load Performance

Use browser DevTools Performance tab:
- `/companies` should load < 1 second
- `/events` with filter should load < 2 seconds
- Guest links should load < 1 second (cached company status)

## Troubleshooting

### Problem: Duplicate company name allowed

**Cause**: Transaction not working, or case normalization missing
**Fix**:
```typescript
// Ensure transaction wraps uniqueness check
await db.runTransaction(async (txn) => {
  const normalized = name.toLowerCase().trim();
  const existing = await txn.get(
    db.collection('companies')
      .where('status', '==', 'active')
      .where('name', '==', normalized)
      .limit(1)
  );
  if (!existing.empty) throw new Error("Duplicate");
  // ... create company
});
```

### Problem: Events not showing company name

**Cause**: Join logic not implemented
**Fix**:
```typescript
// In listEventsAction, after fetching events:
const companyIds = [...new Set(events.map(e => e.companyId).filter(Boolean))];
const companies = await Promise.all(
  companyIds.map(id => getCompany(id))
);
const companyMap = Object.fromEntries(companies.map(c => [c.id, c]));

// In UI, map company name:
const companyName = event.companyId ? companyMap[event.companyId]?.name : "No company";
```

### Problem: Guest link still works after company deleted

**Cause**: Company status check not implemented
**Fix**:
```typescript
// In /join/[eventId]/page.tsx:
const event = await getEvent(eventId);
if (event.companyId) {
  const company = await getCompany(event.companyId);
  if (company.status === 'deleted') {
    return <ErrorPage message="Event Unavailable" />;
  }
}
```

## Resources

- **Spec**: `specs/002-company-management/spec.md`
- **Plan**: `specs/002-company-management/plan.md`
- **Data Model**: `specs/002-company-management/data-model.md`
- **API Contracts**: `specs/002-company-management/contracts/server-actions.yaml`
- **Research**: `specs/002-company-management/research.md`
- **Standards**: `standards/` directory (global, frontend, backend, testing)
- **Constitution**: `.specify/memory/constitution.md`

## Next Steps

After completing local setup and testing:

1. Run `/speckit.tasks` to generate task list
2. Implement tasks via `/speckit.implement`
3. Follow validation loop for each task
4. Submit PR when all tasks complete

## Support

For issues or questions:
- Check existing codebase patterns (events.ts, scenes.ts)
- Review standards documentation
- Ask in team chat or create GitHub issue
