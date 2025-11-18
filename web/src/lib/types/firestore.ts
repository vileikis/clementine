// Shared TypeScript types for Firestore data models
// Feature-specific types have been moved to their respective features:
// - @/features/events/types/event.types.ts
// - @/features/companies/types/company.types.ts
// - @/features/experiences/types/experience.types.ts
// - @/features/sessions/types/session.types.ts

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

