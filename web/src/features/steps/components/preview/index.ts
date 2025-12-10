// Preview components barrel export

/**
 * @deprecated Import DeviceFrame from @/features/preview-shell instead.
 * The steps DeviceFrame includes theme integration while preview-shell DeviceFrame is a pure container.
 */
export { DeviceFrame } from "./DeviceFrame";

/**
 * @deprecated Import ViewportSwitcher from @/features/preview-shell instead.
 * ViewSwitcher has been renamed to ViewportSwitcher for clarity.
 */
export { ViewSwitcher } from "./ViewSwitcher";

export { PreviewRuntime } from "./PreviewRuntime";

/**
 * @deprecated Import ViewportProvider and useViewportContext from @/features/preview-shell instead.
 * The steps version is kept for backward compatibility with existing components.
 */
export { ViewportModeProvider, useViewportMode } from "./ViewportModeContext";
export { PlaybackMode } from "./PlaybackMode";
export { PreviewNavigationBar } from "./PreviewNavigationBar";
export { StepErrorBoundary } from "./StepErrorBoundary";

// Step preview components
export {
  InfoStep,
  ShortTextStep,
  LongTextStep,
  MultipleChoiceStep,
  YesNoStep,
  OpinionScaleStep,
  EmailStep,
  CaptureStep,
  ProcessingStep,
  RewardStep,
} from "./steps";
