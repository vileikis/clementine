# Firebase Functions Isolation Implementation Checklist

## Phase 1: Pre-Implementation Setup

- [x] Review `ISOLATE_PLAN.md` completely
- [x] Ensure current code is committed to git (clean working tree)
- [x] Verify current build works: `pnpm --filter @clementine/shared build && pnpm --filter @clementine/functions build`
- [ ] Verify local emulators work: `pnpm functions:serve`

## Phase 2: Package Configuration

### Update Shared Package
- [x] Open `packages/shared/package.json`
- [x] Add `"files": ["dist/**/*", "package.json", "README.md"]`
- [x] Verify shared package builds: `cd packages/shared && pnpm build`
- [x] Commit changes: `git add packages/shared/package.json && git commit -m "Add files field to shared package for isolation"`

### Update Functions Package
- [x] Open `functions/package.json`
- [x] Add `"files": ["dist/**/*", "package.json"]`
- [x] Move `"@clementine/shared": "workspace:*"` from `devDependencies` to `dependencies`
- [x] Save and verify JSON is valid
- [x] Commit changes: `git add functions/package.json && git commit -m "Configure functions package for isolation"`

### Install isolate-package
- [x] Run `cd functions && pnpm add -D isolate-package`
- [x] Verify installation: `cd functions && pnpm list isolate-package`
- [x] Commit lockfile: `git add pnpm-lock.yaml && git commit -m "Add isolate-package dependency"`

## Phase 3: Isolation Configuration

### Create Isolation Config
- [x] ~~Create new file: `functions/isolate.config.json`~~ Created `functions/tsconfig.json` instead (required for isolate-package to detect build dir)
- [x] Add configuration with `outDir: "./dist"` in tsconfig.json
- [x] Save file
- [x] Commit: `git add functions/tsconfig.json && git commit -m "Restore proper tsconfig.json with correct outDir"`

### Update .gitignore
- [x] Open `functions/.gitignore`
- [x] Add `/isolate` to the file
- [x] Save file
- [x] Commit: `git add functions/.gitignore && git commit -m "Ignore isolation output directory"`

## Phase 4: Firebase Configuration

### Update firebase.json
- [x] Open root `firebase.json`
- [x] Change `"source": "functions"` to `"source": "functions/isolate"`
- [x] Add predeploy hook: `"predeploy": ["cd functions && pnpm build && npx isolate"]`
- [x] Remove `.deploy` from ignore list (if present)
- [x] Verify JSON is valid
- [x] Commit: `git add firebase.json && git commit -m "Configure Firebase to use isolated functions output"`

### Update Deployment Script
- [x] Open `functions/scripts/deploy.sh`
- [x] Simplify to:
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
- [x] Save file
- [x] Commit: `git add functions/scripts/deploy.sh && git commit -m "Simplify deployment script - predeploy handles isolation"`

## Phase 5: Local Testing

### Test Build
- [x] Build shared: `pnpm --filter @clementine/shared build`
- [x] Verify `packages/shared/dist/` contains files
- [x] Build functions: `pnpm --filter @clementine/functions build`
- [x] Verify `functions/dist/index.js` exists

### Test Isolation
- [x] Run isolation: `pnpm --filter @clementine/functions exec isolate` (note: requires tsconfig.json with outDir)
- [x] Check output: `ls -la functions/isolate/`
- [x] Verify `isolate/` contains:
  - [x] `dist/index.js`
  - [x] `package.json`
  - [x] `package-lock.json` (npm format)
- [x] Inspect `isolate/package.json`:
  - [x] Verify no `workspace:*` protocol (converted to `file:./packages/shared`)
  - [x] Verify `@clementine/shared` is listed properly
- [x] Check isolation log for errors

### Validate Isolated Package
- [x] `cd functions/isolate`
- [x] Run `npm install` (should work without errors)
- [x] Check `node_modules/@clementine/shared/` exists
- [x] Verify shared package contents: `ls -la node_modules/@clementine/shared/dist/`

### Test Local Emulators
- [x] Run `pnpm functions:serve` (from root)
- [x] Verify emulators start without errors
- [x] Check Functions emulator is running (port 5003)
- [x] Make a code change in `functions/src/`
- [x] ~~Verify hot reload still works~~ **Hot reload does NOT work** (expected limitation - see note below)
- [x] Stop emulators

**Note on Hot Reload:** The standard `isolate-package` approach does not support hot reload in emulators because firebase.json points to `functions/isolate/` (a static snapshot). To get hot reload working, you would need to use the [`firebase-tools-with-isolate` fork](https://github.com/0x80/firebase-tools-with-isolate) mentioned in ISOLATE_PLAN.md. For now, this limitation is acceptable - just rebuild and restart emulators when testing locally.

## Phase 6: Deployment Testing

### Pre-Deployment Checks
- [ ] Ensure Firebase CLI is authenticated: `firebase login`
- [ ] Verify Firebase project: `firebase projects:list`
- [ ] Check current project: `firebase use`
- [ ] Ensure project is `clementine-7568d`: `firebase use clementine-7568d`

### First Deployment Attempt
- [ ] Run: `pnpm functions:deploy`
- [ ] Watch for predeploy hook execution:
  - [ ] Shared package build
  - [ ] Functions build with esbuild
  - [ ] Isolation runs (`npx isolate`)
- [ ] Monitor Cloud Build logs for errors
- [ ] Check for "EUNSUPPORTEDPROTOCOL" error (should NOT appear)

### Deployment Success Validation
- [ ] Deployment completes without errors
- [ ] Open Firebase Console: https://console.firebase.google.com/project/clementine-7568d/functions
- [ ] Verify functions are listed
- [ ] Check function status (should be "Active")
- [ ] Note deployed function names and URLs

### Runtime Validation
- [ ] Test function invocation (via Firebase Console or curl)
- [ ] Check function logs: `firebase functions:log`
- [ ] Verify no import/module errors
- [ ] Confirm shared package code is accessible at runtime
- [ ] Test with real data if applicable

## Phase 7: Post-Deployment Cleanup

### Documentation
- [ ] Update project README with deployment notes
- [ ] Document isolation requirement for new developers
- [ ] Add troubleshooting notes if any issues occurred

### Cleanup
- [ ] Remove old `.deploy/` directory if present: `rm -rf functions/.deploy`
- [ ] Clean isolation artifacts locally: `rm -rf functions/isolate`
- [ ] Verify `.gitignore` prevents committing `functions/isolate/`

### Verification
- [ ] Test deployment one more time: `pnpm functions:deploy`
- [ ] Verify it works consistently
- [ ] Test local emulators still work: `pnpm functions:serve`

## Phase 8: Team Communication

- [ ] Document changes in team chat/Slack/etc.
- [ ] Update deployment documentation
- [ ] Share this checklist with team
- [ ] Schedule knowledge transfer session if needed

## Rollback Plan (If Needed)

If deployment fails and you need to rollback:

- [ ] Revert firebase.json changes: `git checkout HEAD -- firebase.json`
- [ ] Revert functions/package.json: `git checkout HEAD -- functions/package.json`
- [ ] Revert packages/shared/package.json: `git checkout HEAD -- packages/shared/package.json`
- [ ] Remove isolate config: `rm functions/isolate.config.json`
- [ ] Rebuild and test: `pnpm build`
- [ ] Test deployment with old setup

## Success Criteria

Implementation is complete when:

- [x] ✅ All configuration files updated
- [x] ✅ Isolation runs successfully locally
- [ ] ⏳ `firebase deploy` completes without "EUNSUPPORTEDPROTOCOL" error (ready to test)
- [ ] ⏳ Functions are active in Firebase Console (ready to test)
- [ ] ⏳ Functions can be invoked successfully (ready to test)
- [ ] ⏳ Shared package code works at runtime (ready to test)
- [x] ✅ Local emulators work (⚠️ hot reload does NOT work - expected limitation)
- [ ] 📝 Team is informed and documentation updated (pending deployment test)

## Troubleshooting Reference

If issues occur, refer to the Troubleshooting section in `ISOLATE_PLAN.md`:
- Issue: Isolation fails with "No files included"
- Issue: Shared package not found in isolated output
- Issue: Functions fail at runtime with import errors
- Issue: Local emulators stop working

Enable debug mode if needed:
```bash
cd functions
DEBUG_ISOLATE_CONFIG=true npx isolate
```

Or update `isolate.config.json`:
```json
{
  "logLevel": "debug"
}
```

## Notes

- This is a one-time setup process
- Once complete, the workflow is: build → isolate (automatic via predeploy) → deploy
- Local development workflow remains unchanged
- Isolation only happens during deployment, not during local dev
