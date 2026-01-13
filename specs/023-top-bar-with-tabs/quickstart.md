# Quickstart: Horizontal Tabs Navigation in Top Bar

**Feature**: 023-top-bar-with-tabs
**Branch**: `023-top-bar-with-tabs`

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Access to the repository

## Setup

```bash
# Clone and checkout feature branch
git checkout 023-top-bar-with-tabs

# Install dependencies
pnpm install

# Start development server
pnpm app:dev
```

## Key Files

### New Components

| File | Purpose |
|------|---------|
| `src/domains/navigation/components/NavTabs.tsx` | Horizontal navigation tabs component |

### Renamed Components

| Old Name | New Name |
|----------|----------|
| `src/domains/event/welcome/components/WelcomeControls.tsx` | `WelcomeConfigPanel.tsx` |
| `src/domains/event/theme/components/ThemeControls.tsx` | `ThemeConfigPanel.tsx` |

### Modified Components

| File | Changes |
|------|---------|
| `src/domains/navigation/components/TopNavBar.tsx` | Added optional `tabs` prop |
| `src/domains/event/designer/containers/EventDesignerLayout.tsx` | Passes tabs to TopNavBar |
| `src/domains/event/designer/containers/EventDesignerPage.tsx` | Removed sidebar |
| `src/domains/event/welcome/containers/WelcomeEditorPage.tsx` | Controls on left, preview on right, uses WelcomeConfigPanel |
| `src/domains/event/theme/containers/ThemeEditorPage.tsx` | Controls on left, preview on right, uses ThemeConfigPanel |
| `src/domains/event/settings/containers/EventSettingsPage.tsx` | Centered content layout |

## Testing the Feature

1. **Navigate to an event designer page**
   - Go to any workspace → project → event
   - Verify tabs appear horizontally in the top nav bar

2. **Test tab navigation**
   - Click Welcome tab → should navigate to welcome editor
   - Click Theme tab → should navigate to theme editor
   - Click Settings tab → should navigate to settings

3. **Verify active state**
   - Active tab should have underline indicator
   - Active tab text should be highlighted

4. **Test editor layouts**
   - Welcome page: Controls on left, preview on right
   - Theme page: Controls on left, preview on right
   - Settings page: Content centered

## Using NavTabs in Other Pages

The NavTabs component is reusable. To add tabs to any page with TopNavBar:

```tsx
import { TopNavBar, type TabItem } from '@/domains/navigation'

const myTabs: TabItem[] = [
  { id: 'tab1', label: 'First Tab', to: '/my-route/tab1' },
  { id: 'tab2', label: 'Second Tab', to: '/my-route/tab2' },
]

function MyPage() {
  return (
    <TopNavBar
      breadcrumbs={[...]}
      tabs={myTabs}
      right={<Button>Action</Button>}
    />
  )
}
```

## Validation

Before committing changes:

```bash
# Run all validation checks
pnpm app:check

# Type checking
pnpm app:type-check

# Run tests
pnpm app:test
```

## Troubleshooting

### Tabs not appearing
- Verify `tabs` prop is passed to TopNavBar
- Check that TabItem array is correctly formatted

### Active state not working
- Ensure tab `to` paths match your route patterns exactly
- The `useMatchRoute` hook requires exact path patterns

### Layout not updating
- Clear browser cache
- Restart dev server with `pnpm app:dev`
