// ============================================================================
// Components - Safe for client & server
// ============================================================================
export { BrandThemeProvider } from "./components/BrandThemeProvider";
export { CameraView } from "./components/CameraView";
export { CaptureButton } from "./components/CaptureButton";
export { Countdown } from "./components/Countdown";
export { ErrorBanner } from "./components/ErrorBanner";
export { GreetingScreen } from "./components/GreetingScreen";
export { GuestFlowContainer } from "./components/GuestFlowContainer";
export { ResultViewer } from "./components/ResultViewer";
export { RetakeButton } from "./components/RetakeButton";

// Step Components
// NOTE: JourneyGuestContainer and useJourneyRuntime deleted in Phase 3 cleanup.
// Phase 7 Experience Engine will provide the new guest runtime.
export { JourneyStepRenderer } from "./components/JourneyStepRenderer";
export { GuestCaptureStep } from "./components/GuestCaptureStep";
export { GuestProcessingStep } from "./components/GuestProcessingStep";
export { GuestRewardStep } from "./components/GuestRewardStep";

// Error Handling Components (Phase 5)
export { JourneyErrorBoundary } from "./components/JourneyErrorBoundary";
export { CameraPermissionDenied } from "./components/CameraPermissionDenied";
export { EventUnavailableScreen } from "./components/EventUnavailableScreen";

// ============================================================================
// Hooks - Client-side only
// ============================================================================
export { useCamera } from "./hooks/useCamera";
export { useGuestFlow } from "./hooks/useGuestFlow";

// ============================================================================
// Utilities - Client-side camera capture
// ============================================================================
export { capturePhoto } from "./lib/capture";
