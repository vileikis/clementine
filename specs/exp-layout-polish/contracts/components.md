# Component Contracts: Experience Layout Polish

**Feature**: Experience Layout Polish
**Date**: 2026-02-04

## ThemedBackground

### Current Interface (unchanged)

```typescript
interface ThemedBackgroundProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  background?: BackgroundConfig
}
```

### Layout Contract

**BEFORE**:
```tsx
// Inner wrapper (line 96)
<div className="relative z-10 flex flex-1 flex-col items-center overflow-auto px-4 py-8">
  <div className={cn('w-full max-w-3xl my-auto', contentClassName)}>
    {children}
  </div>
</div>
```

**AFTER**:
```tsx
// Inner wrapper - simplified
<div className="relative z-10 flex flex-1 flex-col items-center">
  <div className={cn('w-full max-w-3xl', contentClassName)}>
    {children}
  </div>
</div>
```

**Removed**:
- `overflow-auto` - consumers handle scroll
- `px-4 py-8` - consumers handle padding
- `my-auto` - consumers handle vertical positioning

---

## RuntimeTopBar

### Current Interface (unchanged)

```typescript
interface RuntimeTopBarProps {
  experienceName: string
  currentStepIndex: number
  totalSteps: number
  onHomeClick?: () => void
  className?: string
}
```

### Layout Contract

**BEFORE**:
```tsx
<div className={cn('w-full z-50', 'flex flex-col', 'px-4 pt-4 pb-3', className)}>
```

**AFTER**:
```tsx
<div className={cn('w-full z-50 shrink-0', 'flex flex-col', 'px-4 pt-4 pb-3', className)}>
```

**Added**: `shrink-0` - prevents compression when content overflows

---

## ExperienceRuntime

### Current Interface (unchanged)

```typescript
interface ExperienceRuntimeProps {
  experienceId: string
  steps: ExperienceStep[]
  session: Session
  experienceName: string
  onHomeClick?: () => void
  showTopBar?: boolean
  onStepChange?: (stepIndex: number) => void
  onComplete?: () => void
  onError?: (error: Error) => void
  children: React.ReactNode
}
```

### Layout Contract

**BEFORE**:
```tsx
return (
  <>
    {showTopBar && <RuntimeTopBar ... />}
    {children}
  </>
)
```

**AFTER**:
```tsx
return (
  <div className="flex h-full flex-col">
    {showTopBar && <RuntimeTopBar ... />}
    <div className="flex-1 overflow-y-auto">
      {children}
    </div>
  </div>
)
```

**Added**:
- Flex column container with full height
- Scroll wrapper around children only (not TopBar)

---

## StepLayout

### Current Interface (unchanged)

```typescript
interface StepLayoutProps {
  children: React.ReactNode
  onSubmit?: () => void
  onBack?: () => void
  canGoBack?: boolean
  canProceed?: boolean
  buttonLabel?: string
  hideButton?: boolean
  contentClassName?: string
}
```

### Layout Contract

**Content area adjustment**:
```tsx
// BEFORE
<div className={cn('flex flex-1 flex-col items-center', ...)}>

// AFTER
<div className={cn('flex flex-1 flex-col items-center px-4', ...)}>
```

**Added**: `px-4` - horizontal padding (previously from ThemedBackground)

---

## WelcomeRenderer

### Current Interface (unchanged)

```typescript
interface WelcomeRendererProps {
  welcome: WelcomeConfig
  mainExperiences: ReferenceList
  experienceDetails: ExperienceCardData[]
  mode: 'edit' | 'run'
  onSelectExperience?: (experienceId: string) => void
}
```

### Layout Contract

**BEFORE**:
```tsx
export function WelcomeRenderer({ ... }) {
  return (
    <ThemedBackground className="h-full w-full" contentClassName="flex flex-col items-center gap-6 p-8">
      {/* content */}
    </ThemedBackground>
  )
}
```

**AFTER**:
```tsx
export function WelcomeRenderer({ ... }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* content - no ThemedBackground */}
      </div>
    </div>
  )
}
```

**Removed**: ThemedBackground wrapper (container provides it)
**Added**: Own scroll wrapper (`overflow-y-auto`)

---

## WelcomeScreen

### Current Interface (unchanged)

No props - uses GuestContext

### Layout Contract

**BEFORE**:
```tsx
return (
  <div className="h-screen">
    <ThemeProvider theme={theme}>
      <WelcomeRenderer ... />
    </ThemeProvider>
  </div>
)
```

**AFTER**:
```tsx
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

**Added**: ThemedBackground wrapper (consistent with other guest pages)

---

## ShareLoadingRenderer

### Current Interface (unchanged)

```typescript
interface ShareLoadingRendererProps {
  shareLoading: ShareLoadingConfig
  mode: 'edit' | 'run'
}
```

### Layout Contract

**BEFORE**:
```tsx
<div className="flex flex-col items-center justify-center p-8 space-y-6 h-full w-full">
```

**AFTER**:
```tsx
<div className="h-full w-full overflow-y-auto">
  <div className="flex flex-col items-center justify-center p-8 space-y-6 min-h-full">
```

**Added**: Scroll wrapper for consistency

---

## ShareReadyRenderer

### Current Interface (unchanged)

```typescript
interface ShareReadyRendererProps {
  share: ShareConfig
  shareOptions: ShareOptions
  mode: 'edit' | 'run'
  mediaUrl?: string
  onShare?: (platform: SharePlatform) => void
  onCta?: () => void
  onStartOver?: () => void
}
```

### Layout Contract

**No changes** - already has correct scroll pattern:
```tsx
<div className="flex flex-col overflow-y-auto p-4 items-center space-y-6 my-auto">
```

---

## Guest Page Containers

### ExperiencePage, PregatePage, PresharePage

### Layout Contract

**BEFORE** (content div inside ExperienceRuntime):
```tsx
<div className="pt-20">
  <GuestRuntimeContent ... />
</div>
```

**AFTER**:
```tsx
<GuestRuntimeContent ... />
```

**Removed**: `pt-20` - ExperienceRuntime handles TopBar spacing via flex layout

---

## WelcomeEditorPage

### Layout Contract

**BEFORE**:
```tsx
<PreviewShell ...>
  <ThemeProvider theme={currentTheme}>
    <WelcomeRenderer ... mode="edit" />
  </ThemeProvider>
</PreviewShell>
```

**AFTER**:
```tsx
<PreviewShell ...>
  <ThemeProvider theme={currentTheme}>
    <ThemedBackground className="h-full w-full" contentClassName="h-full w-full">
      <WelcomeRenderer ... mode="edit" />
    </ThemedBackground>
  </ThemeProvider>
</PreviewShell>
```

**Added**: ThemedBackground wrapper (match runtime experience)
