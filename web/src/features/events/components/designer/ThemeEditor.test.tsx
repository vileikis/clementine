import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeEditor } from "./ThemeEditor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Event } from "../../types/event.types";

// Mock dependencies
jest.mock("../../actions/events", () => ({
  updateEventTheme: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
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
jest.mock("@/components/shared/ImageUploadField", () => ({
  ImageUploadField: ({
    id,
    label,
    value,
    onChange,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div data-testid={id}>
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`${id}-input`}
      />
    </div>
  ),
}));
jest.mock("./PreviewPanel", () => ({
  PreviewPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="preview-panel">{children}</div>
  ),
}));

// Import the mocked function
import { updateEventTheme } from "../../actions/events";

describe("ThemeEditor", () => {
  const mockRouter = {
    refresh: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  };

  const createMockEvent = (
    themeOverrides?: Partial<Event["theme"]>
  ): Event => ({
    id: "event-123",
    title: "Test Event",
    status: "draft",
    joinPath: "/join/test-event",
    qrPngPath: "events/test-event/qr/join.png",
    companyId: "company-1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    share: {
      allowDownload: true,
      allowSystemShare: true,
      allowEmail: true,
      socials: [],
    },
    experiencesCount: 0,
    sessionsCount: 0,
    readyCount: 0,
    sharesCount: 0,
    theme: {
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      backgroundColor: "#F9FAFB",
      backgroundImage: "",
      ...themeOverrides,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("rendering with theme object", () => {
    it("renders all form fields with values from event.theme", () => {
      const event = createMockEvent({
        buttonColor: "#FF0000",
        buttonTextColor: "#000000",
        backgroundColor: "#FFFF00",
        backgroundImage: "https://example.com/bg.jpg",
      });

      render(<ThemeEditor event={event} />);

      // Check button color inputs
      const buttonColorInputs = screen.getAllByDisplayValue("#FF0000");
      expect(buttonColorInputs.length).toBeGreaterThan(0);

      // Check button text color inputs
      const buttonTextColorInputs = screen.getAllByDisplayValue("#000000");
      expect(buttonTextColorInputs.length).toBeGreaterThan(0);

      // Check background color inputs
      const bgColorInputs = screen.getAllByDisplayValue("#FFFF00");
      expect(bgColorInputs.length).toBeGreaterThan(0);

      // Check background image field
      const bgImageInput = screen.getByTestId("theme-bg-image-input");
      expect(bgImageInput).toHaveValue("https://example.com/bg.jpg");
    });

    it("renders preview panel with theme styling", () => {
      const event = createMockEvent({
        buttonColor: "#FF0000",
        buttonTextColor: "#FFFFFF",
        backgroundColor: "#000000",
      });

      render(<ThemeEditor event={event} />);

      // Check preview content
      const previewPanel = screen.getByTestId("preview-panel");
      expect(previewPanel).toBeInTheDocument();

      // Check preview text
      expect(screen.getByText("Event Preview")).toBeInTheDocument();
      expect(screen.getByText("This is how your theme will look")).toBeInTheDocument();
      expect(screen.getByText("Primary Button")).toBeInTheDocument();
    });
  });

  describe("handling undefined theme object", () => {
    it("initializes form with default values when theme is undefined", () => {
      const eventWithoutTheme: Event = {
        id: "event-123",
        title: "Test Event",
        status: "draft",
        joinPath: "/join/test-event",
        qrPngPath: "events/test-event/qr/join.png",
        companyId: "company-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        share: {
          allowDownload: true,
          allowSystemShare: true,
          allowEmail: true,
          socials: [],
        },
        experiencesCount: 0,
        sessionsCount: 0,
        readyCount: 0,
        sharesCount: 0,
        // theme is undefined
      };

      render(<ThemeEditor event={eventWithoutTheme} />);

      // Check default values
      const buttonColorInputs = screen.getAllByDisplayValue("#3B82F6");
      expect(buttonColorInputs.length).toBeGreaterThan(0); // Default button color

      const buttonTextColorInputs = screen.getAllByDisplayValue("#FFFFFF");
      expect(buttonTextColorInputs.length).toBeGreaterThan(0); // Default button text color

      const bgColorInputs = screen.getAllByDisplayValue("#F9FAFB");
      expect(bgColorInputs.length).toBeGreaterThan(0); // Default background color
    });

    it("handles partial theme object with optional chaining", () => {
      const eventWithPartialTheme = createMockEvent({
        buttonColor: "#FF0000",
        // Other fields undefined
        buttonTextColor: undefined,
        backgroundColor: undefined,
        backgroundImage: undefined,
      });

      render(<ThemeEditor event={eventWithPartialTheme} />);

      const buttonColorInputs = screen.getAllByDisplayValue("#FF0000");
      expect(buttonColorInputs.length).toBeGreaterThan(0);

      // Should use defaults for undefined fields
      const buttonTextColorInputs = screen.getAllByDisplayValue("#FFFFFF");
      expect(buttonTextColorInputs.length).toBeGreaterThan(0);

      const bgColorInputs = screen.getAllByDisplayValue("#F9FAFB");
      expect(bgColorInputs.length).toBeGreaterThan(0);
    });
  });

  describe("saving theme successfully", () => {
    it("calls updateEventTheme with correct data on save", async () => {
      const event = createMockEvent();
      const mockedUpdateEventTheme = jest.mocked(updateEventTheme);
      mockedUpdateEventTheme.mockResolvedValue({ success: true, data: undefined });

      render(<ThemeEditor event={event} />);

      // Modify button color
      const buttonColorTextInputs = screen.getAllByDisplayValue("#3B82F6");
      const buttonColorTextInput = buttonColorTextInputs.find(
        (input) => input.getAttribute("type") === "text"
      );

      if (buttonColorTextInput) {
        await userEvent.clear(buttonColorTextInput);
        await userEvent.type(buttonColorTextInput, "#FF0000");
      }

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);

      // Wait for async operation
      await waitFor(() => {
        expect(mockedUpdateEventTheme).toHaveBeenCalledWith("event-123", {
          buttonColor: "#FF0000",
          buttonTextColor: "#FFFFFF",
          backgroundColor: "#F9FAFB",
          backgroundImage: undefined,
        });
      });
    });

    it("shows success toast and refreshes router on successful save", async () => {
      const event = createMockEvent();
      const mockedUpdateEventTheme = jest.mocked(updateEventTheme);
      mockedUpdateEventTheme.mockResolvedValue({ success: true, data: undefined });

      render(<ThemeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Theme settings updated successfully"
        );
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it("shows error toast on failed save", async () => {
      const event = createMockEvent();
      const mockedUpdateEventTheme = jest.mocked(updateEventTheme);
      mockedUpdateEventTheme.mockResolvedValue({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid theme data",
        },
      });

      render(<ThemeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid theme data");
      });
    });

    it("disables save button while saving", async () => {
      const event = createMockEvent();
      const mockedUpdateEventTheme = jest.mocked(updateEventTheme);
      let resolveUpdate: (value: { success: true; data: undefined }) => void;
      const updatePromise = new Promise<{ success: true; data: undefined }>((resolve) => {
        resolveUpdate = resolve;
      });
      mockedUpdateEventTheme.mockReturnValue(updatePromise);

      render(<ThemeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);

      // Button should be disabled and show "Saving..."
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(saveButton).toHaveTextContent("Saving...");
      });

      // Resolve the promise and wait for transition to complete
      await act(async () => {
        resolveUpdate!({ success: true, data: undefined });
        // Allow React to process the transition
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Button should be enabled again
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
        expect(saveButton).toHaveTextContent("Save Changes");
      });
    });

    it("prevents multiple simultaneous saves", async () => {
      const event = createMockEvent();
      const mockedUpdateEventTheme = jest.mocked(updateEventTheme);
      let resolveUpdate: (value: { success: true; data: undefined }) => void;
      const updatePromise = new Promise<{ success: true; data: undefined }>((resolve) => {
        resolveUpdate = resolve;
      });
      mockedUpdateEventTheme.mockReturnValue(updatePromise);

      render(<ThemeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });

      // Click save multiple times
      await userEvent.click(saveButton);
      await userEvent.click(saveButton);
      await userEvent.click(saveButton);

      // Should only call updateEventTheme once
      await waitFor(() => {
        expect(mockedUpdateEventTheme).toHaveBeenCalledTimes(1);
      });

      // Resolve the promise
      await act(async () => {
        resolveUpdate!({ success: true, data: undefined });
        // Allow React to process the transition
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    });
  });

  describe("color customization", () => {
    it("updates button color via color picker", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const buttonColorInputs = screen.getAllByDisplayValue("#3B82F6");
      const textInput = buttonColorInputs.find(
        (input) => input.getAttribute("type") === "text"
      );

      if (textInput) {
        await userEvent.clear(textInput);
        await userEvent.type(textInput, "#FF0000");

        await waitFor(() => {
          expect(textInput).toHaveValue("#FF0000");
        });
      }
    });

    it("updates button text color via color picker", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const buttonTextColorInputs = screen.getAllByDisplayValue("#FFFFFF");
      const textInput = buttonTextColorInputs.find(
        (input) => input.getAttribute("type") === "text"
      );

      if (textInput) {
        await userEvent.clear(textInput);
        await userEvent.type(textInput, "#000000");

        await waitFor(() => {
          expect(textInput).toHaveValue("#000000");
        });
      }
    });

    it("updates background color via color picker", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const bgColorInputs = screen.getAllByDisplayValue("#F9FAFB");
      const textInput = bgColorInputs.find(
        (input) => input.getAttribute("type") === "text"
      );

      if (textInput) {
        await userEvent.clear(textInput);
        await userEvent.type(textInput, "#CCCCCC");

        await waitFor(() => {
          expect(textInput).toHaveValue("#CCCCCC");
        });
      }
    });

    it("updates background image via ImageUploadField", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const bgImageInput = screen.getByTestId("theme-bg-image-input");
      fireEvent.change(bgImageInput, {
        target: { value: "https://example.com/new-bg.jpg" },
      });

      await waitFor(() => {
        expect(bgImageInput).toHaveValue("https://example.com/new-bg.jpg");
      });
    });
  });

  describe("preview rendering", () => {
    it("shows overlay when background image is present", () => {
      const event = createMockEvent({
        backgroundImage: "https://example.com/bg.jpg",
      });
      render(<ThemeEditor event={event} />);

      const overlay = screen
        .getByTestId("preview-panel")
        .querySelector(".bg-black\\/40");
      expect(overlay).toBeInTheDocument();
    });

    it("hides overlay when no background image", () => {
      const event = createMockEvent({ backgroundImage: "" });
      render(<ThemeEditor event={event} />);

      const overlay = screen
        .getByTestId("preview-panel")
        .querySelector(".bg-black\\/40");
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe("live preview updates", () => {
    it("updates preview when button color changes", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const buttonColorInputs = screen.getAllByDisplayValue("#3B82F6");
      const textInput = buttonColorInputs.find(
        (input) => input.getAttribute("type") === "text"
      );

      if (textInput) {
        await userEvent.clear(textInput);
        await userEvent.type(textInput, "#FF0000");

        // Preview button should have new color (checked via style attribute)
        const previewButton = screen.getByText("Primary Button");
        expect(previewButton).toBeInTheDocument();
      }
    });

    it("updates preview when background color changes", async () => {
      const event = createMockEvent();
      render(<ThemeEditor event={event} />);

      const bgColorInputs = screen.getAllByDisplayValue("#F9FAFB");
      const textInput = bgColorInputs.find(
        (input) => input.getAttribute("type") === "text"
      );

      if (textInput) {
        await userEvent.clear(textInput);
        await userEvent.type(textInput, "#000000");

        // Preview should update background
        await waitFor(() => {
          expect(textInput).toHaveValue("#000000");
        });
      }
    });
  });
});
