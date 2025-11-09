// Canonical TypeScript types for Firestore data models

export type EventStatus = "draft" | "live" | "archived";
export type SceneStatus = "active" | "deprecated";
export type SessionState = "created" | "captured" | "transforming" | "ready" | "error";
export type CaptureMode = "photo" | "video" | "gif" | "boomerang";
export type EffectType = "background_swap" | "deep_fake";

export interface Event {
  id: string;
  title: string;
  brandColor: string; // hex color
  showTitleOverlay: boolean;

  status: EventStatus;
  currentSceneId: string; // FK to scenes subcollection

  joinPath: string; // e.g., "/join/abc123"
  qrPngPath: string; // Storage path

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}

export interface Scene {
  id: string;
  label: string;
  mode: CaptureMode;
  effect: EffectType;

  prompt: string;
  defaultPrompt: string;

  referenceImagePath?: string; // Storage path

  flags: {
    customTextTool: boolean;
    stickersTool: boolean;
  };

  status: SceneStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  eventId: string; // denormalized for convenience
  sceneId: string; // snapshot pointer

  state: SessionState;

  inputImagePath?: string; // Storage path
  resultImagePath?: string; // Storage path

  error?: string;

  createdAt: number;
  updatedAt: number;
}

export interface Media {
  id: string;
  sessionId: string;
  sceneId: string;
  resultImagePath: string;

  createdAt: number;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface StatsOverview {
  sessions: number;
  captures: number;
  transforms: number;
  shares: number;
  downloads: number;
  uniqueGuests: number;

  captureRate: number;
  transformSuccessRate: number;
  shareRate: number;

  topMedia: Array<{
    mediaId: string;
    sessionId: string;
    resultImagePath: string;
    score: number;
    shares: number;
    downloads: number;
    views: number;
  }>;

  updatedAt: number;
}
