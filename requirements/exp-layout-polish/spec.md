# Experience Layout Polish - Specification

## Problem Statement

Mobile scrolling behavior is broken across guest-facing experience pages. The current architecture has the scroll container in the wrong place, causing:

1. **TopBar scrolls with content** - Should stay static at top
2. **Background appears to scroll** - Background should be static
3. **Inconsistent patterns** - `WelcomeScreen` embeds `ThemedBackground` inside renderer, while other pages own it at container level

## Root Cause Analysis

### Current Layout Hierarchy (Broken)

```
ExperiencePage/PregatePage/PresharePage:
├── ThemeProvider
└── div.h-screen
    └── ThemedBackground (overflow-auto HERE - WRONG)
        └── ExperienceRuntime
            ├── RuntimeTopBar (scrolls with content because inside scroll wrapper!)
            └── div.pt-20
                └── GuestRuntimeContent
                    └── StepLayout (fixed bottom buttons work, but content scroll broken)
```

**Issue**: `ThemedBackground:96` has `overflow-auto` on its inner wrapper, making EVERYTHING scroll together including the TopBar.

### WelcomeScreen Inconsistency

```
WelcomeScreen:
└── div.h-screen
    └── ThemeProvider
        └── WelcomeRenderer
            └── ThemedBackground (embedded - inconsistent with other pages)
```

Other pages (`SharePage`, `ExperiencePage`, etc.) own `ThemedBackground` at the container level, but `WelcomeRenderer` embeds it internally.

## Target Architecture

### Design Principles

1. **Container owns background** - Guest page containers own `ThemedBackground`
2. **Scoped scroll containers** - Scroll boundary wraps ONLY the content that should scroll
3. **Static TopBar via flex layout** - TopBar stays outside scroll container, never scrolls
4. **Background is static** - Background layer never moves
5. **No height calculations** - Use flexbox to distribute space naturally
6. **Renderers own their scroll** - Each content renderer handles its own scroll behavior

### Target Layout Hierarchy

```
GuestPage (e.g., ExperiencePage):
├── ThemeProvider
└── div.h-screen
    └── ThemedBackground (NO overflow - just background + flex container)
        ├── Background layers (absolute, static)
        └── Content wrapper (relative, flex-1, flex-col, NO overflow)
            └── ExperienceRuntime (flex-1, flex-col)
                ├── RuntimeTopBar (static, shrink-0) ← outside scroll = never scrolls
                └── Content area (flex-1, overflow-y-auto) ← ONLY this scrolls
                    └── StepLayout / Renderer content
```

**Key insight**: The scroll container wraps ONLY the content area, not the TopBar. Flexbox handles height distribution naturally - no calculations needed.

### Scroll Handling Strategy

Different page types handle scroll differently based on their structure:

| Page Type | Has TopBar? | Who handles scroll? | Rationale |
|-----------|-------------|---------------------|-----------|
| Experience pages | Yes | `ExperienceRuntime` | Needs to exclude TopBar from scroll |
| WelcomeScreen | No | `WelcomeRenderer` | No fixed elements, renderer is self-contained |
| SharePage | No | `ShareReadyRenderer` / `ShareLoadingRenderer` | No fixed elements, renderers are self-contained |

**Pattern**:
- Pages WITH fixed elements (TopBar) → Container creates scroll wrapper to exclude fixed elements
- Pages WITHOUT fixed elements → Renderer handles its own scroll (self-contained)

This keeps `ThemedBackground` simple (just background + max-width) while each renderer is responsible for its own layout behavior.

## Affected Components

### 1. ThemedBackground (shared/theming)

**Current**: Has `overflow-auto` on inner position wrapper (line 96)
**Change**: Remove `overflow-auto`, keep `max-w-3xl` and `contentClassName` support

```tsx
// BEFORE (line 96)
<div className="relative z-10 flex flex-1 flex-col items-center overflow-auto px-4 py-8">
  <div className={cn('w-full max-w-3xl my-auto', contentClassName)}>
    {children}
  </div>
</div>

// AFTER
<div className="relative z-10 flex flex-1 flex-col items-center">  {/* removed overflow-auto, px-4, py-8 */}
  <div className={cn('w-full max-w-3xl', contentClassName)}>  {/* keep max-w-3xl, remove my-auto */}
    {children}
  </div>
</div>
```

**What stays**:
- `contentClassName` prop - for consumer flexibility
- `max-w-3xl` constraint - keeps content readable
- `items-center` - centers the max-width container

**What's removed**:
- `overflow-auto` - children handle their own scroll
- `px-4 py-8` - children handle their own padding
- `my-auto` - children handle their own vertical positioning

**Impact**: All consumers need to handle their own scrolling and internal padding/layout

### 2. RuntimeTopBar (experience/runtime)

**Current**: Uses `w-full z-50` with relative positioning
**Change**: No positioning changes needed! Add `shrink-0` to prevent compression

```tsx
// BEFORE
<div className={cn('w-full z-50', 'flex flex-col', 'px-4 pt-4 pb-3', className)}>

// AFTER
<div className={cn('w-full z-50 shrink-0', 'flex flex-col', 'px-4 pt-4 pb-3', className)}>
```

TopBar stays static - it won't scroll because it's OUTSIDE the scroll container (handled by ExperienceRuntime structure).

### 3. ExperienceRuntime (experience/runtime/containers)

**Current**: Fragment wrapper with TopBar and children side by side
**Change**: Use flex column layout with scroll container around children only

```tsx
// BEFORE
return (
  <>
    {showTopBar && <RuntimeTopBar ... />}
    {children}
  </>
)

// AFTER
return (
  <div className="flex h-full flex-col">
    {showTopBar && <RuntimeTopBar ... />}
    <div className="flex-1 overflow-y-auto">
      {children}
    </div>
  </div>
)
```

**Key**: The `overflow-y-auto` wrapper goes around `{children}` only, not around TopBar.

### 4. StepLayout (experience/steps/renderers)

**Current**: Uses `h-full` and expects parent scroll context
**Change**: Minimal changes - verify it works within new scroll container

The content area may need adjustment for centering now that ThemedBackground doesn't center:

```tsx
// May need to add centering that was previously in ThemedBackground
<div className={cn(
  'flex flex-1 flex-col items-center',
  'px-4',  // padding previously from ThemedBackground
  // ... rest
)}>
```

### 5. WelcomeRenderer (project-config/welcome)

**Current**: Embeds `ThemedBackground` internally
**Change**: Remove `ThemedBackground`, handle own scroll

```tsx
// BEFORE
export function WelcomeRenderer(...) {
  return (
    <ThemedBackground className="h-full w-full" contentClassName="...">
      {/* content */}
    </ThemedBackground>
  )
}

// AFTER
export function WelcomeRenderer(...) {
  return (
    <div className="h-full overflow-y-auto">  {/* scroll wrapper */}
      <div className="flex flex-col items-center gap-6 p-8">
        {/* content - no ThemedBackground */}
      </div>
    </div>
  )
}
```

**Key**: Renderer handles its own scroll - consistent with ShareReadyRenderer pattern.

### 6. WelcomeScreen (guest/containers)

**Current**: Relies on `WelcomeRenderer` for background
**Change**: Own `ThemedBackground` like other guest pages

```tsx
// BEFORE
return (
  <div className="h-screen">
    <ThemeProvider theme={theme}>
      <WelcomeRenderer ... />
    </ThemeProvider>
  </div>
)

// AFTER
return (
  <ThemeProvider theme={theme}>
    <div className="h-screen">
      <ThemedBackground className="h-full w-full" contentClassName="h-full w-full">
        <WelcomeRenderer ... />
      </ThemedBackground>
    </div>
  </ThemeProvider>
)
```

### 7. ShareLoadingRenderer & ShareReadyRenderer (project-config/share)

**Current**: `ShareReadyRenderer` has scroll handling, `ShareLoadingRenderer` doesn't
**Change**: Ensure both renderers handle their own scroll consistently

`ShareReadyRenderer` already has a scroll zone (line 119) ✓:
```tsx
<div className="flex flex-col overflow-y-auto p-4 items-center space-y-6 my-auto">
```

`ShareLoadingRenderer` needs scroll wrapper for consistency:
```tsx
// BEFORE
<div className="flex flex-col items-center justify-center p-8 space-y-6 h-full w-full">

// AFTER
<div className="h-full w-full overflow-y-auto">
  <div className="flex flex-col items-center justify-center p-8 space-y-6 min-h-full">
```

**Note**: `ShareLoadingRenderer` content is typically short, but adding scroll wrapper ensures consistency and handles edge cases (small viewports, large fonts).

### 8. Editor Pages (WelcomeEditorPage, ShareEditorPage)

**Current**: Use `PreviewShell` which provides containment
**Change**: Minimal changes needed - `PreviewShell` handles viewport framing

After `WelcomeRenderer` changes, `WelcomeEditorPage` needs to wrap with `ThemedBackground`:

```tsx
<PreviewShell ...>
  <ThemeProvider theme={currentTheme}>
    <ThemedBackground className="h-full w-full" contentClassName="...">
      <WelcomeRenderer ... mode="edit" />
    </ThemedBackground>
  </ThemeProvider>
</PreviewShell>
```

## Implementation Order

### Phase 1: Core Layout Fix
1. Update `ThemedBackground` - remove `overflow-auto`, simplify to flex container
2. Update `ExperienceRuntime` - wrap children in scroll container, add flex layout
3. Update `RuntimeTopBar` - add `shrink-0`

### Phase 2: Step Renderers
4. Update `StepLayout` - add centering/padding previously from ThemedBackground
5. Verify all step renderers work (InfoStep, Input*, CapturePhoto)

### Phase 3: Guest Pages Alignment
6. Update `WelcomeRenderer` - remove embedded `ThemedBackground`, handle own scroll
7. Update `WelcomeScreen` - own `ThemedBackground` like other guest pages
8. Verify `ExperiencePage`, `PregatePage`, `PresharePage` work with new layout

### Phase 4: Share Renderers
9. Update `ShareLoadingRenderer` - ensure scroll handling
10. Update `ShareReadyRenderer` - verify scroll zone works

### Phase 5: Editor Pages
11. Update `WelcomeEditorPage` - wrap with `ThemedBackground`
12. Verify `ShareEditorPage` - should work with existing pattern
13. Verify experience designer preview still works

## Testing Checklist

### Mobile (viewport < 768px)
- [ ] TopBar stays static (doesn't scroll with content)
- [ ] Background doesn't scroll with content
- [ ] Bottom action buttons stay fixed at bottom
- [ ] Only content area scrolls
- [ ] Safe area insets respected (notch, home indicator)

### Desktop (viewport >= 768px)
- [ ] Content centered properly
- [ ] Buttons in document flow (not fixed)
- [ ] No unnecessary scrollbars when content fits
- [ ] TopBar visible without scroll

### Pages to Test
- [ ] WelcomeScreen
- [ ] ExperiencePage (with various step types)
- [ ] PregatePage
- [ ] PresharePage
- [ ] SharePage (loading and ready states)

### Step Types to Test
- [ ] InfoStepRenderer (minimal content)
- [ ] InputShortTextRenderer (with keyboard)
- [ ] InputLongTextRenderer (with keyboard)
- [ ] InputScaleRenderer
- [ ] InputYesNoRenderer
- [ ] InputMultiSelectRenderer (many options)
- [ ] CapturePhotoRenderer (camera UI)

### Editor Preview
- [ ] WelcomeEditorPage preview
- [ ] ShareEditorPage preview (ready/loading)
- [ ] Experience designer step preview
- [ ] Experience preview modal (full runtime)

## Risk Assessment

### Low Risk
- `RuntimeTopBar` shrink-0 addition - minimal change
- `ShareLoadingRenderer` scroll - already has containment
- `ExperienceRuntime` flex wrapper - isolated change

### Medium Risk
- `ThemedBackground` overflow removal - affects all consumers
- `WelcomeRenderer` background removal - breaking change for API
- Centering/padding shift from ThemedBackground to children

### Mitigation
- Test each change in isolation before combining
- Keep editor pages working throughout refactor
- Verify all step types after StepLayout changes

## Dependencies

- No external package changes required
- All changes are internal component refactoring
- Tailwind CSS classes already support needed patterns

## Decisions Made

1. **Safe area handling**: Already gracefully handled - no changes needed.

2. **Keyboard handling**: No changes needed for fixed bottom bar.

3. **ThemedBackground contentClassName**: Keep the prop for flexibility.

4. **Max-width constraint**: ThemedBackground keeps `max-w-3xl` on content wrapper.

5. **Scroll handling for non-StepLayout pages**: Renderers handle their own scroll (Option A).
   - `WelcomeRenderer`: Add scroll wrapper
   - `ShareReadyRenderer`: Already has scroll ✓
   - `ShareLoadingRenderer`: Add scroll wrapper for consistency
