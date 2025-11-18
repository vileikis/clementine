import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverlaySettings } from "./OverlaySettings";
import * as experiencesActions from "../../lib/actions";

// Mock the server actions
jest.mock("../../lib/actions", () => ({
  uploadFrameOverlay: jest.fn(),
  deleteFrameOverlay: jest.fn(),
}));

describe("OverlaySettings Component - User Story 4", () => {
  const mockOnOverlayEnabledChange = jest.fn();
  const mockOnUpload = jest.fn();
  const mockOnRemove = jest.fn();

  const defaultProps = {
    eventId: "event-1",
    experienceId: "exp-1",
    overlayEnabled: false,
    onOverlayEnabledChange: mockOnOverlayEnabledChange,
    onUpload: mockOnUpload,
    onRemove: mockOnRemove,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("T050 - Toggle enables/disables overlay upload", () => {
    it("hides upload area when toggle is disabled", () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={false} />);

      expect(screen.queryByLabelText(/upload frame/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /upload overlay/i })).not.toBeInTheDocument();
    });

    it("shows upload area when toggle is enabled", () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);

      expect(screen.getByLabelText(/upload frame/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /upload overlay/i })).toBeInTheDocument();
    });

    it("calls onOverlayEnabledChange when toggle is clicked", async () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={false} />);
      const user = userEvent.setup();

      // Switch doesn't have an accessible name - find by id or role
      const toggle = screen.getByRole("switch");
      await user.click(toggle);

      expect(mockOnOverlayEnabledChange).toHaveBeenCalledWith(true);
    });

    it("toggle starts unchecked when overlayEnabled is false", () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={false} />);

      const toggle = screen.getByRole("switch");
      expect(toggle).not.toBeChecked();
    });

    it("toggle starts checked when overlayEnabled is true", () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeChecked();
    });

    it("enables toggle automatically when overlay is uploaded", async () => {
      const mockUploadResult = {
        success: true as const,
        data: {
          publicUrl: "https://example.com/overlay.png",
          sizeBytes: 1024,
        },
      };

      jest.spyOn(experiencesActions, "uploadFrameOverlay").mockResolvedValue(mockUploadResult);

      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);
      const user = userEvent.setup();

      const file = new File(["test"], "overlay.png", { type: "image/png" });
      const fileInput = screen.getByLabelText(/upload frame/i) as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnOverlayEnabledChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("T051 - Preview rendering", () => {
    it("renders overlay preview when overlayFramePath is provided and enabled", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayEnabled={true}
          overlayFramePath="https://example.com/overlay.png"
        />
      );

      const img = screen.getByRole("img", { name: /frame overlay/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/overlay.png");
    });

    it("does not render preview when overlayEnabled is false", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayEnabled={false}
          overlayFramePath="https://example.com/overlay.png"
        />
      );

      expect(screen.queryByRole("img", { name: /frame overlay/i })).not.toBeInTheDocument();
    });

    it("displays remove button when overlay preview is shown", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayEnabled={true}
          overlayFramePath="https://example.com/overlay.png"
        />
      );

      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });

    it("preview uses img element with object-contain for proper display", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayEnabled={true}
          overlayFramePath="https://example.com/overlay.png"
        />
      );

      const img = screen.getByRole("img", { name: /frame overlay/i });
      expect(img).toHaveClass("object-contain");
    });

    it("does not render preview when overlayFramePath is not provided", () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);

      expect(screen.queryByRole("img", { name: /frame overlay/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  describe("Upload functionality", () => {
    it("displays upload button text when no overlay exists", () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);

      expect(screen.getByRole("button", { name: /upload overlay/i })).toBeInTheDocument();
    });

    it("displays replace button text when overlay exists", () => {
      render(
        <OverlaySettings
          {...defaultProps}
          overlayEnabled={true}
          overlayFramePath="https://example.com/overlay.png"
        />
      );

      expect(screen.getByRole("button", { name: /replace overlay/i })).toBeInTheDocument();
    });

    it("accepts PNG, JPG, and JPEG file types", () => {
      const { container } = render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);

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

      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);
      const user = userEvent.setup();

      const file = new File(["test"], "overlay.png", { type: "image/png" });
      const fileInput = screen.getByLabelText(/upload frame/i) as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(experiencesActions.uploadFrameOverlay).toHaveBeenCalledWith(
          "event-1",
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

      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);
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
          overlayEnabled={true}
          overlayFramePath="https://example.com/overlay.png"
        />
      );

      const user = userEvent.setup();
      const removeButton = screen.getByRole("button", { name: /remove/i });

      await user.click(removeButton);

      await waitFor(() => {
        expect(experiencesActions.deleteFrameOverlay).toHaveBeenCalledWith(
          "event-1",
          "exp-1",
          "https://example.com/overlay.png"
        );
      });

      expect(mockOnRemove).toHaveBeenCalled();
    });
  });

  describe("Additional features", () => {
    it("renders frame overlay heading", () => {
      render(<OverlaySettings {...defaultProps} />);

      expect(screen.getByText("Frame Overlay")).toBeInTheDocument();
    });

    it("displays helper text about overlay usage", () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);

      expect(
        screen.getByText(/the frame will be overlaid on top of guest photos/i)
      ).toBeInTheDocument();
    });

    it("helper text recommends PNG for transparency", () => {
      render(<OverlaySettings {...defaultProps} overlayEnabled={true} />);

      expect(screen.getByText(/png recommended for transparency/i)).toBeInTheDocument();
    });

    it("disables toggle when disabled prop is true", () => {
      render(<OverlaySettings {...defaultProps} disabled={true} />);

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeDisabled();
    });
  });
});
