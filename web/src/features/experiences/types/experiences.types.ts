// Experience types for the experiences feature module

export type ExperienceStatus = "active" | "deleted";

export interface Experience {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  stepsOrder: string[];
  status: ExperienceStatus;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
