import { render, screen } from "@testing-library/react";
import { ExperienceEditor } from "./ExperienceEditor";
import type { Experience } from "@/lib/types/firestore";

// Mock the sub-components to focus on ExperienceEditor structure
jest.mock("./PreviewMediaUpload", () => ({
  PreviewMediaUpload: () => <div data-testid="preview-media-upload">PreviewMediaUpload</div>,
}));

jest.mock("./CountdownSettings", () => ({
  CountdownSettings: () => <div data-testid="countdown-settings">CountdownSettings</div>,
}));

jest.mock("./OverlaySettings", () => ({
  OverlaySettings: () => <div data-testid="overlay-settings">OverlaySettings</div>,
}));

jest.mock("./AITransformSettings", () => ({
  AITransformSettings: () => <div data-testid="ai-transform-settings">AITransformSettings</div>,
}));

jest.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: jest.fn(),
}));

describe("ExperienceEditor Component - User Story 1", () => {
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();

  const mockExperience: Experience = {
    id: "exp-1",
    eventId: "event-1",
    label: "Test Experience",
    type: "photo",
    enabled: true,
    previewPath: undefined,
    previewType: undefined,
    countdownEnabled: false,
    countdownSeconds: 3,
    overlayEnabled: false,
    overlayFramePath: undefined,
    aiEnabled: true,
    aiModel: "nanobanana",
    aiPrompt: "Test prompt",
    aiReferenceImagePaths: [],
    aiAspectRatio: "1:1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const defaultProps = {
    experience: mockExperience,
    onSave: mockOnSave,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("T019 - Capture options section is not rendered", () => {
    it("does not render allowCamera controls", () => {
      render(<ExperienceEditor {...defaultProps} />);

      expect(screen.queryByLabelText(/allow camera/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/allow camera/i)).not.toBeInTheDocument();
    });

    it("does not render allowLibrary controls", () => {
      render(<ExperienceEditor {...defaultProps} />);

      expect(screen.queryByLabelText(/allow library/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/allow library/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/photo library/i)).not.toBeInTheDocument();
    });

    it("does not render capture options heading", () => {
      render(<ExperienceEditor {...defaultProps} />);

      expect(screen.queryByText(/capture options/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/capture settings/i)).not.toBeInTheDocument();
    });

    it("does not render logo overlay upload field", () => {
      render(<ExperienceEditor {...defaultProps} />);

      // Check for various possible logo overlay labels
      expect(screen.queryByText(/logo overlay/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/overlay logo/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/logo/i)).not.toBeInTheDocument();
    });

    it("renders only new features (preview media, countdown, frame overlay, AI settings)", () => {
      render(<ExperienceEditor {...defaultProps} />);

      // Verify new components are rendered
      expect(screen.getByTestId("preview-media-upload")).toBeInTheDocument();
      expect(screen.getByTestId("countdown-settings")).toBeInTheDocument();
      expect(screen.getByTestId("overlay-settings")).toBeInTheDocument();
      expect(screen.getByTestId("ai-transform-settings")).toBeInTheDocument();
    });

    it("renders basic settings (label, enabled toggle)", () => {
      render(<ExperienceEditor {...defaultProps} />);

      expect(screen.getByLabelText(/experience label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/enable/i)).toBeInTheDocument();
    });

    it("renders save and delete buttons", () => {
      render(<ExperienceEditor {...defaultProps} />);

      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("does not include deprecated fields in component state or UI", () => {
      const { container } = render(<ExperienceEditor {...defaultProps} />);

      // Check that there are no input/switch elements with deprecated field names
      expect(container.querySelector('[name="allowCamera"]')).not.toBeInTheDocument();
      expect(container.querySelector('[name="allowLibrary"]')).not.toBeInTheDocument();
      expect(container.querySelector('[name="overlayLogoPath"]')).not.toBeInTheDocument();
      expect(container.querySelector('[id="allowCamera"]')).not.toBeInTheDocument();
      expect(container.querySelector('[id="allowLibrary"]')).not.toBeInTheDocument();
      expect(container.querySelector('[id="overlayLogoPath"]')).not.toBeInTheDocument();
    });
  });

  describe("Component structure", () => {
    it("renders Edit Experience heading", () => {
      render(<ExperienceEditor {...defaultProps} />);

      expect(screen.getByText("Edit Experience")).toBeInTheDocument();
    });

    it("renders configuration description", () => {
      render(<ExperienceEditor {...defaultProps} />);

      expect(screen.getByText(/configure photo experience settings/i)).toBeInTheDocument();
    });

    it("displays experience label input with current value", () => {
      render(<ExperienceEditor {...defaultProps} />);

      const labelInput = screen.getByLabelText(/experience label/i) as HTMLInputElement;
      expect(labelInput.value).toBe("Test Experience");
    });

    it("displays character count for label (max 50 characters)", () => {
      render(<ExperienceEditor {...defaultProps} />);

      expect(screen.getByText(/15\/50 characters/i)).toBeInTheDocument();
    });
  });
});
