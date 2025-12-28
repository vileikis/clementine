# Design System

This document defines the design token system and theming standards for the Clementine TanStack Start application.

## Philosophy

Our design system is built on three core principles:

1. **Token-First Approach** - All visual properties (colors, spacing, radius) come from design tokens
2. **Single Source of Truth** - The theme system (`src/ui-kit/theme/styles.css`) is authoritative
3. **Strict Compliance** - No exceptions to token usage rules

**Key Principle**: Design tokens provide consistency, maintainability, and effortless theming (including dark mode).

## Theme System Architecture

### Location

```
src/ui-kit/theme/
└── styles.css          # Theme tokens (CSS variables)
```

### Token Structure

Our theme uses **CSS custom properties (variables)** integrated with **Tailwind CSS v4**:

```css
:root {
  /* Color tokens */
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.21 0.006 285.885);
  /* ... */

  /* Radius tokens */
  --radius: 0.625rem;
}

.dark {
  /* Dark mode overrides */
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  /* ... */
}
```

Tokens are automatically exposed to Tailwind via the `@theme inline` directive.

## Available Design Tokens

### Color Tokens

#### Base Colors

- `background` / `foreground` - Main app background and text color
- `card` / `card-foreground` - Card/panel backgrounds
- `popover` / `popover-foreground` - Popover/dropdown backgrounds

#### Brand Colors

- `primary` / `primary-foreground` - Primary brand color (dark gray in light mode)
- `secondary` / `secondary-foreground` - Secondary color (light gray)
- `accent` / `accent-foreground` - Interactive elements, hover states
- `muted` / `muted-foreground` - Subtle backgrounds, disabled states

#### Semantic Colors

- `destructive` / `destructive-foreground` - Error states, delete actions (red)
- `success` / `success-foreground` - Success messages, confirmations (green)
- `info` / `info-foreground` - Informational messages (blue)
- `warning` / `warning-foreground` - Warnings, cautions (amber)

#### UI Element Colors

- `border` - Default border color
- `input` - Input field borders
- `ring` - Focus ring color

#### Sidebar-Specific Colors

- `sidebar` / `sidebar-foreground` - Sidebar background and text
- `sidebar-primary` / `sidebar-primary-foreground` - Sidebar primary elements
- `sidebar-accent` / `sidebar-accent-foreground` - Sidebar accent elements
- `sidebar-border` - Sidebar border color
- `sidebar-ring` - Sidebar focus ring color

#### Chart Colors

- `chart-1` through `chart-5` - Data visualization colors

### Radius Tokens

- `radius-sm` - Small border radius (calc(var(--radius) - 4px))
- `radius-md` - Medium border radius (calc(var(--radius) - 2px))
- `radius-lg` - Large border radius (var(--radius))
- `radius-xl` - Extra large border radius (calc(var(--radius) + 4px))

**Note**: Base `--radius` is 0.625rem (10px)

## Strict Compliance Rules

### ⚠️ Rule 1: No Ad-Hoc Tokens (ABSOLUTE)

**You MUST NOT introduce colors, spacing, or visual properties without using design tokens.**

❌ **FORBIDDEN:**
```tsx
// Hard-coded colors
<div className="bg-green-500 text-red-600" />

// Arbitrary values (without approval)
<div className="bg-[#ff0000] text-[#00ff00]" />

// Inline styles with hard-coded values
<div style={{ backgroundColor: '#ff0000' }} />
```

✅ **REQUIRED:**
```tsx
// Use theme tokens via Tailwind classes
<div className="bg-success text-success-foreground" />

// Use semantic colors for their purpose
<div className="bg-destructive text-destructive-foreground" />
```

**Exception**: Arbitrary values are allowed ONLY for:
- One-off layout values (widths, heights) that aren't semantic tokens: `w-[247px]`
- Prototype/temporary code clearly marked with `// TODO: Add to theme`

**Enforcement**: Code reviews MUST reject hard-coded colors.

### ⚠️ Rule 2: Token Usage Applies Everywhere

Strict compliance applies to:

- ✅ **ui-kit components** - All components in `src/ui-kit/components/`
- ✅ **Domain components** - All components in `src/domains/*/components/`
- ✅ **Shared components** - All components in `src/shared/components/`
- ✅ **Container components** - All components in `src/domains/*/containers/`
- ✅ **Layout components** - Page layouts, wrappers, etc.
- ✅ **Custom styles** - Any Tailwind classes, CSS, styled components

**No exceptions.** If you're writing UI code, you're using design tokens.

### ⚠️ Rule 3: Semantic Colors for Semantic Purposes

Use semantic colors for their intended meaning:

✅ **CORRECT:**
```tsx
// Success message
<div className="bg-success text-success-foreground">Saved!</div>

// Error state
<div className="bg-destructive text-destructive-foreground">Failed</div>

// Warning banner
<div className="bg-warning text-warning-foreground">Caution</div>

// Info tooltip
<div className="bg-info text-info-foreground">Tip: ...</div>
```

❌ **INCORRECT:**
```tsx
// Using destructive for non-error purposes
<div className="bg-destructive">Important announcement</div>

// Using success for non-success purposes
<div className="bg-success">Primary button</div>
```

### ⚠️ Rule 4: Always Pair Background with Foreground

When using background color tokens, ALWAYS use the corresponding foreground token:

✅ **CORRECT:**
```tsx
<div className="bg-primary text-primary-foreground" />
<div className="bg-success text-success-foreground" />
<div className="bg-muted text-muted-foreground" />
```

❌ **INCORRECT:**
```tsx
<div className="bg-primary text-foreground" />  {/* Wrong pairing */}
<div className="bg-success text-destructive-foreground" />  {/* Nonsensical */}
```

**Why**: Foreground colors are specifically chosen for contrast and accessibility with their paired background.

### ⚠️ Rule 5: Use Opacity Modifiers for Subtle Variants

For subtle backgrounds (badges, highlights, etc.), use opacity modifiers:

✅ **CORRECT:**
```tsx
// Subtle success background
<span className="bg-success/10 text-success">Active</span>

// Subtle warning background
<span className="bg-warning/20 text-warning">Pending</span>

// Hover state with opacity
<button className="hover:bg-primary/10">Hover me</button>
```

❌ **INCORRECT:**
```tsx
// Creating custom lighter variants
<span className="bg-green-100 text-green-600">Active</span>
```

**Why**: Opacity modifiers maintain consistency and automatically work with dark mode.

## Adding New Design Tokens

### When to Add a New Token

Add a new token when:

1. ✅ **Recurring semantic need** - A color/value is used 3+ times across the app
2. ✅ **Missing semantic meaning** - Existing tokens don't represent the concept
3. ✅ **Theme variation needed** - Value should change with dark mode
4. ✅ **Design system gap** - Design calls for a token that doesn't exist

Do NOT add tokens for:

1. ❌ **One-off values** - Use existing tokens or justify with TODO comment
2. ❌ **Component-specific tweaks** - Use opacity modifiers on existing tokens
3. ❌ **Personal preference** - "I like this shade better" is not a reason

### Process for Adding Tokens

**Step 1: Verify Need**

Check existing tokens first:
- Review `src/ui-kit/theme/styles.css` - Does a suitable token exist?
- Check opacity modifiers - Can `bg-success/10` solve your need?
- Consider combinations - Can `bg-muted border-border` work?

**Step 2: Define Token**

If genuinely needed:
1. Choose a semantic name (not `--green-custom`, use `--highlight` or `--feature`)
2. Define light mode value
3. Define dark mode value (if applicable)
4. Ensure accessible contrast with foreground colors

**Step 3: Add to Theme**

Edit `src/ui-kit/theme/styles.css`:

```css
:root {
  /* Existing tokens... */

  /* New token */
  --your-new-token: oklch(0.7 0.12 180);
  --your-new-token-foreground: oklch(0.985 0 0);
}

.dark {
  /* Existing tokens... */

  /* Dark mode variant */
  --your-new-token: oklch(0.5 0.12 180);
  --your-new-token-foreground: oklch(0.985 0 0);
}

@theme inline {
  /* Existing mappings... */

  /* Expose to Tailwind */
  --color-your-new-token: var(--your-new-token);
  --color-your-new-token-foreground: var(--your-new-token-foreground);
}
```

**Step 4: Document**

Update this standard:
- Add token to "Available Design Tokens" section
- Add usage example
- Update `src/ui-kit/README.md` if relevant

**Step 5: Use the Token**

Now you can use it:
```tsx
<div className="bg-your-new-token text-your-new-token-foreground" />
```

### Token Naming Conventions

Follow these naming patterns:

- **Semantic names**: `--success`, `--warning`, `--destructive` (not `--green`, `--red`)
- **Paired foreground**: Every background token should have `-foreground` variant
- **Kebab-case**: `--sidebar-accent`, not `--sidebarAccent`
- **Contextual prefixes**: `--sidebar-*`, `--chart-*` for scoped tokens

## Usage Patterns

### Common Patterns

#### Success States
```tsx
// Success message
<div className="bg-success text-success-foreground p-4 rounded-lg">
  ✓ Settings saved successfully!
</div>

// Success badge
<span className="bg-success/10 text-success px-2 py-1 rounded text-xs">
  Active
</span>

// Success button (shadcn/ui doesn't have this variant by default)
<button className="bg-success text-success-foreground hover:bg-success/90">
  Confirm
</button>
```

#### Error States
```tsx
// Error alert
<div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
  ✗ Failed to save changes
</div>

// Error input border
<input className="border-destructive focus:ring-destructive" />

// Destructive button (shadcn/ui has this built-in)
<Button variant="destructive">Delete Account</Button>
```

#### Info & Warning States
```tsx
// Info tooltip
<div className="bg-info text-info-foreground px-3 py-2 rounded text-sm">
  💡 Pro tip: Use shortcuts
</div>

// Warning banner
<div className="bg-warning text-warning-foreground p-4 rounded-lg">
  ⚠️ Trial expires soon
</div>
```

#### Layout & Structure
```tsx
// Card
<div className="bg-card text-card-foreground border-border rounded-lg p-6" />

// Muted section
<div className="bg-muted text-muted-foreground p-4 rounded" />

// Primary header
<header className="bg-primary text-primary-foreground py-4 px-6" />
```

### shadcn/ui Components

shadcn/ui components already use theme tokens internally. When customizing:

✅ **CORRECT:**
```tsx
// Extend existing variants
<Button variant="destructive">Delete</Button>

// Add custom classes using tokens
<Button className="bg-success text-success-foreground hover:bg-success/90">
  Confirm
</Button>
```

❌ **INCORRECT:**
```tsx
// Bypassing theme
<Button className="bg-green-500 text-white">Confirm</Button>
```

### Radix UI Components

When styling Radix primitives, use theme tokens:

```tsx
import * as Slider from '@radix-ui/react-slider'

<Slider.Root className="bg-secondary">
  <Slider.Track className="bg-muted">
    <Slider.Range className="bg-primary" />
  </Slider.Track>
  <Slider.Thumb className="bg-primary border-primary-foreground" />
</Slider.Root>
```

## Dark Mode

### Automatic Dark Mode Support

The theme system includes dark mode variants for all tokens:

```css
:root {
  --background: oklch(1 0 0);  /* White */
}

.dark {
  --background: oklch(0.141 0.005 285.823);  /* Dark gray */
}
```

**When you use tokens, dark mode works automatically:**
```tsx
// This component works in both light and dark mode
<div className="bg-background text-foreground">
  Content adapts automatically
</div>
```

### Enabling Dark Mode

To enable dark mode, add the `dark` class to the `<html>` element:

```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark')
```

Or use a theme provider (future implementation):
```tsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="class">
  <App />
</ThemeProvider>
```

### Testing Dark Mode

When developing components:
1. Test in light mode
2. Add `dark` class to `<html>` in DevTools
3. Verify component appearance in dark mode
4. Ensure sufficient contrast in both modes

## Color System (OKLCH)

### Why OKLCH?

The theme uses **OKLCH color space** for perceptually uniform colors:

- **Perceptual uniformity** - Equal lightness values look equally bright
- **Consistent chroma** - Colors maintain saturation across lightness
- **Better for accessibility** - Predictable contrast ratios
- **Future-proof** - Modern CSS standard

### OKLCH Format

```css
--color: oklch(L C H);
```

- **L (Lightness)**: 0-1 (0 = black, 1 = white)
- **C (Chroma)**: 0-0.4 (0 = gray, higher = more saturated)
- **H (Hue)**: 0-360 degrees (red = 0/360, green = 150, blue = 250)

### Examples

```css
--success: oklch(0.65 0.15 150);
/* 0.65 = medium-light lightness
   0.15 = moderate saturation
   150 = green hue */

--primary: oklch(0.21 0.006 285.885);
/* 0.21 = dark
   0.006 = very low saturation (almost gray)
   285.885 = purple-ish hue */
```

### Customizing Colors

To change the color palette, edit `src/ui-kit/theme/styles.css`:

```css
:root {
  /* Change success from green to teal */
  --success: oklch(0.65 0.15 180);  /* Teal hue */

  /* Make primary more saturated */
  --primary: oklch(0.21 0.1 285.885);  /* Higher chroma */
}
```

**All components using these tokens update automatically!**

### Tools

- **OKLCH Color Picker**: https://oklch.com/
- **OKLCH in Tailwind**: https://tailwindcss.com/blog/tailwind-css-v4-alpha#using-oklch-colors

## Integration with Tailwind CSS v4

### How It Works

1. **CSS variables defined** in `src/ui-kit/theme/styles.css`
2. **Exposed to Tailwind** via `@theme inline` directive
3. **Used as utility classes** like `bg-primary`, `text-success`

### Available Utilities

Every token is available as Tailwind utilities:

```tsx
// Background colors
className="bg-primary"
className="bg-success"
className="bg-destructive"

// Text colors
className="text-foreground"
className="text-success-foreground"
className="text-muted-foreground"

// Border colors
className="border-border"
className="border-destructive"

// Ring colors (focus states)
className="ring-ring"
className="ring-destructive"

// Opacity modifiers
className="bg-success/10"
className="bg-primary/50"
className="text-foreground/70"
```

### Border Radius

```tsx
// Use radius utilities
className="rounded-sm"    // --radius-sm
className="rounded-md"    // --radius-md
className="rounded-lg"    // --radius-lg
className="rounded-xl"    // --radius-xl
```

## Anti-Patterns

### ❌ DON'T: Hard-Code Colors

```tsx
// WRONG
<div className="bg-green-500 text-white" />
<div className="bg-red-600 text-white" />
<div className="bg-blue-400" />
```

**Why wrong**: Breaks theming, no dark mode support, inconsistent palette.

✅ **DO: Use Semantic Tokens**

```tsx
// CORRECT
<div className="bg-success text-success-foreground" />
<div className="bg-destructive text-destructive-foreground" />
<div className="bg-info text-info-foreground" />
```

### ❌ DON'T: Use Arbitrary Colors Without Approval

```tsx
// WRONG
<div className="bg-[#ff0000]" />
<div style={{ backgroundColor: '#00ff00' }} />
```

**Why wrong**: Bypasses design system, no dark mode, inconsistent.

✅ **DO: Add to Theme First**

```tsx
// CORRECT - After adding token to theme
<div className="bg-highlight text-highlight-foreground" />
```

### ❌ DON'T: Mix Foreground Colors Incorrectly

```tsx
// WRONG
<div className="bg-primary text-success-foreground" />
<div className="bg-success text-destructive-foreground" />
```

**Why wrong**: Incorrect contrast, accessibility issues, semantically confusing.

✅ **DO: Pair Correctly**

```tsx
// CORRECT
<div className="bg-primary text-primary-foreground" />
<div className="bg-success text-success-foreground" />
```

### ❌ DON'T: Create Custom Color Utilities

```tsx
// WRONG - Don't extend Tailwind with custom colors
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'my-green': '#00ff00',
        'my-red': '#ff0000',
      }
    }
  }
}
```

**Why wrong**: Bypasses theme system, creates inconsistency.

✅ **DO: Add to Theme System**

Add to `src/ui-kit/theme/styles.css` instead, following the token addition process.

## Reference

### Quick Token Reference

| Purpose | Background Token | Foreground Token |
|---------|-----------------|------------------|
| Main app | `background` | `foreground` |
| Cards | `card` | `card-foreground` |
| Primary brand | `primary` | `primary-foreground` |
| Secondary | `secondary` | `secondary-foreground` |
| Muted/subtle | `muted` | `muted-foreground` |
| Accent/hover | `accent` | `accent-foreground` |
| Errors | `destructive` | `destructive-foreground` |
| Success | `success` | `success-foreground` |
| Info | `info` | `info-foreground` |
| Warnings | `warning` | `warning-foreground` |

### Related Documentation

- **Theme Usage Guide**: `src/ui-kit/README.md` - Developer-facing usage examples
- **Component Libraries**: `standards/frontend/component-libraries.md` - Which libraries to use
- **Accessibility**: `standards/frontend/accessibility.md` - Ensuring accessible contrast
- **Tailwind Docs**: https://tailwindcss.com/docs/customizing-colors

## Enforcement

### Code Review Checklist

When reviewing code, verify:

- [ ] No hard-coded colors (`bg-green-500`, `#ff0000`, etc.)
- [ ] No arbitrary color values without justification
- [ ] All background colors paired with foreground colors
- [ ] Semantic colors used for semantic purposes
- [ ] New tokens added to theme system before use
- [ ] Dark mode tested if UI changes made

### Automated Checks

Consider adding ESLint rules to catch violations:
- Detect hard-coded Tailwind colors (future)
- Detect arbitrary color values (future)

## Summary

**Core Rules:**
1. ✅ Use design tokens from `src/ui-kit/theme/styles.css` ALWAYS
2. ✅ No ad-hoc colors, spacing, or values without adding to theme
3. ✅ Semantic colors for semantic purposes
4. ✅ Always pair background with foreground tokens
5. ✅ Add new tokens following the defined process

**Benefits:**
- 🎨 Consistent visual design
- 🌓 Automatic dark mode support
- ♿ Better accessibility
- 🔧 Easy theming and customization
- 📦 Maintainable codebase

**Resources:**
- Theme file: `src/ui-kit/theme/styles.css`
- Usage guide: `src/ui-kit/README.md`
- OKLCH picker: https://oklch.com/
