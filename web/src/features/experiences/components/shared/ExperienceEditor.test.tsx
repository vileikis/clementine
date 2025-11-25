import { render, screen } from "@testing-library/react";
import { ExperienceEditor } from "./ExperienceEditor";
import type { PhotoExperience, GifExperience } from "../../schemas";

// Mock the type-specific editor components
jest.mock("../photo/PhotoExperienceEditor", () => ({
  PhotoExperienceEditor: ({ experience }: { experience: PhotoExperience }) => (
    <div data-testid="photo-experience-editor">
      PhotoExperienceEditor: {experience.name}
    </div>
  ),
}));

jest.mock("../gif/GifExperienceEditor", () => ({
  GifExperienceEditor: ({ experience }: { experience: GifExperience }) => (
    <div data-testid="gif-experience-editor">
      GifExperienceEditor: {experience.name}
    </div>
  ),
}));

describe("ExperienceEditor Component - Discriminated Union Routing", () => {
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockEventId = "event-1";

  const baseExperience = {
    id: "exp-1",
    companyId: "company-1",
    eventIds: ["event-1"],
    name: "Test Experience",
    enabled: true,
    previewMediaUrl: undefined,
    previewMediaType: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockPhotoExperience: PhotoExperience = {
    ...baseExperience,
    type: "photo",
    captureConfig: {
      countdown: 3,
      cameraFacing: "front",
      overlayUrl: null,
    },
    aiPhotoConfig: {
      enabled: true,
      model: "nanobanana", // cspell:disable-line
      prompt: "Test prompt",
      referenceImageUrls: null,
      aspectRatio: "1:1",
    },
  };

  const mockGifExperience: GifExperience = {
    ...baseExperience,
    type: "gif",
    captureConfig: {
      countdown: 3,
      cameraFacing: "front",
      frameCount: 5,
    },
    aiPhotoConfig: {
      enabled: false,
      model: null,
      prompt: null,
      referenceImageUrls: null,
      aspectRatio: "1:1",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Type-based routing", () => {
    it("routes photo experience to PhotoExperienceEditor", () => {
      render(
        <ExperienceEditor
          eventId={mockEventId}
          experience={mockPhotoExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId("photo-experience-editor")).toBeInTheDocument();
      expect(screen.getByText(/PhotoExperienceEditor: Test Experience/)).toBeInTheDocument();
      expect(screen.queryByTestId("gif-experience-editor")).not.toBeInTheDocument();
    });

    it("routes gif experience to GifExperienceEditor", () => {
      render(
        <ExperienceEditor
          eventId={mockEventId}
          experience={mockGifExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId("gif-experience-editor")).toBeInTheDocument();
      expect(screen.getByText(/GifExperienceEditor: Test Experience/)).toBeInTheDocument();
      expect(screen.queryByTestId("photo-experience-editor")).not.toBeInTheDocument();
    });

    it("renders placeholder for video experience", () => {
      const videoExperience = {
        ...baseExperience,
        type: "video" as const,
        captureConfig: {
          countdown: 3,
          cameraFacing: "front" as const,
          maxDuration: 15,
        },
        aiVideoConfig: {
          enabled: false,
          model: null,
          prompt: null,
          referenceImageUrls: null,
          aspectRatio: "9:16" as const,
        },
      };

      render(
        <ExperienceEditor
          eventId={mockEventId}
          experience={videoExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Video Experience Editor")).toBeInTheDocument();
      expect(screen.getByText(/not yet implemented/)).toBeInTheDocument();
    });
  });

  describe("Props forwarding", () => {
    it("passes experience prop to PhotoExperienceEditor", () => {
      render(
        <ExperienceEditor
          eventId={mockEventId}
          experience={mockPhotoExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      // The mock displays the experience name to verify it was passed
      expect(screen.getByText(/Test Experience/)).toBeInTheDocument();
    });

    it("passes experience prop to GifExperienceEditor", () => {
      render(
        <ExperienceEditor
          eventId={mockEventId}
          experience={mockGifExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      // The mock displays the experience name to verify it was passed
      expect(screen.getByText(/Test Experience/)).toBeInTheDocument();
    });
  });
});
