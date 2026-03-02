# Quickstart: Themed Component Polish

**Branch**: `087-themed-component-polish` | **Date**: 2026-03-02

## Setup

```bash
git checkout 087-themed-component-polish
cd apps/clementine-app
pnpm install
pnpm dev
```

## Key Files

| File | Purpose |
|------|---------|
| `src/shared/theming/components/primitives/ThemedButton.tsx` | Add surface prop, redesign outline variant |
| `src/shared/theming/components/primitives/ThemedIconButton.tsx` | Add surface prop, redesign outline variant |
| `src/shared/theming/components/primitives/ThemedText.tsx` | Add surface prop |
| `src/shared/theming/components/primitives/ThemedProgressBar.tsx` | Add surface prop |
| `src/domains/experience/runtime/components/RuntimeTopBar.tsx` | Rename to ExperienceTopBar, refactor to props |
| `src/domains/experience/runtime/containers/ExperienceRuntime.tsx` | Add StepRenderTraits, pass surface to top bar |
| `src/domains/experience/steps/renderers/CapturePhotoRenderer/components/CameraActive.tsx` | Pass surface="dark" to themed children |
| `src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx` | Pass surface="dark" to themed children |
| `src/domains/experience/steps/renderers/CapturePhotoRenderer/components/UploadProgress.tsx` | Pass surface="dark" to ThemedText |
| `src/domains/guest/containers/SharePage.tsx` | Add ExperienceTopBar |
| `src/domains/project-config/welcome/components/WelcomeRenderer.tsx` | Fix list layout width |

## Testing Approach

### Manual Testing

1. **Create a light-themed experience** (white background, dark text, blue buttons)
2. **Add a photo capture step** to the experience
3. **Run the experience as a guest**:
   - Verify welcome screen buttons/text use theme colors
   - Verify capture step buttons/text are visible (white text, dark semi-transparent buttons)
   - Verify top bar adapts between welcome (themed) and capture (dark surface)
   - Verify exit dialog matches theme
4. **Complete the experience** and check the share page has a top bar with home navigation
5. **Repeat with a dark-themed experience** (dark background, light text)
6. **Repeat with a high-saturation theme** (bright background, contrasting buttons)

### Automated Testing

```bash
pnpm test -- --run RuntimeTopBar    # Renamed to ExperienceTopBar tests
pnpm type-check                      # Verify no type regressions
pnpm check                           # Format + lint
```

## Validation

```bash
pnpm check        # Format + lint fixes
pnpm type-check   # TypeScript strict mode
pnpm test         # Run all tests
pnpm dev          # Visual verification in browser
```
