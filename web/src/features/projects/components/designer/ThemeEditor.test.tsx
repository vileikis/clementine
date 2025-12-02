/**
 * Tests for ThemeEditor component (V4 schema)
 *
 * Tests cover:
 * - Rendering all 7 theme sections (Identity, Primary Color, Text, Button, Background, Logo, Font)
 * - useReducer state management pattern
 * - Form interactions for each theme section
 * - Save functionality with server action integration
 * - Live preview updates
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeEditor } from "./ThemeEditor";
import type { Project } from "../../types/project.types";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: jest.fn(),
}));

jest.mock("../../actions/events", () => ({
  updateEventTheme: jest.fn(),
}));

jest.mock("@/components/shared/ImageUploadField", () => ({
  ImageUploadField: ({ id, label, value, onChange, disabled }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid={`image-upload-${id}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-testid={`image-input-${id}`}
      />
    </div>
  ),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

import { updateProjectTheme } from "../../actions/projects.actions";
import { toast } from "sonner";

const mockUpdateEventTheme = updateEventTheme as jest.MockedFunction<typeof updateEventTheme>;

// V4 schema mock event helper
function createMockEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-123",
    name: "Test Event",
    status: "draft",
    ownerId: "company-123",
    joinPath: "/join/event-123",
    qrPngPath: "events/event-123/qr/join.png",
    publishStartAt: null,
    publishEndAt: null,
    activeJourneyId: null,
    theme: {
      logoUrl: null,
      fontFamily: null,
      primaryColor: "#3B82F6",
      text: {
        color: "#000000",
        alignment: "center",
      },
      button: {
        backgroundColor: null,
        textColor: "#FFFFFF",
        radius: "md",
      },
      background: {
        color: "#F9FAFB",
        image: null,
        overlayOpacity: 0.5,
      },
    },
    createdAt: 1234567890,
    updatedAt: 1234567890,
    ...overrides,
  };
}

describe("ThemeEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the component with all sections", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      // Check main heading
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Event Theme");

      // Check section headings (h3 elements)
      const sectionHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(sectionHeadings.map(h => h.textContent)).toEqual(
        expect.arrayContaining(["Identity", "Primary Color", "Text", "Button", "Background"])
      );
    });

    it("renders the Save Changes button", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    it("renders the live preview panel", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      // Preview panel should show event preview content
      expect(screen.getByText("Event Preview")).toBeInTheDocument();
      expect(screen.getByText("This is how your theme will look")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /primary button/i })).toBeInTheDocument();
    });
  });

  describe("Identity Section", () => {
    it("renders logo upload field", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      expect(screen.getByTestId("image-upload-theme-logo")).toBeInTheDocument();
    });

    it("renders font family input", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const fontInput = screen.getByLabelText(/font family/i);
      expect(fontInput).toBeInTheDocument();
      expect(fontInput).toHaveAttribute("placeholder", "Inter, sans-serif");
    });

    it("displays existing logo URL", () => {
      const event = createMockEvent({
        theme: {
          ...createMockEvent().theme,
          logoUrl: "https://example.com/logo.png",
        },
      });
      render(<ThemeEditor event={event} />);

      const logoInput = screen.getByTestId("image-input-theme-logo");
      expect(logoInput).toHaveValue("https://example.com/logo.png");
    });

    it("displays existing font family", () => {
      const event = createMockEvent({
        theme: {
          ...createMockEvent().theme,
          fontFamily: "Roboto, sans-serif",
        },
      });
      render(<ThemeEditor event={event} />);

      expect(screen.getByLabelText(/font family/i)).toHaveValue("Roboto, sans-serif");
    });
  });

  describe("Primary Color Section", () => {
    it("renders primary color input", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      // Primary color has both a color picker and text input
      const colorInput = screen.getByLabelText("Primary Color");
      expect(colorInput).toBeInTheDocument();
    });

    it("updates primary color on change", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      // Get the text input for primary color (the one inside the Primary Color section)
      const colorInputs = screen.getAllByPlaceholderText("#3B82F6");
      const textInput = colorInputs[0]; // First one is the primary color text input
      await userEvent.clear(textInput);
      await userEvent.type(textInput, "#FF5733");

      expect(textInput).toHaveValue("#FF5733");
    });
  });

  describe("Text Section", () => {
    it("renders text color input", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      // Use exact match to avoid collision with "Button Text Color"
      expect(screen.getByLabelText("Text Color")).toBeInTheDocument();
    });

    it("renders text alignment selector", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const alignmentSelect = screen.getByLabelText(/text alignment/i);
      expect(alignmentSelect).toBeInTheDocument();
      expect(alignmentSelect).toHaveValue("center");
    });

    it("updates text alignment on change", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const alignmentSelect = screen.getByLabelText(/text alignment/i);
      await userEvent.selectOptions(alignmentSelect, "left");

      expect(alignmentSelect).toHaveValue("left");
    });
  });

  describe("Button Section", () => {
    it("renders button background color input", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      expect(screen.getByLabelText(/button background color/i)).toBeInTheDocument();
    });

    it("renders button text color input", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      expect(screen.getByLabelText(/button text color/i)).toBeInTheDocument();
    });

    it("renders button radius selector", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const radiusSelect = screen.getByLabelText(/button radius/i);
      expect(radiusSelect).toBeInTheDocument();
      expect(radiusSelect).toHaveValue("md");
    });

    it("updates button radius on change", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const radiusSelect = screen.getByLabelText(/button radius/i);
      await userEvent.selectOptions(radiusSelect, "full");

      expect(radiusSelect).toHaveValue("full");
    });

    it("shows primary color when button background is null", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      // Button background inherits primary color when null
      const bgColorInputs = screen.getAllByDisplayValue("#3B82F6");
      expect(bgColorInputs.length).toBeGreaterThan(0);
    });
  });

  describe("Background Section", () => {
    it("renders background color input", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      // Use exact label match to avoid collision with "Button Background Color"
      expect(screen.getByLabelText("Background Color")).toBeInTheDocument();
    });

    it("renders background image upload", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      expect(screen.getByTestId("image-upload-theme-bg-image")).toBeInTheDocument();
    });

    it("renders overlay opacity slider", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const opacitySlider = screen.getByRole("slider");
      expect(opacitySlider).toBeInTheDocument();
      expect(opacitySlider).toHaveValue("0.5");
    });

    it("displays overlay opacity percentage", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      expect(screen.getByText(/overlay opacity: 50%/i)).toBeInTheDocument();
    });

    it("updates overlay opacity on slider change", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const opacitySlider = screen.getByRole("slider");
      fireEvent.change(opacitySlider, { target: { value: "0.8" } });

      expect(opacitySlider).toHaveValue("0.8");
      expect(screen.getByText(/overlay opacity: 80%/i)).toBeInTheDocument();
    });
  });

  describe("Save Functionality", () => {
    it("calls updateEventTheme on save with all theme fields", async () => {
      mockUpdateEventTheme.mockResolvedValue({ success: true, data: undefined });

      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateEventTheme).toHaveBeenCalledWith("event-123", {
          primaryColor: "#3B82F6",
          logoUrl: null,
          fontFamily: null,
          text: {
            color: "#000000",
            alignment: "center",
          },
          button: {
            backgroundColor: null,
            textColor: "#FFFFFF",
            radius: "md",
          },
          background: {
            color: "#F9FAFB",
            image: null,
            overlayOpacity: 0.5,
          },
        });
      });
    });

    it("shows success toast on successful save", async () => {
      mockUpdateEventTheme.mockResolvedValue({ success: true, data: undefined });

      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Theme settings updated successfully");
      });
    });

    it("shows error toast on failed save", async () => {
      mockUpdateEventTheme.mockResolvedValue({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid color format" },
      });

      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid color format");
      });
    });

    it("disables save button while saving", async () => {
      // Create a promise that we can control
      let resolvePromise: (value: { success: true; data: undefined }) => void;
      const savePromise = new Promise<{ success: true; data: undefined }>((resolve) => {
        resolvePromise = resolve;
      });

      mockUpdateEventTheme.mockImplementation(() => savePromise);

      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);

      // Button should show "Saving..." while pending
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
      });

      // Resolve the save within act to avoid warning
      await act(async () => {
        resolvePromise!({ success: true, data: undefined });
      });

      // Wait for the button to return to normal state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
      });
    });
  });

  describe("Live Preview", () => {
    it("displays logo in preview when set", () => {
      const event = createMockEvent({
        theme: {
          ...createMockEvent().theme,
          logoUrl: "https://example.com/logo.png",
        },
      });
      render(<ThemeEditor event={event} />);

      const logoImg = screen.getByAltText("Event logo");
      expect(logoImg).toHaveAttribute("src", "https://example.com/logo.png");
    });

    it("hides logo in preview when not set", () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      expect(screen.queryByAltText("Event logo")).not.toBeInTheDocument();
    });

    it("applies text color to preview text", () => {
      const event = createMockEvent({
        theme: {
          ...createMockEvent().theme,
          text: { color: "#FF0000", alignment: "center" },
        },
      });
      render(<ThemeEditor event={event} />);

      const previewTitle = screen.getByText("Event Preview");
      expect(previewTitle).toHaveStyle({ color: "#FF0000" });
    });

    it("applies text alignment to preview", () => {
      const event = createMockEvent({
        theme: {
          ...createMockEvent().theme,
          text: { color: "#000000", alignment: "left" },
        },
      });
      render(<ThemeEditor event={event} />);

      // The preview content wrapper should have left alignment
      const previewContent = screen.getByText("Event Preview").parentElement;
      expect(previewContent).toHaveStyle({ textAlign: "left" });
    });

    it("applies button styles to preview button", () => {
      const event = createMockEvent({
        theme: {
          ...createMockEvent().theme,
          button: {
            backgroundColor: "#FF0000",
            textColor: "#00FF00",
            radius: "full",
          },
        },
      });
      render(<ThemeEditor event={event} />);

      const previewButton = screen.getByRole("button", { name: /primary button/i });
      expect(previewButton).toHaveStyle({
        backgroundColor: "#FF0000",
        color: "#00FF00",
        borderRadius: "9999px",
      });
    });

    it("applies background color to preview", () => {
      const event = createMockEvent({
        theme: {
          ...createMockEvent().theme,
          background: { color: "#000000", image: null, overlayOpacity: 0.5 },
        },
      });
      render(<ThemeEditor event={event} />);

      // Find the preview wrapper by its unique styling
      const previewWrapper = screen.getByText("Event Preview").closest(".relative");
      expect(previewWrapper?.parentElement).toHaveStyle({ backgroundColor: "#000000" });
    });
  });

  describe("Reducer State Management", () => {
    it("initializes state from event.theme", () => {
      const event = createMockEvent({
        theme: {
          logoUrl: "https://example.com/logo.png",
          fontFamily: "Roboto",
          primaryColor: "#FF5733",
          text: { color: "#333333", alignment: "left" },
          button: { backgroundColor: "#0000FF", textColor: "#FFFFFF", radius: "full" },
          background: { color: "#EEEEEE", image: "https://example.com/bg.jpg", overlayOpacity: 0.7 },
        },
      });
      render(<ThemeEditor event={event} />);

      // Check that form fields are populated with initial values
      expect(screen.getByTestId("image-input-theme-logo")).toHaveValue("https://example.com/logo.png");
      expect(screen.getByLabelText(/font family/i)).toHaveValue("Roboto");
      expect(screen.getByLabelText(/text alignment/i)).toHaveValue("left");
      expect(screen.getByLabelText(/button radius/i)).toHaveValue("full");
      expect(screen.getByRole("slider")).toHaveValue("0.7");
    });

    it("updates state independently for different fields", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      // Update text alignment
      const alignmentSelect = screen.getByLabelText(/text alignment/i);
      await userEvent.selectOptions(alignmentSelect, "right");
      expect(alignmentSelect).toHaveValue("right");

      // Update button radius
      const radiusSelect = screen.getByLabelText(/button radius/i);
      await userEvent.selectOptions(radiusSelect, "none");
      expect(radiusSelect).toHaveValue("none");

      // Original values should still be correct for unchanged fields
      expect(screen.getByRole("slider")).toHaveValue("0.5");
    });
  });
});
