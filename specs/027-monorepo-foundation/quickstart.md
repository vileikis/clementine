# Quickstart: Monorepo Foundation

**Feature**: 027-monorepo-foundation
**Date**: 2025-12-15

## Prerequisites

- Node.js 18+ installed
- pnpm 8+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase authentication (`firebase login`)
- Access to Firebase project `clementine-7568d`

## Quick Setup

```bash
# From repository root
pnpm install

# Verify shared package builds
pnpm --filter @clementine/shared build

# Verify functions build
pnpm --filter @clementine/functions build
```

## Local Development

### Run Functions Emulator

```bash
# Start functions emulator (builds automatically)
pnpm --filter @clementine/functions serve
```

The functions emulator will start at `http://localhost:5001`.

### Test Hello World Locally

```bash
curl http://localhost:5001/clementine-7568d/us-central1/helloWorld
```

Expected response:
```json
{
  "message": "Functions operational",
  "sharedTypesWorking": true,
  "testSession": { "id": "test", "projectId": "test-project" },
  "timestamp": "2025-12-15T14:30:00.000Z"
}
```

## Deployment

### Deploy Functions

```bash
# From repository root
./functions/scripts/deploy.sh
```

This script:
1. Builds `@clementine/shared` package
2. Builds `@clementine/functions` package
3. Deploys functions to Firebase

### Verify Deployment

```bash
curl https://us-central1-clementine-7568d.cloudfunctions.net/helloWorld
```

## Project Structure After Setup

```
clementine/
├── packages/
│   └── shared/                    # NEW: Shared Zod schemas package
│       ├── src/
│       │   ├── schemas/
│       │   │   ├── session.schemas.ts  # Zod schemas + derived types
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── functions/                     # UPDATED: Firebase Functions
│   ├── src/
│   │   └── index.ts              # Hello world function
│   ├── scripts/
│   │   └── deploy.sh             # Deploy orchestration script
│   ├── package.json
│   └── tsconfig.json
├── web/                          # UNCHANGED
├── pnpm-workspace.yaml           # UPDATED: Add packages/*
└── firebase.json                 # UPDATED: Add functions config
```

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm --filter @clementine/shared build` | Build shared package |
| `pnpm --filter @clementine/functions build` | Build functions |
| `pnpm --filter @clementine/functions serve` | Start local emulator |
| `./functions/scripts/deploy.sh` | Deploy functions to Firebase |

## Troubleshooting

### "Cannot find module '@clementine/shared'"

Ensure the shared package is built:
```bash
pnpm --filter @clementine/shared build
```

### "Firebase not logged in"

Run:
```bash
firebase login
```

### "Functions emulator port in use"

Kill existing process on port 5001:
```bash
lsof -ti:5001 | xargs kill -9
```

### "TypeScript errors in functions"

Verify TypeScript versions match across workspaces:
```bash
pnpm --filter @clementine/shared exec tsc --version
pnpm --filter @clementine/functions exec tsc --version
```

Both should report TypeScript 5.x.
