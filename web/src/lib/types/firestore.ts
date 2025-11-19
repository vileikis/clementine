// Shared TypeScript types for Firestore data models

export interface Media {
  id: string;
  sessionId: string;
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

