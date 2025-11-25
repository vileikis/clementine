import { render, screen } from "@testing-library/react";
import { ExperienceEditor } from "./ExperienceEditor";
import type { PhotoExperience, GifExperience } from "../../schemas";

// Mock the type-specific editor components
jest.mock("../photo/PhotoExperienceEditor", () => ({
  PhotoExperienceEditor: ({ experience }: { experience: PhotoExperience }) => (
    <div data-testid="photo-experience-editor">
      PhotoExperienceEditor: {experience.label}
    </div>
  ),
}));

jest.mock("../gif/GifExperienceEditor", () => ({
  GifExperienceEditor: ({ experience }: { experience: GifExperience }) => (
    <div data-testid="gif-experience-editor">
      GifExperienceEditor: {experience.label}
    </div>
  ),
}));

describe("ExperienceEditor Component - Discriminated Union Routing", () => {
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();

  const baseExperience = {
    id: "exp-1",
    eventId: "event-1",
    label: "Test Experience",
    enabled: true,
    hidden: false,
    previewPath: undefined,
    previewType: undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockPhotoExperience: PhotoExperience = {
    ...baseExperience,
    type: "photo",
    config: {
      countdown: 3,
      overlayFramePath: null,
    },
    aiConfig: {
      enabled: true,
      model: "nanobanana", // cspell:disable-line
      prompt: "Test prompt",
      referenceImagePaths: null,
      aspectRatio: "1:1",
    },
  };

  const mockGifExperience: GifExperience = {
    ...baseExperience,
    type: "gif",
    config: {
      frameCount: 5,
      intervalMs: 300,
      loopCount: 0,
      countdown: 3,
    },
    aiConfig: {
      enabled: false,
      model: null,
      prompt: null,
      referenceImagePaths: null,
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
        config: {
          maxDurationSeconds: 15,
          allowRetake: true,
        },
        aiConfig: {
          enabled: false,
          model: null,
          prompt: null,
          referenceImagePaths: null,
          aspectRatio: "9:16" as const,
        },
      };

      render(
        <ExperienceEditor
          experience={videoExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Video Experience Editor")).toBeInTheDocument();
      expect(screen.getByText(/not yet implemented/)).toBeInTheDocument();
    });

    it("renders placeholder for wheel experience", () => {
      const wheelExperience = {
        ...baseExperience,
        type: "wheel" as const,
        config: {
          items: [
            { id: "1", label: "Prize 1", weight: 1, color: "#FF0000" },
            { id: "2", label: "Prize 2", weight: 1, color: "#00FF00" },
          ],
          spinDurationMs: 3000,
          autoSpin: false,
        },
      };

      render(
        <ExperienceEditor
          experience={wheelExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Wheel Experience Editor")).toBeInTheDocument();
      expect(screen.getByText(/not yet implemented/)).toBeInTheDocument();
    });
  });

  describe("Props forwarding", () => {
    it("passes experience prop to PhotoExperienceEditor", () => {
      render(
        <ExperienceEditor
          experience={mockPhotoExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      // The mock displays the experience label to verify it was passed
      expect(screen.getByText(/Test Experience/)).toBeInTheDocument();
    });

    it("passes experience prop to GifExperienceEditor", () => {
      render(
        <ExperienceEditor
          experience={mockGifExperience}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      );

      // The mock displays the experience label to verify it was passed
      expect(screen.getByText(/Test Experience/)).toBeInTheDocument();
    });
  });
});
