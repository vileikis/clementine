# Brief — Firebase Region Migration

> **Sprint**: W10 — Pilots Prep
> **Priority**: P2 — Infrastructure
> **Area**: Backend / Infrastructure

---

## Objective

Migrate Firebase services to co-located europe-west regions for optimal latency and a clean architecture ahead of pilot launches.

## Context

Current setup has Firestore in `europe-north2` (Helsinki) while compute runs in `europe-west1` (Belgium) and `europe-west4` (Netherlands). This adds ~25-40ms per Firestore operation from every Cloud Function and server-rendered page. All pilot clients will be in Nordics/Baltics/Europe — App Hosting is locked to `europe-west4` (only EU option), so co-locating everything in europe-west is the correct architecture.

## Current State

| Service | Region | Location |
|---|---|---|
| Firestore | `europe-north2` | Helsinki, Finland |
| Storage | `EU` multi-region | EU |
| App Hosting | `europe-west4` | Netherlands |
| Cloud Functions | `europe-west1` | Belgium |

## Target State

| Service | Region | Location | Change |
|---|---|---|---|
| Firestore | **`eur3`** (multi-region) | europe-west1 + europe-west4 read-write, europe-north1 witness | **Migrate** |
| Storage | `EU` multi-region | EU | Keep |
| App Hosting | `europe-west4` | Netherlands | Keep |
| Cloud Functions | **`europe-west4`** | Netherlands | **Redeploy** |

## Why `eur3` Firestore

- Read-write replicas in both `europe-west1` (Belgium) and `europe-west4` (Netherlands)
- Co-locates with both App Hosting and Cloud Functions — 0ms server-to-server latency
- `europe-north1` (Finland) acts as witness for consensus/availability only
- Fully EU-compliant (GDPR)

## Why `europe-west4` for Functions

- Co-locates with App Hosting (also europe-west4)
- With eur3 Firestore, has a local read-write replica
- Single region for all compute — simple to reason about

## Migration Steps

### 1. Firestore Migration (main effort)

- [ ] Export current Firestore data from `europe-north2`
- [ ] Create new Firestore database in `eur3` multi-region
- [ ] Import data into new database
- [ ] Update connection config across all services
- [ ] Verify data integrity
- [ ] Update Firestore security rules and indexes
- [ ] Test all read/write paths (app, functions, client SDK)

### 2. Cloud Functions Region Change (low effort)

- [ ] Update region config in function definitions from `europe-west1` to `europe-west4`
- [ ] Redeploy all functions
- [ ] Verify all function endpoints respond correctly
- [ ] Update any hardcoded function URLs (webhook configs, n8n workflows, etc.)

### 3. Validation

- [ ] End-to-end test: guest upload → AI transform → result delivery
- [ ] Verify App Hosting SSR reads from Firestore correctly
- [ ] Confirm Storage access from new function region
- [ ] Check Dropbox export and email tasks function correctly

## Risks

| Risk | Mitigation |
|---|---|
| Firestore migration downtime | Schedule during low-traffic window, communicate to pilot clients |
| Data loss during export/import | Verify document counts and spot-check critical collections |
| Hardcoded function URLs break | Audit codebase and external configs (n8n, webhooks) for old URLs |
| eur3 multi-region costs more than single region | Acceptable trade-off for latency and availability benefits |

## EU Compliance

All target regions are within EU member states. Storage remains EU multi-region. No data leaves the EU at any point during or after migration.
