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

// ============================================================================
// Hooks - Client-side only
// ============================================================================
export { useCamera } from "./hooks/useCamera";
export { useGuestFlow } from "./hooks/useGuestFlow";

// ============================================================================
// Utilities - Client-side camera capture
// ============================================================================
export { capturePhoto } from "./lib/capture";
