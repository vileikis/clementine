import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverlaySettings } from "./OverlaySettings";
import * as experiencesActions from "../../actions/photo-media";

// Mock the server actions
jest.mock("../../actions/photo-media", () => ({
  uploadFrameOverlay: jest.fn(),
  deleteFrameOverlay: jest.fn(),
}));

describe("OverlaySettings Component", () => {
  const mockOnUpload = jest.fn();
  const mockOnRemove = jest.fn();

  const defaultProps = {
    experienceId: "exp-1",
    onUpload: mockOnUpload,
    onRemove: mockOnRemove,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders frame overlay heading", () => {
      render(<OverlaySettings {...defaultProps} />);

      expect(screen.getByText("Frame Overlay")).toBeInTheDocument();
    });

    it("shows upload area always (no toggle)", () => {
      render(<OverlaySettings {...defaultProps} />);

      expect(screen.getByLabelText(/upload frame/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /upload overlay/i })).toBeInTheDocument();
    });

    it("displays helper text about overlay usage", () => {
      render(<OverlaySettings {...defaultProps} />);

      expect(
        screen.getByText(/the frame will be overlaid on top of guest photos/i)
      ).toBeInTheDocument();
    });

    it("helper text recommends PNG for transparency", () => {
      render(<OverlaySettings {...defaultProps} />);

      expect(screen.getByText(/png recommended for transparency/i)).toBeInTheDocument();
    });
  });

  describe("Preview rendering", () => {
    it("renders overlay preview when overlayUrl is provided", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayUrl="https://example.com/overlay.png"
        />
      );

      const img = screen.getByRole("img", { name: /frame overlay/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/overlay.png");
    });

    it("displays remove button when overlay preview is shown", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayUrl="https://example.com/overlay.png"
        />
      );

      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });

    it("preview uses img element with object-contain for proper display", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayUrl="https://example.com/overlay.png"
        />
      );

      const img = screen.getByRole("img", { name: /frame overlay/i });
      expect(img).toHaveClass("object-contain");
    });

    it("does not render preview when overlayUrl is not provided", () => {
      render(<OverlaySettings {...defaultProps} />);

      expect(screen.queryByRole("img", { name: /frame overlay/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  describe("Upload functionality", () => {
    it("displays upload button text when no overlay exists", () => {
      render(<OverlaySettings {...defaultProps} />);

      expect(screen.getByRole("button", { name: /upload overlay/i })).toBeInTheDocument();
    });

    it("displays replace button text when overlay exists", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayUrl="https://example.com/overlay.png"
        />
      );

      expect(screen.getByRole("button", { name: /replace overlay/i })).toBeInTheDocument();
    });

    it("accepts PNG, JPG, and JPEG file types", () => {
      const { container } = render(<OverlaySettings {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute("accept", "image/png,image/jpeg,image/jpg");
    });

    it("calls uploadFrameOverlay action when file is selected", async () => {
      const mockUploadResult = {
        success: true as const,
        data: {
          publicUrl: "https://example.com/new-overlay.png",
          sizeBytes: 1024,
        },
      };

      jest.spyOn(experiencesActions, "uploadFrameOverlay").mockResolvedValue(mockUploadResult);

      render(<OverlaySettings {...defaultProps} />);
      const user = userEvent.setup();

      const file = new File(["test"], "overlay.png", { type: "image/png" });
      const fileInput = screen.getByLabelText(/upload frame/i) as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(experiencesActions.uploadFrameOverlay).toHaveBeenCalledWith(
          "exp-1",
          file
        );
      });

      expect(mockOnUpload).toHaveBeenCalledWith("https://example.com/new-overlay.png");
    });

    it("shows uploading state during upload", async () => {
      jest.spyOn(experiencesActions, "uploadFrameOverlay").mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<OverlaySettings {...defaultProps} />);
      const user = userEvent.setup();

      const file = new File(["test"], "overlay.png", { type: "image/png" });
      const fileInput = screen.getByLabelText(/upload frame/i) as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /uploading/i })).toBeInTheDocument();
      });
    });
  });

  describe("Remove functionality", () => {
    it("calls deleteFrameOverlay action when remove button is clicked", async () => {
      const mockDeleteResult = {
        success: true as const,
        data: undefined,
      };

      jest.spyOn(experiencesActions, "deleteFrameOverlay").mockResolvedValue(mockDeleteResult);

      render(
        <OverlaySettings
          {...defaultProps}
          overlayUrl="https://example.com/overlay.png"
        />
      );

      const user = userEvent.setup();
      const removeButton = screen.getByRole("button", { name: /remove/i });

      await user.click(removeButton);

      await waitFor(() => {
        expect(experiencesActions.deleteFrameOverlay).toHaveBeenCalledWith(
          "exp-1",
          "https://example.com/overlay.png"
        );
      });

      expect(mockOnRemove).toHaveBeenCalled();
    });
  });

  describe("Disabled state", () => {
    it("disables upload button when disabled prop is true", () => {
      render(<OverlaySettings {...defaultProps} disabled={true} />);

      const uploadButton = screen.getByRole("button", { name: /upload overlay/i });
      expect(uploadButton).toBeDisabled();
    });

    it("disables remove button when disabled prop is true", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayUrl="https://example.com/overlay.png"
          disabled={true}
        />
      );

      const removeButton = screen.getByRole("button", { name: /remove/i });
      expect(removeButton).toBeDisabled();
    });
  });
});
