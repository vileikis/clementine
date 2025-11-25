// Journey types for the journeys feature module

export type JourneyStatus = "active" | "deleted";

export interface Journey {
  id: string;
  eventId: string;
  name: string;
  stepOrder: string[];
  tags: string[];
  status: JourneyStatus;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
