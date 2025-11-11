# Data Model: Company Management

**Feature**: Company Management (Admin Dashboard)
**Date**: 2025-11-11
**Branch**: `002-company-management`

## Overview

This document defines the data model for company management, including entity schemas, relationships, validation rules, and Firestore indexes.

## Entities

### Company

**Collection**: `companies/`
**Description**: Represents a brand or organization that owns events

#### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string | Yes | Auto-generated document ID | Firestore auto-generated |
| `name` | string | Yes | Company display name | Min 1 char, max 100 chars, unique (case-insensitive) |
| `status` | enum | Yes | Active or soft-deleted | `"active"` or `"deleted"` |
| `deletedAt` | number | null | No | Timestamp when soft deleted | Unix timestamp ms, null if active |
| `brandColor` | string | null | No | Hex color for branding | Regex: `/^#[0-9A-F]{6}$/i` |
| `contactEmail` | string | null | No | Contact email for company | Valid email format |
| `termsUrl` | string | null | No | Terms of service URL | Valid URL format |
| `privacyUrl` | string | null | No | Privacy policy URL | Valid URL format |
| `createdAt` | number | Yes | Creation timestamp | Unix timestamp ms |
| `updatedAt` | number | Yes | Last update timestamp | Unix timestamp ms |

#### Indexes

**Composite Index 1**: `status (ASC) + name (ASC)`
- **Purpose**: Uniqueness check for active companies, sorted list queries
- **Query**: `.where('status', '==', 'active').orderBy('name', 'asc')`

**Single-field Index**: `status (ASC)`
- **Purpose**: Filter active companies
- **Query**: `.where('status', '==', 'active')`

#### Validation Rules (Zod)

```typescript
// Company creation schema
const createCompanySchema = z.object({
  name: z.string()
    .min(1, "Company name is required")
    .max(100, "Company name too long")
    .transform(val => val.trim()),
  brandColor: z.string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
    .optional(),
  contactEmail: z.string()
    .email("Invalid email format")
    .optional(),
  termsUrl: z.string()
    .url("Invalid URL")
    .optional(),
  privacyUrl: z.string()
    .url("Invalid URL")
    .optional(),
});

// Company update schema (same as create)
const updateCompanySchema = createCompanySchema;

// Company status enum
const companyStatusSchema = z.enum(["active", "deleted"]);
```

#### TypeScript Interface

```typescript
export type CompanyStatus = "active" | "deleted";

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  deletedAt: number | null;

  // Optional branding metadata
  brandColor?: string;
  contactEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;

  createdAt: number;
  updatedAt: number;
}
```

#### State Transitions

```
[NEW] → active (status="active", deletedAt=null)
active → deleted (status="deleted", deletedAt=timestamp)
deleted → active (status="active", deletedAt=null) [RESTORE - future enhancement]
```

**Note**: MVP does not include restore functionality. Soft-deleted companies are permanently hidden from UI.

---

### Event (Extended)

**Collection**: `events/`
**Description**: Existing entity extended with company relationship

#### New Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `companyId` | string | null | No | Foreign key to companies | Must reference existing active company, or null |

#### Modified Queries

**Filter by company**:
```typescript
db.collection('events')
  .where('companyId', '==', companyId)
  .orderBy('createdAt', 'desc')
```

**Filter by no company**:
```typescript
db.collection('events')
  .where('companyId', '==', null)
  .orderBy('createdAt', 'desc')
```

#### Indexes

**Single-field Index**: `companyId (ASC)`
- **Purpose**: Filter events by company
- **Query**: `.where('companyId', '==', companyId)`

**Composite Index**: `companyId (ASC) + createdAt (DESC)`
- **Purpose**: Sorted events by company
- **Query**: `.where('companyId', '==', companyId).orderBy('createdAt', 'desc')`

#### Validation Rules (Zod)

```typescript
// Extend existing createEventInput
const createEventInput = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  showTitleOverlay: z.boolean(),
  companyId: z.string().nullable().optional(), // NEW: Optional company reference
});
```

#### TypeScript Interface (Extended)

```typescript
export interface Event {
  id: string;
  title: string;
  brandColor: string;
  showTitleOverlay: boolean;

  status: EventStatus;
  currentSceneId: string;

  companyId: string | null; // NEW: Company FK (nullable)

  joinPath: string;
  qrPngPath: string;

  createdAt: number;
  updatedAt: number;
}
```

---

## Relationships

### Company → Events (One-to-Many)

**Relationship**: One company can have many events
**Foreign Key**: `Event.companyId` references `Company.id`
**Cardinality**: 1:N (one company to N events)
**Cascade Behavior**: Soft delete company does NOT delete events (events remain with companyId reference)

**Query Pattern**: Get all events for a company
```typescript
const events = await db.collection('events')
  .where('companyId', '==', companyId)
  .where('status', '!=', 'archived') // Optional: exclude archived
  .orderBy('createdAt', 'desc')
  .get();
```

**Denormalization**: NO - company name not stored in events. Repository layer joins company data for display.

**Rationale**: Single source of truth. When company name changes, all events automatically show updated name (via join at display time).

---

## Derived Data

### Company Event Count

**Calculation**: Count of events where `companyId == company.id`
**Storage**: NOT stored in company document (computed on demand)
**Query**:
```typescript
const snapshot = await db.collection('events')
  .where('companyId', '==', companyId)
  .count()
  .get();
const eventCount = snapshot.data().count;
```

**Rationale**: Firestore count() queries are efficient. No need to denormalize count and keep it in sync.

---

## Uniqueness Constraints

### Company Name Uniqueness

**Constraint**: Company names must be unique among active companies (case-insensitive)
**Enforcement**: Transaction-based check-then-write
**Scope**: Only active companies (`status == "active"`)
**Case Handling**: Lowercase normalization ("Nike" == "nike" == "NIKE")

**Implementation Pattern**:
```typescript
export async function createCompany(data: CreateCompanyInput): Promise<string> {
  const normalizedName = data.name.toLowerCase().trim();

  return await db.runTransaction(async (txn) => {
    // Check for duplicate name among active companies
    const existing = await txn.get(
      db.collection('companies')
        .where('status', '==', 'active')
        .where('name', '==', normalizedName)
        .limit(1)
    );

    if (!existing.empty) {
      throw new Error(`Company name "${data.name}" already exists`);
    }

    // Create new company
    const companyRef = db.collection('companies').doc();
    const company: Company = {
      id: companyRef.id,
      name: data.name.trim(),
      status: 'active',
      deletedAt: null,
      ...data, // Optional fields
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    txn.set(companyRef, company);
    return companyRef.id;
  });
}
```

**Edge Case**: Deleted companies can have duplicate names (e.g., two deleted "Nike" companies allowed, but only one active "Nike").

---

## Data Migration

### Legacy Events (No Company)

**Status**: Events created before this feature have `companyId == undefined`
**Treatment**: Displayed as "No company" in UI
**Migration Path**: Admin can edit event and assign company via UI

**Query Pattern**: Find legacy events
```typescript
const legacyEvents = await db.collection('events')
  .where('companyId', '==', null) // Firestore treats undefined as null
  .get();
```

---

## Performance Considerations

### Query Optimization

1. **Filter active companies**: Always use `.where('status', '==', 'active')` to exclude deleted
2. **Composite indexes**: Create indexes for common query patterns (status + name, companyId + createdAt)
3. **Event count**: Use Firestore `count()` queries (efficient aggregation, no document reads)
4. **Guest link validation**: Cache company status in-memory (60s TTL) to reduce reads

### Expected Scale (MVP)

- **Companies**: < 100 per admin
- **Events per company**: < 500
- **Total events**: < 1000
- **Concurrent users**: < 100 admins

All queries should complete < 2 seconds at this scale with proper indexing.

---

## Security Rules (Firestore)

```javascript
// Companies collection - admin only
match /companies/{companyId} {
  // Read: Allow all (admins filter client-side)
  allow read: if true;

  // Write: Deny all (use Server Actions via Admin SDK)
  allow write: if false;
}

// Events collection - extend existing rules
match /events/{eventId} {
  // Read: Allow all (guest access to join links)
  allow read: if true;

  // Write: Deny all (use Server Actions via Admin SDK)
  allow write: if false;
}
```

**Rationale**: Hybrid pattern - Client SDK for reads, Admin SDK for all mutations via Server Actions. Security enforced server-side via ADMIN_SECRET authentication.

---

## Summary

- **New entity**: Company (10 fields, soft deletion, unique name constraint)
- **Extended entity**: Event (+1 field: companyId nullable FK)
- **Relationship**: 1:N (Company → Events)
- **Indexes**: 3 new indexes (companies: status+name, status; events: companyId, companyId+createdAt)
- **Validation**: Zod schemas for type-safe input validation
- **Constraints**: Transaction-based uniqueness check for company names
- **Performance**: Optimized queries with composite indexes, count() aggregation
