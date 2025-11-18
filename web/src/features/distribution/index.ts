// ============================================================================
// Components - Safe for client & server
// ============================================================================
export { CopyLinkButton } from "./components/CopyLinkButton";
export { QRPanel } from "./components/QRPanel";

// ============================================================================
// Server Actions - Safe (marked "use server")
// ============================================================================
export {
  generateQrCodeAction,
  regenerateQrCodeAction,
} from "./lib/actions";

// ============================================================================
// QR Utilities - NOT EXPORTED
// These contain server-only code (Firebase Admin SDK via storage/upload)
// Import directly when needed: @/features/distribution/lib/qr
// ============================================================================
