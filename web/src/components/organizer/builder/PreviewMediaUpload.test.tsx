import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreviewMediaUpload } from "./PreviewMediaUpload";
import * as experiencesActions from "@/lib/actions/experiences";

// Mock the server actions
jest.mock("@/lib/actions/experiences", () => ({
  uploadPreviewMedia: jest.fn(),
  deletePreviewMedia: jest.fn(),
}));

describe("PreviewMediaUpload Component - User Story 2", () => {
  const mockOnUpload = jest.fn();
  const mockOnRemove = jest.fn();

  const defaultProps = {
    eventId: "event-1",
    experienceId: "exp-1",
    onUpload: mockOnUpload,
    onRemove: mockOnRemove,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("T031 - Image preview rendering", () => {
    it("renders image preview when previewPath and previewType='image' are provided", () => {
      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/image.jpg"
          previewType="image"
        />
      );

      const img = screen.getByRole("img", { name: /preview media/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("uses img element for image type (not video)", () => {
      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/image.jpg"
          previewType="image"
        />
      );

      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(screen.queryByRole("video")).not.toBeInTheDocument();
    });

    it("displays remove button when image preview is shown", () => {
      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/image.jpg"
          previewType="image"
        />
      );

      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });

    it("does not render preview when previewPath is not provided", () => {
      render(<PreviewMediaUpload {...defaultProps} />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  describe("T032 - GIF preview rendering", () => {
    it("renders GIF preview using img element (not video)", () => {
      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/animated.gif"
          previewType="gif"
        />
      );

      const img = screen.getByRole("img", { name: /preview media/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/animated.gif");
    });

    it("GIF uses img element which autoplays by default", () => {
      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/animated.gif"
          previewType="gif"
        />
      );

      // GIFs in img tags autoplay by default (no need for video controls)
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(screen.queryByRole("video")).not.toBeInTheDocument();
    });

    it("displays remove button for GIF preview", () => {
      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/animated.gif"
          previewType="gif"
        />
      );

      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });
  });

  describe("T033 - Video preview rendering", () => {
    it("renders video preview when previewType='video'", () => {
      const { container } = render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/video.mp4"
          previewType="video"
        />
      );

      const video = container.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("src", "https://example.com/video.mp4");
    });

    it("video has autoplay, muted, loop, and playsinline attributes", () => {
      const { container } = render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/video.mp4"
          previewType="video"
        />
      );

      const video = container.querySelector("video");
      expect(video).toHaveAttribute("autoplay");
      expect(video).toHaveProperty("muted", true);
      expect(video).toHaveAttribute("loop");
      expect(video).toHaveAttribute("playsinline");
    });

    it("uses video element for video type (not img)", () => {
      const { container } = render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/video.mp4"
          previewType="video"
        />
      );

      expect(container.querySelector("video")).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: /preview media/i })).not.toBeInTheDocument();
    });

    it("displays remove button for video preview", () => {
      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/video.mp4"
          previewType="video"
        />
      );

      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });
  });

  describe("Upload functionality", () => {
    it("displays upload button with correct text when no media", () => {
      render(<PreviewMediaUpload {...defaultProps} />);

      const uploadButton = screen.getByRole("button", { name: /upload media/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it("displays replace button text when media exists", () => {
      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/image.jpg"
          previewType="image"
        />
      );

      const uploadButton = screen.getByRole("button", { name: /replace media/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it("accepts correct MIME types in file input", () => {
      const { container } = render(<PreviewMediaUpload {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute(
        "accept",
        "image/png,image/jpeg,image/gif,video/mp4,video/webm"
      );
    });

    it("calls uploadPreviewMedia action when file is selected", async () => {
      const mockUploadResult = {
        success: true as const,
        data: {
          publicUrl: "https://example.com/new-image.jpg",
          fileType: "image" as const,
          sizeBytes: 1024,
        },
      };

      jest.spyOn(experiencesActions, "uploadPreviewMedia").mockResolvedValue(mockUploadResult);

      const { container } = render(<PreviewMediaUpload {...defaultProps} />);
      const user = userEvent.setup();

      const file = new File(["test"], "test.png", { type: "image/png" });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(experiencesActions.uploadPreviewMedia).toHaveBeenCalledWith(
          "event-1",
          "exp-1",
          file
        );
      });

      expect(mockOnUpload).toHaveBeenCalledWith(
        "https://example.com/new-image.jpg",
        "image"
      );
    });

    it("shows uploading state during upload", async () => {
      jest.spyOn(experiencesActions, "uploadPreviewMedia").mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { container } = render(<PreviewMediaUpload {...defaultProps} />);
      const user = userEvent.setup();

      const file = new File(["test"], "test.png", { type: "image/png" });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /uploading/i })).toBeInTheDocument();
      });
    });
  });

  describe("Remove functionality", () => {
    it("calls deletePreviewMedia action when remove button is clicked", async () => {
      const mockDeleteResult = {
        success: true as const,
        data: undefined,
      };

      jest.spyOn(experiencesActions, "deletePreviewMedia").mockResolvedValue(mockDeleteResult);

      render(
        <PreviewMediaUpload
          {...defaultProps}
          previewPath="https://example.com/image.jpg"
          previewType="image"
        />
      );

      const user = userEvent.setup();
      const removeButton = screen.getByRole("button", { name: /remove/i });

      await user.click(removeButton);

      await waitFor(() => {
        expect(experiencesActions.deletePreviewMedia).toHaveBeenCalledWith(
          "event-1",
          "exp-1",
          "https://example.com/image.jpg"
        );
      });

      expect(mockOnRemove).toHaveBeenCalled();
    });
  });

  describe("Helper text", () => {
    it("displays helper text about preview media appearing on guest start screen", () => {
      render(<PreviewMediaUpload {...defaultProps} />);

      expect(
        screen.getByText(/this media will appear on the guest start screen/i)
      ).toBeInTheDocument();
    });

    it("helper text mentions supported formats and size limit", () => {
      render(<PreviewMediaUpload {...defaultProps} />);

      const helperText = screen.getByText(/supports.*max 10mb/i);
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveTextContent(/jpg.*png.*gif.*mp4.*webm/i);
    });
  });
});
