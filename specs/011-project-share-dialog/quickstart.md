# Quickstart Guide: Project Share Dialog

**Feature**: 011-project-share-dialog
**For**: Developers implementing this feature
**Time to Read**: 5 minutes

## Overview

Add a share dialog to project pages that lets users copy a guest link and download QR codes for their project. Everything runs client-side - no server processing.

**User Flow**:
1. User clicks "Share" button in top nav on project page
2. Dialog opens showing guest URL and QR code
3. User clicks "Copy Link" → URL copied to clipboard
4. User clicks "Download QR Code" → PNG image downloads
5. User clicks "Regenerate QR Code" → new visual pattern (same URL)

**Key Features**:
- ✅ One-click link copying
- ✅ Client-side QR code generation
- ✅ Download QR as 512x512 PNG
- ✅ QR regeneration (different visual patterns)
- ✅ Mobile-responsive
- ✅ Help instructions included

---

## Prerequisites

### Dependencies to Install

```bash
# From monorepo root
pnpm add react-qr-code --filter @clementine/app
```

**That's it!** Everything else uses existing libraries.

### Files to Read First

1. **Research**: `specs/011-project-share-dialog/research.md` - Technical decisions
2. **Data Model**: `specs/011-project-share-dialog/data-model.md` - Types and validation
3. **Standards**:
   - `apps/clementine-app/standards/frontend/design-system.md` - Theme tokens
   - `apps/clementine-app/standards/frontend/component-libraries.md` - shadcn/ui patterns
   - `apps/clementine-app/standards/global/project-structure.md` - Vertical slice architecture

---

## Implementation Checklist

### Phase 1: Create Domain Structure

```bash
# From apps/clementine-app/src/
mkdir -p domains/project/share/{components,hooks,utils}
touch domains/project/share/{types.ts,index.ts}
```

**Files to create**:
- `types.ts` - TypeScript interfaces (see data-model.md)
- `index.ts` - Barrel exports (components and hooks only)

### Phase 2: Implement Utilities (No Dependencies)

**Create `utils/validation.ts`** (see data-model.md for full code):
```typescript
import { z } from 'zod';

export const projectIdSchema = z
  .string()
  .min(1)
  .max(1500)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const guestUrlSchema = z
  .string()
  .url()
  .startsWith('https://');

export function validateProjectId(id: string) {
  return projectIdSchema.parse(id);
}

export function validateGuestUrl(url: string) {
  return guestUrlSchema.parse(url);
}
```

**Create `utils/shareUrl.utils.ts`**:
```typescript
import { validateProjectId, validateGuestUrl } from './validation';

export function generateGuestUrl(projectId: string): string {
  const validatedId = validateProjectId(projectId);
  const origin = window.location.origin;
  const url = `${origin}/guest/${validatedId}`;
  return validateGuestUrl(url);
}
```

**Test utilities**:
```bash
pnpm test domains/project/share/utils
```

### Phase 3: Implement Hooks

**Create `hooks/useCopyToClipboard.tsx`** (see research.md for fallback logic):
```typescript
import { useState } from 'react';
import { toast } from 'sonner';

export function useCopyToClipboard() {
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = async (text: string) => {
    setIsCopying(true);
    try {
      // Try modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers (see research.md)
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!success) throw new Error('execCommand failed');
      }

      setCopySuccess(true);
      toast.success('Link copied to clipboard');
      return true;
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy link');
      return false;
    } finally {
      setIsCopying(false);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  return { copyToClipboard, isCopying, copySuccess };
}
```

**Create `hooks/useQRCodeGenerator.tsx`**:
```typescript
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

export function useQRCodeGenerator(guestUrl: string) {
  const [qrSeed, setQrSeed] = useState(Date.now());
  const [isDownloading, setIsDownloading] = useState(false);

  const qrOptions = useMemo(
    () => ({
      value: guestUrl,
      size: 512,
      level: 'M' as const,
      seed: qrSeed,
    }),
    [guestUrl, qrSeed]
  );

  const regenerateQRCode = () => {
    setQrSeed(Date.now());
    toast.success('QR code regenerated');
  };

  const downloadQRCode = async () => {
    setIsDownloading(true);
    try {
      // Get SVG element (rendered by react-qr-code)
      const svgElement = document.querySelector<SVGElement>('[data-qr-code]');
      if (!svgElement) throw new Error('QR code not found');

      // Convert SVG to PNG (see research.md for full implementation)
      const dataUrl = await convertSvgToPng(svgElement, 512, 512);

      // Trigger download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qr-code-${Date.now()}.png`;
      link.click();

      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download QR code');
    } finally {
      setIsDownloading(false);
    }
  };

  return { qrOptions, regenerateQRCode, downloadQRCode, isDownloading };
}
```

**Test hooks**:
```bash
pnpm test domains/project/share/hooks
```

### Phase 4: Implement Components

**Create `components/ShareLinkSection.tsx`**:
```typescript
import { Button } from '@/ui-kit/components/button';
import { Copy, Check } from 'lucide-react';

interface ShareLinkSectionProps {
  guestUrl: string;
  onCopy: () => void;
  copySuccess: boolean;
}

export function ShareLinkSection({ guestUrl, onCopy, copySuccess }: ShareLinkSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Guest Link</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={guestUrl}
          readOnly
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <Button onClick={onCopy} variant="default" size="sm">
          {copySuccess ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span className="hidden sm:inline ml-2">
            {copySuccess ? 'Copied!' : 'Copy Link'}
          </span>
        </Button>
      </div>
    </div>
  );
}
```

**Create `components/QRCodeDisplay.tsx`**:
```typescript
import { QRCodeSVG } from 'react-qr-code';
import { Button } from '@/ui-kit/components/button';
import { RefreshCw, Download } from 'lucide-react';

interface QRCodeDisplayProps {
  guestUrl: string;
  size: number;
  onRegenerate: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}

export function QRCodeDisplay({
  guestUrl,
  size,
  onRegenerate,
  onDownload,
  isDownloading,
}: QRCodeDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <QRCodeSVG
          value={guestUrl}
          size={size}
          level="M"
          data-qr-code
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onRegenerate} variant="outline" className="flex-1">
          <RefreshCw className="size-4" />
          <span className="ml-2">Regenerate</span>
        </Button>
        <Button onClick={onDownload} variant="outline" className="flex-1" disabled={isDownloading}>
          <Download className="size-4" />
          <span className="ml-2">{isDownloading ? 'Downloading...' : 'Download'}</span>
        </Button>
      </div>
    </div>
  );
}
```

**Create `components/ShareDialog.tsx`**:
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/ui-kit/components/dialog';
import { ShareLinkSection } from './ShareLinkSection';
import { QRCodeDisplay } from './QRCodeDisplay';
import { generateGuestUrl } from '../utils/shareUrl.utils';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useQRCodeGenerator } from '../hooks/useQRCodeGenerator';
import { useMemo } from 'react';

interface ShareDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ projectId, open, onOpenChange }: ShareDialogProps) {
  const guestUrl = useMemo(() => generateGuestUrl(projectId), [projectId]);
  const { copyToClipboard, copySuccess } = useCopyToClipboard();
  const { regenerateQRCode, downloadQRCode, isDownloading } = useQRCodeGenerator(guestUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Share this project with guests at your event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <ShareLinkSection
            guestUrl={guestUrl}
            onCopy={() => copyToClipboard(guestUrl)}
            copySuccess={copySuccess}
          />

          <QRCodeDisplay
            guestUrl={guestUrl}
            size={256}
            onRegenerate={regenerateQRCode}
            onDownload={downloadQRCode}
            isDownloading={isDownloading}
          />

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">How to use:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Share the URL via email, SMS, or social media</li>
              <li>Display the QR code at your event for guests to scan</li>
              <li>Download the QR code to print or add to promotional materials</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Create `index.ts`** (barrel export):
```typescript
export { ShareDialog } from './components/ShareDialog';
export type { ShareDialogProps } from './components/ShareDialog';
```

**Test components**:
```bash
pnpm test domains/project/share/components
```

### Phase 5: Integrate with Project Route

**Update `app/workspace/$workspaceSlug.projects/$projectId.tsx`**:
```typescript
import { ShareDialog } from '@/domains/project/share';
import { Share } from 'lucide-react';
import { useState } from 'react';

// ... existing imports and component code

export default function ProjectDetailsPage() {
  const params = Route.useParams();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Add Share button to TopNavActions
  const actions = [
    // ... existing actions
    {
      icon: Share,
      label: 'Share',
      ariaLabel: 'Share project with guests',
      variant: 'default' as const,
      onClick: () => setShareDialogOpen(true),
    },
  ];

  return (
    <>
      <TopNavBar
        breadcrumb={/* ... */}
        actions={actions}
      />

      {/* ... existing page content */}

      <ShareDialog
        projectId={params.projectId}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  );
}
```

---

## Testing Guide

### Unit Tests

```bash
# Test utilities
pnpm test domains/project/share/utils

# Test hooks
pnpm test domains/project/share/hooks

# Test components
pnpm test domains/project/share/components
```

### Manual Testing

1. **Start dev server**: `pnpm dev` (port 3000)
2. **Navigate to**: `http://localhost:3000/workspace/{slug}/projects/{projectId}`
3. **Click Share button** in top nav
4. **Verify**:
   - Dialog opens
   - Guest URL is displayed correctly
   - Copy button copies to clipboard
   - QR code is visible
   - Regenerate creates new QR code
   - Download triggers PNG download
   - Help instructions are visible

### Mobile Testing

1. **Open Chrome DevTools** (F12)
2. **Toggle device toolbar** (Ctrl+Shift+M)
3. **Select iPhone SE** (320px width)
4. **Verify**:
   - Dialog fits screen
   - Buttons are tappable (44x44px minimum)
   - QR code scales appropriately
   - Text is readable without horizontal scroll

---

## Validation Checklist

### Before Committing

Run validation loop:
```bash
cd apps/clementine-app
pnpm check  # Auto-fixes format and lint
pnpm type-check  # TypeScript validation
pnpm test  # Run all tests
```

### Standards Compliance

- [ ] **Design System**: No hard-coded colors? Using theme tokens?
- [ ] **Component Libraries**: Using shadcn/ui Dialog correctly?
- [ ] **Project Structure**: Vertical slice with barrel exports?
- [ ] **Code Quality**: Clean, simple, well-named functions?
- [ ] **Security**: Input validated with Zod?
- [ ] **Accessibility**: Buttons have aria-labels?
- [ ] **Mobile-First**: Tested on 320px viewport?

---

## Common Issues & Solutions

### Issue: QR code not rendering

**Solution**: Check that `react-qr-code` is installed:
```bash
pnpm list react-qr-code --filter @clementine/app
```

### Issue: Copy to clipboard fails

**Solution**: Ensure you're on HTTPS (or localhost). Clipboard API requires secure context.

### Issue: Download not working

**Solution**: Check browser console for errors. Ensure SVG element has `data-qr-code` attribute.

### Issue: TypeScript errors

**Solution**: Ensure all types are imported from `types.ts`:
```typescript
import type { ShareDialogProps } from '../types';
```

---

## Performance Tips

1. **Lazy load QR library** (optional optimization):
   ```typescript
   const QRCodeDisplay = React.lazy(() => import('./QRCodeDisplay'));
   ```

2. **Memoize guest URL**:
   ```typescript
   const guestUrl = useMemo(() => generateGuestUrl(projectId), [projectId]);
   ```

3. **Debounce regenerate button** (prevent spam):
   ```typescript
   const regenerate = useDebouncedCallback(regenerateQRCode, 500);
   ```

---

## Next Steps

After implementation:

1. **Run `/speckit.tasks`** - Generate task breakdown
2. **Implement tasks** - Follow generated task list
3. **Write tests** - Achieve 70%+ coverage
4. **Manual QA** - Test on real devices
5. **Create PR** - Reference spec and plan in description

---

## Resources

- **Feature Spec**: `specs/011-project-share-dialog/spec.md`
- **Research**: `specs/011-project-share-dialog/research.md`
- **Data Model**: `specs/011-project-share-dialog/data-model.md`
- **Contracts**: `specs/011-project-share-dialog/contracts/README.md`
- **react-qr-code Docs**: https://www.npmjs.com/package/react-qr-code
- **shadcn/ui Dialog**: https://ui.shadcn.com/docs/components/dialog

---

## Estimated Time

- **Utilities**: 30 minutes
- **Hooks**: 1 hour
- **Components**: 2 hours
- **Integration**: 30 minutes
- **Testing**: 1 hour
- **Total**: ~5 hours

**Ready to implement!** Start with Phase 1 (domain structure) and work sequentially through Phase 5.
