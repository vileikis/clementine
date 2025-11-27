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

// Journey Runtime Components (Phase 3)
export { JourneyGuestContainer } from "./components/JourneyGuestContainer";
export { JourneyStepRenderer } from "./components/JourneyStepRenderer";
export { GuestCaptureStep } from "./components/GuestCaptureStep";
export { GuestProcessingStep } from "./components/GuestProcessingStep";
export { GuestRewardStep } from "./components/GuestRewardStep";

// ============================================================================
// Hooks - Client-side only
// ============================================================================
export { useCamera } from "./hooks/useCamera";
export { useGuestFlow } from "./hooks/useGuestFlow";
export { useJourneyRuntime } from "./hooks/useJourneyRuntime";

// ============================================================================
// Utilities - Client-side camera capture
// ============================================================================
export { capturePhoto } from "./lib/capture";
