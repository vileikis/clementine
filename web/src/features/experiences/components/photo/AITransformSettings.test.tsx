import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AITransformSettings } from "./AITransformSettings";
import { AI_MODEL_PROMPT_GUIDES } from "../../lib/constants";

// Mock the ImageUploadField component to simplify testing
jest.mock("./ImageUploadField", () => ({
  ImageUploadField: ({ label, onChange }: { label: string; onChange: (url: string) => void }) => (
    <button onClick={() => onChange("https://example.com/ref.png")}>{label}</button>
  ),
}));

describe("AITransformSettings Component - User Story 5", () => {
  const mockOnAiModelChange = jest.fn();
  const mockOnAiPromptChange = jest.fn();
  const mockOnAiReferenceImagePathsChange = jest.fn();
  const mockOnAiAspectRatioChange = jest.fn();

  const defaultProps = {
    aiModel: "nanobanana",
    aiPrompt: "",
    aiReferenceImagePaths: [],
    aiAspectRatio: "1:1" as const,
    onAiModelChange: mockOnAiModelChange,
    onAiPromptChange: mockOnAiPromptChange,
    onAiReferenceImagePathsChange: mockOnAiReferenceImagePathsChange,
    onAiAspectRatioChange: mockOnAiAspectRatioChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("T062 - Aspect ratio picker displays all 5 options", () => {
    it("renders aspect ratio select component", () => {
      render(<AITransformSettings {...defaultProps} />);

      const aspectRatioTrigger = screen.getByRole("combobox", { name: /aspect ratio/i });
      expect(aspectRatioTrigger).toBeInTheDocument();
    });

    it("displays current aspect ratio value 1:1 in select", () => {
      render(<AITransformSettings {...defaultProps} aiAspectRatio="1:1" />);

      const aspectRatioTrigger = screen.getByRole("combobox", { name: /aspect ratio/i });
      expect(aspectRatioTrigger).toHaveTextContent("1:1");
    });

    it("displays current aspect ratio value 3:4 in select", () => {
      render(<AITransformSettings {...defaultProps} aiAspectRatio="3:4" />);

      const aspectRatioTrigger = screen.getByRole("combobox", { name: /aspect ratio/i });
      expect(aspectRatioTrigger).toHaveTextContent("3:4");
    });

    it("displays current aspect ratio value 4:5 in select", () => {
      render(<AITransformSettings {...defaultProps} aiAspectRatio="4:5" />);

      const aspectRatioTrigger = screen.getByRole("combobox", { name: /aspect ratio/i });
      expect(aspectRatioTrigger).toHaveTextContent("4:5");
    });

    it("displays current aspect ratio value 9:16 in select", () => {
      render(<AITransformSettings {...defaultProps} aiAspectRatio="9:16" />);

      const aspectRatioTrigger = screen.getByRole("combobox", { name: /aspect ratio/i });
      expect(aspectRatioTrigger).toHaveTextContent("9:16");
    });

    it("displays current aspect ratio value 16:9 in select", () => {
      render(<AITransformSettings {...defaultProps} aiAspectRatio="16:9" />);

      const aspectRatioTrigger = screen.getByRole("combobox", { name: /aspect ratio/i });
      expect(aspectRatioTrigger).toHaveTextContent("16:9");
    });

    it("verifies all 5 aspect ratio options are defined in component", () => {
      // This test verifies the ASPECT_RATIO_OPTIONS array structure
      // by checking that all 5 values can be rendered
      const ratios: Array<"1:1" | "3:4" | "4:5" | "9:16" | "16:9"> = ["1:1", "3:4", "4:5", "9:16", "16:9"];

      ratios.forEach(ratio => {
        const { unmount } = render(<AITransformSettings {...defaultProps} aiAspectRatio={ratio} />);
        const trigger = screen.getByRole("combobox", { name: /aspect ratio/i });
        expect(trigger).toHaveTextContent(ratio);
        unmount(); // Clean up between renders
      });
    });
  });

  describe("T063 - Prompt Guide link URL changes based on selected model", () => {
    it("displays Prompt Guide link when model has guide URL", () => {
      render(<AITransformSettings {...defaultProps} aiModel="nanobanana" />);

      const promptGuideLink = screen.getByRole("link", { name: /prompt guide/i });
      expect(promptGuideLink).toBeInTheDocument();
    });

    it("Prompt Guide link has correct URL for nanobanana model", () => {
      render(<AITransformSettings {...defaultProps} aiModel="nanobanana" />);

      const promptGuideLink = screen.getByRole("link", { name: /prompt guide/i });
      expect(promptGuideLink).toHaveAttribute("href", AI_MODEL_PROMPT_GUIDES.nanobanana);
      expect(promptGuideLink).toHaveAttribute(
        "href",
        "https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide"
      );
    });

    it("Prompt Guide link opens in new tab", () => {
      render(<AITransformSettings {...defaultProps} aiModel="nanobanana" />);

      const promptGuideLink = screen.getByRole("link", { name: /prompt guide/i });
      expect(promptGuideLink).toHaveAttribute("target", "_blank");
    });

    it("Prompt Guide link has noopener noreferrer for security", () => {
      render(<AITransformSettings {...defaultProps} aiModel="nanobanana" />);

      const promptGuideLink = screen.getByRole("link", { name: /prompt guide/i });
      expect(promptGuideLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("does not display Prompt Guide link when model has no guide URL", () => {
      render(<AITransformSettings {...defaultProps} aiModel="unknown-model" />);

      const promptGuideLink = screen.queryByRole("link", { name: /prompt guide/i });
      expect(promptGuideLink).not.toBeInTheDocument();
    });

    it("Prompt Guide link is touch-friendly (minimum 44px height)", () => {
      render(<AITransformSettings {...defaultProps} aiModel="nanobanana" />);

      const promptGuideLink = screen.getByRole("link", { name: /prompt guide/i });
      expect(promptGuideLink).toHaveClass("min-h-[44px]");
    });
  });

  describe("T064 - Reference images horizontal layout with flex-wrap", () => {
    it("displays reference images in horizontal container with flex-wrap", () => {
      const referenceImages = [
        "https://example.com/ref1.png",
        "https://example.com/ref2.png",
        "https://example.com/ref3.png",
      ];

      render(<AITransformSettings {...defaultProps} aiReferenceImagePaths={referenceImages} />);

      // Find the container with reference images
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(3);

      // Check that images have correct alt text
      expect(screen.getByAltText("Reference 1")).toBeInTheDocument();
      expect(screen.getByAltText("Reference 2")).toBeInTheDocument();
      expect(screen.getByAltText("Reference 3")).toBeInTheDocument();
    });

    it("reference images container uses flex and flex-wrap classes", () => {
      const referenceImages = ["https://example.com/ref1.png"];

      const { container } = render(
        <AITransformSettings {...defaultProps} aiReferenceImagePaths={referenceImages} />
      );

      // Find the flex container
      const flexContainer = container.querySelector(".flex.flex-wrap");
      expect(flexContainer).toBeInTheDocument();
    });

    it("reference images have consistent sizing (w-32 h-32)", () => {
      const referenceImages = ["https://example.com/ref1.png", "https://example.com/ref2.png"];

      const { container } = render(
        <AITransformSettings {...defaultProps} aiReferenceImagePaths={referenceImages} />
      );

      const imageContainers = container.querySelectorAll(".w-32.h-32");
      expect(imageContainers).toHaveLength(2);
    });

    it("reference images have flex-shrink-0 to prevent shrinking", () => {
      const referenceImages = ["https://example.com/ref1.png"];

      const { container } = render(
        <AITransformSettings {...defaultProps} aiReferenceImagePaths={referenceImages} />
      );

      const imageContainer = container.querySelector(".flex-shrink-0");
      expect(imageContainer).toBeInTheDocument();
    });

    it("does not display reference images container when no images", () => {
      render(<AITransformSettings {...defaultProps} aiReferenceImagePaths={[]} />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("displays remove button for each reference image", () => {
      const referenceImages = ["https://example.com/ref1.png", "https://example.com/ref2.png"];

      render(<AITransformSettings {...defaultProps} aiReferenceImagePaths={referenceImages} />);

      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      expect(removeButtons).toHaveLength(2);
    });

    it("remove buttons are touch-friendly (minimum 44x44px)", () => {
      const referenceImages = ["https://example.com/ref1.png"];

      render(<AITransformSettings {...defaultProps} aiReferenceImagePaths={referenceImages} />);

      const removeButton = screen.getByRole("button", { name: /remove/i });
      expect(removeButton).toHaveClass("min-h-[44px]");
      expect(removeButton).toHaveClass("min-w-[44px]");
    });

    it("calls onAiReferenceImagePathsChange when removing image", async () => {
      const referenceImages = [
        "https://example.com/ref1.png",
        "https://example.com/ref2.png",
        "https://example.com/ref3.png",
      ];

      render(<AITransformSettings {...defaultProps} aiReferenceImagePaths={referenceImages} />);
      const user = userEvent.setup();

      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      await user.click(removeButtons[1]); // Remove second image

      expect(mockOnAiReferenceImagePathsChange).toHaveBeenCalledWith([
        "https://example.com/ref1.png",
        "https://example.com/ref3.png",
      ]);
    });

    it("displays helper text about horizontal row layout", () => {
      render(<AITransformSettings {...defaultProps} />);

      expect(
        screen.getByText(/images appear in a horizontal row/i)
      ).toBeInTheDocument();
    });
  });

  describe("Additional features", () => {
    it("renders AI Model select", () => {
      render(<AITransformSettings {...defaultProps} />);

      expect(screen.getByLabelText(/ai model/i)).toBeInTheDocument();
    });

    it("renders AI Prompt textarea", () => {
      render(<AITransformSettings {...defaultProps} />);

      expect(screen.getByLabelText(/ai prompt/i)).toBeInTheDocument();
    });

    it("displays aspect ratio helper text", () => {
      render(<AITransformSettings {...defaultProps} />);

      expect(
        screen.getByText(/choose the output aspect ratio for ai-generated photos/i)
      ).toBeInTheDocument();
    });

    it("displays prompt character count", () => {
      render(<AITransformSettings {...defaultProps} aiPrompt="Test prompt" />);

      expect(screen.getByText(/11\/600 characters/i)).toBeInTheDocument();
    });

    it("calls onAiPromptChange when typing in textarea", async () => {
      render(<AITransformSettings {...defaultProps} />);
      const user = userEvent.setup();

      const textarea = screen.getByLabelText(/ai prompt/i);
      await user.type(textarea, "New prompt");

      expect(mockOnAiPromptChange).toHaveBeenCalled();
    });

    it("disables all inputs when disabled prop is true", () => {
      render(<AITransformSettings {...defaultProps} disabled={true} />);

      expect(screen.getByRole("combobox", { name: /ai model/i })).toBeDisabled();
      expect(screen.getByRole("combobox", { name: /aspect ratio/i })).toBeDisabled();
      expect(screen.getByLabelText(/ai prompt/i)).toBeDisabled();
    });
  });
});
