# Quick-Start Guide: Preview Shell Module Migration

**Feature**: Preview Shell Module Migration
**Audience**: Developers implementing this migration
**Estimated Time**: 2-3 hours

## Overview

This guide provides step-by-step instructions for migrating the preview-shell module from the Next.js app to TanStack Start and creating the dev-tools testing interface.

---

## Prerequisites

Before starting:
- ✅ TanStack Start app is set up at `/apps/clementine-app/`
- ✅ Development environment is working (`pnpm dev` runs without errors)
- ✅ You have read access to Next.js source at `/web/src/features/preview-shell/`
- ✅ You have write access to TanStack Start source

---

## Step-by-Step Migration

### Step 1: Install Zustand Dependency

**Command**:
```bash
# From monorepo root
pnpm add zustand --filter @clementine/app
```

**Verify Installation**:
```bash
# Check package.json
cat apps/clementine-app/package.json | grep zustand
# Should output: "zustand": "^5.0.9"  (or higher)
```

**Why**: Zustand is required for the viewport store with localStorage persistence.

---

### Step 2: Copy Module Files

**Source**: `/web/src/features/preview-shell/`
**Target**: `/apps/clementine-app/src/shared/preview-shell/`

**Commands**:
```bash
# From monorepo root
cd apps/clementine-app/src/shared

# Copy entire preview-shell directory
cp -r ../../../../web/src/features/preview-shell ./preview-shell

# Verify structure
tree preview-shell
```

**Expected Structure**:
```
preview-shell/
├── index.ts
├── components/
│   ├── index.ts
│   ├── PreviewShell.tsx
│   ├── DeviceFrame.tsx
│   ├── ViewportSwitcher.tsx
│   ├── FullscreenOverlay.tsx
│   └── FullscreenTrigger.tsx
├── hooks/
│   ├── index.ts
│   ├── useViewport.ts
│   └── useFullscreen.ts
├── context/
│   ├── index.ts
│   └── ViewportContext.tsx
├── store/
│   ├── index.ts
│   └── viewportStore.ts
├── types/
│   ├── index.ts
│   └── preview-shell.types.ts
└── constants/
    ├── index.ts
    └── viewport.constants.ts
```

---

### Step 3: Update Import Paths

**Files Affected**:
- `components/PreviewShell.tsx`
- `components/DeviceFrame.tsx`
- `components/ViewportSwitcher.tsx`
- `components/FullscreenOverlay.tsx`
- `components/FullscreenTrigger.tsx`

**Find-and-Replace**:

| Find | Replace |
|------|---------|
| `from "@/lib/utils"` | `from "@/shared/utils"` |
| `from "@/components/ui/button"` | `from "@/ui-kit/components/button"` |

**Manual Check**:
Open each file and verify:
1. `cn` utility imports from `@/shared/utils`
2. `Button` component imports from `@/ui-kit/components/button`
3. All internal imports (within preview-shell) use relative paths (no changes needed)

**Example**:
```typescript
// Before (Next.js)
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// After (TanStack Start)
import { cn } from "@/shared/utils";
import { Button } from "@/ui-kit/components/button";
```

---

### Step 4: Update Shared Barrel Export

**File**: `/apps/clementine-app/src/shared/index.ts`

**Add Export**:
```typescript
// Preview Shell (device viewport simulation infrastructure)
export * from "./preview-shell";
```

**Verify**:
```typescript
// Should be able to import from @/shared
import { PreviewShell, useViewport } from "@/shared";
```

---

### Step 5: Create Dev-Tools Route File

**File**: `/apps/clementine-app/app/admin/dev-tools/preview-shell.tsx`

**Content**:
```typescript
import { createFileRoute } from "@tanstack/react-router";
import { DevToolsPreviewShell } from "@/domains/dev-tools/preview-shell";

export const Route = createFileRoute("/admin/dev-tools/preview-shell")({
  component: DevToolsPreviewShell,
});
```

**Why**: TanStack Router uses file-based routing. File path `/app/admin/dev-tools/preview-shell.tsx` creates route at `/admin/dev-tools/preview-shell`. The route imports the container component from the domain.

---

### Step 6: Create Dev-Tools Domain Components

**Directory**: `/apps/clementine-app/src/domains/dev-tools/preview-shell/`

**Files to Create**:

#### 6.1: Container Component (`DevToolsPreviewShell.tsx`)

```typescript
"use client";

import { useState } from "react";
import type { ViewportMode } from "@/shared/preview-shell";
import { PropControlsPanel } from "./components/PropControlsPanel";
import { PreviewArea } from "./components/PreviewArea";

export function DevToolsPreviewShell() {
  const [config, setConfig] = useState({
    enableViewportSwitcher: true,
    enableFullscreen: true,
    defaultViewport: "mobile" as ViewportMode,
  });
  const [remountKey, setRemountKey] = useState(0);

  const handleReset = () => {
    setConfig({
      enableViewportSwitcher: true,
      enableFullscreen: true,
      defaultViewport: "mobile",
    });
    setRemountKey((k) => k + 1);
  };

  return (
    <div className="flex h-screen bg-background">
      <PropControlsPanel
        config={config}
        onConfigChange={setConfig}
        onReset={handleReset}
      />
      <PreviewArea key={remountKey} config={config} />
    </div>
  );
}
```

#### 6.2: Prop Controls Panel (`components/PropControlsPanel.tsx`)

```typescript
"use client";

import { Button } from "@/ui-kit/components/button";
import { Switch } from "@/ui-kit/components/switch";
import { Label } from "@/ui-kit/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui-kit/components/select";
import type { ViewportMode } from "@/shared/preview-shell";

interface PropControlsPanelProps {
  config: {
    enableViewportSwitcher: boolean;
    enableFullscreen: boolean;
    defaultViewport: ViewportMode;
  };
  onConfigChange: (config: any) => void;
  onReset: () => void;
}

export function PropControlsPanel({
  config,
  onConfigChange,
  onReset,
}: PropControlsPanelProps) {
  return (
    <div className="w-1/4 border-r p-6 space-y-6">
      <h2 className="text-xl font-semibold">Prop Controls</h2>

      <div className="space-y-4">
        {/* enableViewportSwitcher */}
        <div className="flex items-center justify-between">
          <Label htmlFor="viewport-switcher">Enable Viewport Switcher</Label>
          <Switch
            id="viewport-switcher"
            checked={config.enableViewportSwitcher}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, enableViewportSwitcher: checked })
            }
          />
        </div>

        {/* enableFullscreen */}
        <div className="flex items-center justify-between">
          <Label htmlFor="fullscreen">Enable Fullscreen</Label>
          <Switch
            id="fullscreen"
            checked={config.enableFullscreen}
            onCheckedChange={(checked) =>
              onConfigChange({ ...config, enableFullscreen: checked })
            }
          />
        </div>

        {/* defaultViewport */}
        <div className="space-y-2">
          <Label htmlFor="default-viewport">Default Viewport</Label>
          <Select
            value={config.defaultViewport}
            onValueChange={(value) =>
              onConfigChange({ ...config, defaultViewport: value as ViewportMode })
            }
          >
            <SelectTrigger id="default-viewport">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <Button onClick={onReset} variant="outline" className="w-full">
          Reset & Remount
        </Button>
      </div>
    </div>
  );
}
```

#### 6.3: Preview Area (`components/PreviewArea.tsx`)

```typescript
"use client";

import { PreviewShell } from "@/shared/preview-shell";
import type { ViewportMode } from "@/shared/preview-shell";

interface PreviewAreaProps {
  config: {
    enableViewportSwitcher: boolean;
    enableFullscreen: boolean;
    defaultViewport: ViewportMode;
  };
}

export function PreviewArea({ config }: PreviewAreaProps) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <PreviewShell
        enableViewportSwitcher={config.enableViewportSwitcher}
        enableFullscreen={config.enableFullscreen}
      >
        {/* Sample Content */}
        <div className="p-8 space-y-6">
          <h1 className="text-3xl font-bold">Preview Shell Test</h1>
          <p className="text-muted-foreground">
            This is a sample content area for testing the PreviewShell component.
            Try toggling viewport modes and fullscreen to see how it works.
          </p>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Test Card 1</h3>
              <p className="text-sm text-muted-foreground">
                Sample card content to demonstrate viewport scaling.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Test Card 2</h3>
              <p className="text-sm text-muted-foreground">
                Another card to show how content adapts to different viewports.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
              Test Button 1
            </button>
            <button className="px-4 py-2 border rounded">Test Button 2</button>
          </div>
        </div>
      </PreviewShell>
    </div>
  );
}
```

#### 6.4: Barrel Exports (`index.ts`, `components/index.ts`)

**`/domains/dev-tools/preview-shell/index.ts`**:
```typescript
export { DevToolsPreviewShell } from "./DevToolsPreviewShell";
```

**`/domains/dev-tools/preview-shell/components/index.ts`**:
```typescript
export { PropControlsPanel } from "./PropControlsPanel";
export { PreviewArea } from "./PreviewArea";
```

---

### Step 7: Run Validation Gates

**Commands**:
```bash
# From monorepo root
cd apps/clementine-app

# Auto-fix format and lint
pnpm check

# Type-check (must pass with zero errors)
pnpm type-check

# Start dev server
pnpm dev
```

**Manual Checks**:
1. Dev server starts without errors
2. Navigate to `http://localhost:3000/admin/dev-tools/preview-shell`
3. Page loads within 2 seconds
4. No console errors

---

### Step 8: Manual Testing

**Test Scenarios**:

| Test | Action | Expected Result |
|------|--------|-----------------|
| **Viewport Switching** | Click mobile/desktop icons | Preview transitions between 375x667px and 900x600px |
| **Fullscreen Activation** | Click fullscreen trigger | Overlay covers entire viewport with header |
| **Fullscreen Exit (Button)** | Click X in fullscreen header | Overlay closes, returns to normal view |
| **Fullscreen Exit (Keyboard)** | Press Escape key | Overlay closes immediately |
| **Prop Toggle (Switcher)** | Toggle "Enable Viewport Switcher" | Switcher buttons appear/disappear |
| **Prop Toggle (Fullscreen)** | Toggle "Enable Fullscreen" | Fullscreen trigger appears/disappears |
| **Default Viewport** | Change default to "desktop" | Component remounts with desktop viewport |
| **Reset & Remount** | Click reset button | All props reset to defaults, component remounts |
| **localStorage Persistence** | Change viewport, refresh page | Selected viewport persists after refresh |

**Expected Behavior**:
- ✅ All UI interactions respond within 100ms
- ✅ No visual glitches or layout shifts
- ✅ Viewport mode persists across page refreshes
- ✅ No console errors or warnings

---

### Step 9: Standards Compliance Review

**Review Checklist**:

#### Design System (`frontend/design-system.md`)
- [ ] No hard-coded colors (use theme tokens: `bg-background`, `text-foreground`, etc.)
- [ ] Paired background/foreground colors (e.g., `bg-primary` + `text-primary-foreground`)
- [ ] Consistent spacing (use `space-*` or `gap-*` utilities)

#### Component Libraries (`frontend/component-libraries.md`)
- [ ] Using shadcn/ui components (Button, Switch, Select, Label)
- [ ] No direct Tailwind classes on shadcn components (use `className` prop)
- [ ] Accessibility preserved (ARIA labels, keyboard navigation)

#### Project Structure (`global/project-structure.md`)
- [ ] Barrel exports at all levels (`index.ts` in all directories)
- [ ] Shared module in `/shared/` (preview-shell)
- [ ] Domain-specific code in `/domains/` (dev-tools)
- [ ] Route file follows TanStack Router convention

#### Code Quality (`global/code-quality.md`)
- [ ] TypeScript strict mode passes (zero `any` types)
- [ ] ESLint passes (zero warnings/errors)
- [ ] Prettier formatting applied
- [ ] No dead code or commented-out sections

#### Accessibility (`frontend/accessibility.md`)
- [ ] Touch targets ≥ 44x44px (viewport switcher buttons)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Focus states visible

---

## Troubleshooting

### Issue: TypeScript Error "Cannot find module '@/shared/utils'"

**Cause**: Path alias not configured in tsconfig.json

**Fix**: Verify `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### Issue: Zustand store not persisting to localStorage

**Cause**: SSR hydration mismatch or localStorage blocked

**Fix**:
1. Check browser localStorage is enabled (not in private mode)
2. Verify "use client" directive on `viewportStore.ts`
3. Check browser console for hydration errors

---

### Issue: Dev-tools route 404 (not found)

**Cause**: Route file not in correct location or incorrect naming

**Fix**: Verify file path is exactly:
```
/apps/clementine-app/app/admin/dev-tools/preview-shell.tsx
```

TanStack Router uses directory structure for nested routes:
- `/app/admin/dev-tools/preview-shell.tsx` → `/admin/dev-tools/preview-shell`

---

### Issue: Import error for shadcn components (Switch, Select, Label)

**Cause**: Components not yet installed in TanStack Start app

**Fix**: Install missing shadcn components:
```bash
# From apps/clementine-app/
npx shadcn@latest add switch
npx shadcn@latest add select
npx shadcn@latest add label
```

---

## Verification Checklist

Before marking migration complete:

- [ ] ✅ Zustand dependency installed (`pnpm list zustand` shows version)
- [ ] ✅ All 15 files copied to `/shared/preview-shell/`
- [ ] ✅ Import paths updated (cn, Button)
- [ ] ✅ Barrel export in `/shared/index.ts` added
- [ ] ✅ Dev-tools route file created
- [ ] ✅ Dev-tools components created (PropControlsPanel, PreviewArea)
- [ ] ✅ `pnpm check` passes (format + lint)
- [ ] ✅ `pnpm type-check` passes (zero errors)
- [ ] ✅ Dev server runs without errors
- [ ] ✅ Dev-tools page loads at `/admin/dev-tools/preview-shell`
- [ ] ✅ All manual test scenarios pass
- [ ] ✅ localStorage persistence works (refresh page test)
- [ ] ✅ Standards compliance review complete

---

## Next Steps

After migration is complete:

1. **Document migration**: Add notes to migration log
2. **Update consumers**: Migrate features that use preview-shell (theme editor, experience editor, etc.)
3. **Create PR**: Use `/pr` skill to create pull request
4. **Code review**: Get team review before merging

---

## Estimated Time Breakdown

| Step | Estimated Time |
|------|----------------|
| Install zustand | 2 minutes |
| Copy module files | 5 minutes |
| Update import paths | 10 minutes |
| Update barrel exports | 2 minutes |
| Create dev-tools route | 5 minutes |
| Create dev-tools components | 30 minutes |
| Run validation gates | 5 minutes |
| Manual testing | 20 minutes |
| Standards review | 10 minutes |
| **Total** | **~90 minutes** |

**Note**: Time may vary based on familiarity with codebase and tools.

---

## Resources

- **Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Zustand Docs**: https://zustand.docs.pmnd.rs/
- **TanStack Router Docs**: https://tanstack.com/router/latest/docs
- **shadcn/ui Docs**: https://ui.shadcn.com/
