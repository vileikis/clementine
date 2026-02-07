# Data Model: Experience Layout Polish

**Feature**: Experience Layout Polish
**Date**: 2026-02-04

## Overview

This feature is a UI refactoring with no data model changes. The "entities" are React components with their layout responsibilities. This document defines the layout contracts between components.

## Component Layout Contracts

### 1. ThemedBackground

**Responsibility**: Provide themed background visuals + max-width content constraint

**Layout Contract**:
```
ThemedBackground
├── Background layers (absolute positioned, z-0)
│   ├── Color gradient
│   └── Optional image
└── Content wrapper (relative, z-10, flex container)
    └── Max-width container (w-full, max-w-3xl, centered)
        └── {children}
```

**BEFORE (incorrect)**:
- Inner wrapper had `overflow-auto` (made everything scroll)
- Inner wrapper had `px-4 py-8` (forced padding on consumers)
- Content had `my-auto` (forced vertical centering)

**AFTER (correct)**:
- Inner wrapper: `flex flex-1 flex-col items-center` (NO overflow)
- Content: `w-full max-w-3xl` (NO my-auto)
- Consumers responsible for padding and scroll

### 2. ExperienceRuntime

**Responsibility**: Manage experience state + create scroll boundary for TopBar exclusion

**Layout Contract**:
```
ExperienceRuntime (flex h-full flex-col)
├── RuntimeTopBar (shrink-0) ← OUTSIDE scroll container
└── Scroll wrapper (flex-1 overflow-y-auto) ← ONLY this scrolls
    └── {children}
```

**BEFORE (incorrect)**:
- Fragment wrapper `<>...</>` (no layout control)
- Children had `pt-20` to account for TopBar

**AFTER (correct)**:
- Flex column container with full height
- TopBar excluded from scroll via structural placement
- Children no longer need top padding

### 3. RuntimeTopBar

**Responsibility**: Display experience header with home button and progress

**Layout Contract**:
```
RuntimeTopBar (w-full shrink-0)
├── Top row (home button, name, spacer)
└── Progress bar (optional)
```

**Change**: Add `shrink-0` to prevent compression when content overflows

### 4. StepLayout

**Responsibility**: Layout step content with responsive button placement

**Layout Contract**:
```
StepLayout (flex h-full w-full flex-col)
├── Content area (flex-1, centered, px-4)
│   └── {children}
├── Mobile buttons (fixed bottom)
└── Desktop buttons (in-flow, hidden on mobile)
```

**Change**: Add `px-4` for horizontal padding (previously from ThemedBackground)

### 5. WelcomeRenderer

**Responsibility**: Render welcome screen content (NO background)

**Layout Contract**:
```
WelcomeRenderer (h-full overflow-y-auto) ← OWN scroll
└── Content (flex-col items-center gap-6 p-8)
    ├── Media/Logo
    ├── Title
    ├── Description
    └── Experience list
```

**BEFORE (incorrect)**:
- Wrapped self in ThemedBackground (inconsistent with other pages)
- No own scroll handling

**AFTER (correct)**:
- Pure content renderer (no background)
- Owns scroll for self-contained behavior
- Container provides ThemedBackground

### 6. WelcomeScreen

**Responsibility**: Container for welcome page with theme and background

**Layout Contract**:
```
WelcomeScreen (h-screen)
└── ThemeProvider
    └── ThemedBackground (h-full w-full)
        └── WelcomeRenderer
```

**BEFORE (incorrect)**:
- ThemeProvider wrapped WelcomeRenderer
- WelcomeRenderer embedded ThemedBackground

**AFTER (correct)**:
- Container owns ThemedBackground (like other guest pages)
- Consistent pattern across all guest pages

### 7. ShareLoadingRenderer

**Responsibility**: Render loading state for share page

**Layout Contract**:
```
ShareLoadingRenderer (h-full w-full overflow-y-auto) ← OWN scroll
└── Content (flex-col items-center justify-center p-8 min-h-full)
    ├── Image skeleton
    ├── Title
    └── Description
```

**Change**: Add scroll wrapper for consistency with ShareReadyRenderer

### 8. ShareReadyRenderer

**Responsibility**: Render completed share page with result and actions

**Layout Contract**:
```
ShareReadyRenderer (flex h-full w-full flex-col)
└── Scroll zone (flex-1 overflow-y-auto p-4 items-center) ← ALREADY correct
    ├── Result image
    ├── Title/Description
    ├── Share icons
    └── Action buttons
```

**No change needed** - already has correct scroll pattern

### 9. Guest Page Containers (ExperiencePage, PregatePage, PresharePage)

**Responsibility**: Container for experience pages with theme and background

**Layout Contract**:
```
GuestPage (h-screen)
└── ThemeProvider
    └── ThemedBackground (h-full w-full)
        └── ExperienceRuntime
            ├── RuntimeTopBar
            └── GuestRuntimeContent (no pt-20 needed)
```

**Change**: Remove `pt-20` from content divs - ExperienceRuntime handles TopBar spacing

## State Transitions

No state changes - this is a pure layout refactoring.

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| TopBar must not scroll | Structural: TopBar outside scroll wrapper |
| Background must not scroll | Structural: Background at fixed position layer |
| Only content scrolls | Structural: `overflow-y-auto` only on content wrapper |
| Mobile buttons stay fixed | CSS: `fixed bottom-0` on mobile |
| Desktop buttons in flow | CSS: `hidden md:flex` |

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ GuestPage Container (h-screen)                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ThemeProvider                                               │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ ThemedBackground (h-full, no overflow)                  │ │ │
│ │ │ ┌───────────────────────────────────────────┐           │ │ │
│ │ │ │ Background layers (absolute, static)      │           │ │ │
│ │ │ └───────────────────────────────────────────┘           │ │ │
│ │ │ ┌─────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ ExperienceRuntime (flex-col)                        │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ RuntimeTopBar (shrink-0) ← STATIC               │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────────────┘ │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ Scroll Wrapper (flex-1, overflow-y-auto)        │ │ │ │ │
│ │ │ │ │ ┌─────────────────────────────────────────────┐ │ │ │ │ │
│ │ │ │ │ │ StepLayout / Content                        │ │ │ │ │ │
│ │ │ │ │ │ (scrolls within this container)             │ │ │ │ │ │
│ │ │ │ │ └─────────────────────────────────────────────┘ │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```
