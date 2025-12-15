# Firebase Functions Deployment Fix with isolate-package

## Problem Analysis

**Current Error:**
```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

**Root Cause:**
Firebase Cloud Build runs `npm install` in the functions directory, but npm doesn't understand pnpm's `workspace:*` protocol used for `@clementine/shared` dependency. The monorepo structure is incompatible with Firebase's standard deployment process.

**Current Setup:**
- `functions/package.json` has `"@clementine/shared": "workspace:*"` in devDependencies
- Deployment tries to install this workspace dependency but fails in Firebase's npm-only environment
- Local development works because pnpm understands workspace protocol

## Solution Assessment: isolate-package

**Viability: ✅ HIGHLY RECOMMENDED**

The `isolate-package` solution is purpose-built for exactly this problem. It will:

1. Extract the functions package and its internal monorepo dependencies into an isolated directory
2. Convert workspace dependencies into proper npm-compatible package references
3. Generate a standard lockfile that Firebase can understand
4. Create a self-contained deployment artifact

**Why it works:**
- Uses `npm pack` mechanism to extract only necessary files
- Recursively includes internal dependencies (shared package)
- Generates Firebase-compatible package structure
- Maintains deterministic builds with proper lockfiles

## Architecture Decisions

### Decision 1: firebase.json Location - Keep at Root ✅

**Recommendation: Keep firebase.json at monorepo root**

The Firebase guide recommends per-package firebase.json for deployments from multiple independent Firebase packages. However, this doesn't apply to our setup:

**Why keep at root:**
1. **Single functions package** - We only have one `@clementine/functions` package, not multiple independent function deployments
2. **Multi-service configuration** - Our `firebase.json` manages:
   - Firestore (rules at `firebase/firestore.rules`, indexes at `firebase/firestore.indexes.json`)
   - Storage (rules at `firebase/storage.rules`)
   - Functions (source at `functions/`)
3. **Centralized Firebase resources** - The `firebase/` directory with rules and indexes needs to be accessible from root
4. **No deployment conflicts** - We're not deploying multiple node versions or 1st/2nd gen functions side-by-side

**When to split firebase.json:**
- Multiple independent Firebase packages (e.g., `functions-api/`, `functions-workers/`, `functions-cron/`)
- Different node versions per package
- Different deployment schedules or teams
- Completely independent function deployments

**Current structure (recommended):**
```
clementine/
├── firebase.json          # Manages all Firebase services
├── .firebaserc
├── firebase/              # Shared Firebase configuration
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
├── functions/             # Single functions package
└── packages/shared/
```

### Decision 2: Standard isolate-package vs firebase-tools-with-isolate Fork

**Recommendation: Start with standard isolate-package ✅**

**Understanding the "hot reload" concern:**

The Firebase docs mention the fork "preserves live code updates when running local Firebase emulators." Here's why this matters and why it's not a concern for us:

**With standard isolate-package approach:**
- If you configure firebase.json to ALWAYS use `functions/isolate/` (even for emulators)
- And `functions/isolate/` is a static snapshot created by running `npx isolate`
- Then changes to source code won't appear in emulators until you re-run `npx isolate`
- This would break the dev experience (no live reloading)

**Our approach avoids this problem:**
- **For development/emulators**: Point directly to `functions/` (source directory)
  - Run `pnpm run serve` which uses non-isolated functions
  - pnpm understands `workspace:*` protocol, so local dev works perfectly
  - Hot reloading works normally
- **For deployment only**: Use predeploy hook to create `functions/isolate/`
  - Only run isolation when deploying to Firebase Cloud
  - Firebase Cloud Build uses the isolated output
  - Never impacts local development

**Configuration strategy:**
```json
// firebase.json - deployment configuration
{
  "functions": [{
    "source": "functions/isolate",  // Deployment uses isolated
    "predeploy": ["cd functions && pnpm build && npx isolate"]
  }]
}

// functions/package.json - local development
{
  "scripts": {
    "serve": "npm run build && firebase emulators:start --only functions"
  }
}
```

When you run `firebase emulators:start` manually (without predeploy hooks), it can use the source directory directly. The predeploy hook only runs during `firebase deploy`.

**Why start with standard approach:**
1. **Simpler setup** - No fork to maintain, fewer dependencies
2. **Separation of concerns** - Development uses source, deployment uses isolated output
3. **Proven solution** - Standard isolate-package is well-tested and maintained
4. **Easy migration path** - Can always switch to fork later if needed
5. **Current setup already works** - Local emulators already function correctly

**When to consider the fork:**
- If you want a single firebase.json configuration that works for both dev and deploy
- If you're deploying very frequently and want streamlined workflow
- If the isolate-package author officially recommends it for monorepos (he does, but standard approach works fine)

**Trade-off summary:**

| Aspect | Standard isolate-package | firebase-tools-with-isolate fork |
|--------|-------------------------|----------------------------------|
| Setup complexity | Simple | Moderate (fork installation) |
| Local dev | Use source directly | Integrated isolation handling |
| Hot reloading | Works (use source) | Works (fork handles it) |
| Deployment | Predeploy hook | Integrated in CLI |
| Maintenance | Official package | Fork maintenance risk |
| Migration | Easy (can switch to fork) | Harder (remove fork) |

**Recommendation: Implement standard approach first, monitor dev experience, switch to fork only if isolation impacts local workflow.**

## Required Changes

### 1. Package Configuration Updates

**packages/shared/package.json** - Add `files` field:
```json
{
  "name": "@clementine/shared",
  "version": "0.1.0",
  "private": true,
  "files": ["dist/**/*", "package.json", "README.md"],
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

**functions/package.json** - Multiple changes:
```json
{
  "name": "@clementine/functions",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "files": ["dist/**/*", "package.json"],
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --target=node22 --outfile=dist/index.js --external:firebase-admin --external:firebase-functions --sourcemap",
    "serve": "npm run build && firebase emulators:start --only functions",
    "clean": "rm -rf dist"
  },
  "engines": {
    "node": "22"
  },
  "dependencies": {
    "firebase-admin": "^13.6.0",
    "firebase-functions": "^7.0.1",
    "@clementine/shared": "workspace:*"  // MOVED from devDependencies
  },
  "devDependencies": {
    "isolate-package": "^6.0.0",        // ADDED
    "esbuild": "^0.20.0",
    "typescript": "^5.0.0"
  }
}
```

**Key changes:**
- Add `files` field to both packages to specify what to include in isolation
- Move `@clementine/shared` from devDependencies to dependencies (isolate-package only processes dependencies)
- Add `isolate-package` as a devDependency

### 2. Firebase Configuration Update

**firebase.json** - Change functions source to isolated output:
```json
{
  "firestore": {
    "rules": "firebase/firestore.rules",
    "indexes": "firebase/firestore.indexes.json"
  },
  "storage": [
    {
      "bucket": "clementine-7568d.firebasestorage.app",
      "rules": "firebase/storage.rules"
    }
  ],
  "functions": [
    {
      "source": "functions/isolate",  // CHANGED from "functions"
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git"
      ],
      "predeploy": [
        "cd functions && pnpm build && npx isolate"  // ADDED
      ]
    }
  ],
  "emulators": {
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "functions": { "port": 5003 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

**Important:** The predeploy hook runs ONLY during `firebase deploy`, not during `firebase emulators:start`. This preserves local dev workflow.

### 3. Isolation Configuration

**functions/isolate.config.json** - Create new file:
```json
{
  "outDir": "./isolate",
  "packageManager": "npm",
  "includeDevDependencies": false,
  "logLevel": "info"
}
```

**Configuration explained:**
- `outDir`: Output directory for isolated package (Firebase will deploy from here)
- `packageManager`: Use npm format even though we develop with pnpm (Firebase Cloud Build uses npm)
- `includeDevDependencies`: false - only include production dependencies in deployment
- `logLevel`: "info" for useful logs ("debug" for troubleshooting)

### 4. Update Deployment Script

**functions/scripts/deploy.sh** - Simplify (predeploy hook handles build + isolation):
```bash
#!/bin/bash
set -e

echo "🚀 Deploying Clementine Functions..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "📦 Building shared package..."
pnpm --filter @clementine/shared build

echo "🔥 Deploying to Firebase (predeploy will build & isolate)..."
firebase deploy --only functions

echo "✅ Deployment complete!"
```

**Note:** The predeploy hook in firebase.json will run `cd functions && pnpm build && npx isolate` before deployment.

### 5. Update .gitignore

**functions/.gitignore** - Add isolation output:
```
/isolate
/dist
node_modules
```

The isolated output should not be committed to git.

## Implementation Steps

### Step 1: Install isolate-package
```bash
cd functions
pnpm add -D isolate-package
```

### Step 2: Add `files` field to shared package
Edit `packages/shared/package.json`:
```json
{
  "files": ["dist/**/*", "package.json", "README.md"]
}
```

### Step 3: Update functions package.json
- Add `files` field: `["dist/**/*", "package.json"]`
- Move `@clementine/shared` from devDependencies to dependencies
- isolate-package already installed from Step 1

### Step 4: Create isolation config
Create `functions/isolate.config.json` with the configuration shown above.

### Step 5: Update Firebase configuration
Modify root `firebase.json`:
- Change functions source: `"source": "functions/isolate"`
- Add predeploy hook: `"predeploy": ["cd functions && pnpm build && npx isolate"]`

### Step 6: Update deployment script
Simplify `functions/scripts/deploy.sh` - predeploy handles build + isolation.

### Step 7: Update gitignore
Add `/isolate` to `functions/.gitignore`.

### Step 8: Test isolation locally
```bash
cd functions
pnpm build                # Build the functions
npx isolate              # Create isolated package
ls -la isolate/          # Verify output
```

Verify `functions/isolate/` contains:
- `dist/index.js` (bundled functions code)
- `package.json` (with dependencies resolved)
- `package-lock.json` (npm format, no workspace: protocol)
- `node_modules/` will be created during Firebase deployment

### Step 9: Test deployment
```bash
cd /path/to/clementine
pnpm functions:deploy
```

Monitor for:
- ✅ Shared package builds successfully
- ✅ Functions build with esbuild
- ✅ Isolation creates `functions/isolate/`
- ✅ Firebase deploy succeeds
- ✅ No "EUNSUPPORTEDPROTOCOL" errors

### Step 10: Verify deployed functions
```bash
firebase functions:log    # Check function logs
```

Test function invocation to ensure shared package types and code are available at runtime.

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared/package.json` | Add `files` field | Tell isolate what to include from shared |
| `functions/package.json` | Add `files`, move dependency, add isolate-package | Configure isolation and dependencies |
| `functions/isolate.config.json` | Create new | Isolation settings |
| `firebase.json` | Update source path + predeploy | Point to isolated output for deployment |
| `functions/scripts/deploy.sh` | Simplify | Remove manual isolation (predeploy handles it) |
| `functions/.gitignore` | Add `/isolate` | Don't commit isolation artifacts |

## Build Workflow Comparison

### Before (current - fails on deploy)
```
Local Dev:
1. pnpm run serve
   → Build with esbuild
   → Start emulators (works - pnpm understands workspace:*)

Deployment:
1. Build shared package
2. Build functions with esbuild
3. firebase deploy
   → npm install in Cloud Build
   → ERROR: "Unsupported URL Type workspace:*"
```

### After (with isolate-package)
```
Local Dev:
1. pnpm run serve
   → Build with esbuild
   → Start emulators (unchanged - works perfectly)
   → No isolation needed for local dev

Deployment:
1. Build shared package
2. firebase deploy
   → Predeploy hook runs: cd functions && pnpm build && npx isolate
   → Creates functions/isolate/ with resolved dependencies
   → npm install in Cloud Build (from isolate/)
   → SUCCESS: Standard npm packages, no workspace: protocol
```

## Trade-offs and Considerations

### Pros
✅ Solves the workspace protocol error definitively
✅ Creates deterministic, reproducible deployments
✅ No bundling complexity - preserves file structure
✅ Works with Firebase's standard deployment process
✅ Maintains local development workflow (no changes to dev experience)
✅ Separation of concerns (dev uses source, deploy uses isolated)
✅ Can be automated in CI/CD

### Cons
⚠️ Adds ~5-10 seconds to deployment (isolation step)
⚠️ Requires discipline with `files` field in package.json (must list all needed files)
⚠️ Must build before isolating (already required in current setup)
⚠️ New developers need to understand isolation concept

### Alternatives Considered

**1. Bundling shared package into functions bundle**
- ❌ Loses source maps and debugging
- ❌ More complex build configuration
- ❌ Harder to debug in production

**2. Publishing shared package to npm registry**
- ❌ Extra overhead for private package
- ❌ Version management complexity
- ❌ Slower iteration cycle

**3. Using firebase-tools-with-isolate fork**
- ✅ More integrated workflow
- ⚠️ Fork maintenance risk
- ⚠️ More complex setup
- 💡 Can migrate to this later if needed

## Success Criteria

Deployment succeeds when:
1. ✅ `firebase deploy --only functions` completes without errors
2. ✅ No "EUNSUPPORTEDPROTOCOL" or workspace: related errors
3. ✅ Functions are visible and enabled in Firebase Console
4. ✅ Functions can be invoked successfully (test with Firebase Console or curl)
5. ✅ Shared package types and code are available at runtime (no import errors in logs)
6. ✅ Local emulator development still works (hot reloading intact)

## Troubleshooting

### Issue: Isolation fails with "No files included"
**Solution:** Check `files` field in package.json - ensure dist/ is included

### Issue: Shared package not found in isolated output
**Solution:** Ensure `@clementine/shared` is in dependencies (not devDependencies)

### Issue: Functions fail at runtime with import errors
**Solution:**
1. Check that shared package built successfully before isolation
2. Verify `packages/shared/dist/` contains compiled files
3. Check `functions/isolate/node_modules/@clementine/shared/` exists

### Issue: Local emulators stop working
**Solution:**
1. Run `firebase emulators:start` without predeploy (manual start)
2. Or temporarily change firebase.json source back to `functions` for testing
3. Predeploy hooks only run during deployment, not emulator start

### Debug Mode
Enable detailed logging:
```bash
cd functions
DEBUG_ISOLATE_CONFIG=true npx isolate
```

Or set in `isolate.config.json`:
```json
{
  "logLevel": "debug"
}
```

## Next Steps After Implementation

1. **Documentation**: Update project README with deployment process
2. **CI/CD**: Add automated deployment pipeline
3. **Monitoring**: Set up Firebase Functions monitoring and alerts
4. **Testing**: Add integration tests for deployed functions
5. **Team onboarding**: Document isolation concept for new developers

## References

- [isolate-package on GitHub](https://github.com/0x80/isolate-package)
- [Firebase deployment guide](https://github.com/0x80/isolate-package/blob/main/docs/firebase.md)
- [firebase-tools-with-isolate fork](https://github.com/0x80/firebase-tools-with-isolate)
