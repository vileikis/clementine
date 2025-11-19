import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WelcomeEditor } from "./WelcomeEditor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Event } from "../../types/event.types";

// Mock dependencies
jest.mock("../../actions/events", () => ({
  updateEventWelcome: jest.fn(),
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
const { updateEventWelcome } = require("../../actions/events");

describe("WelcomeEditor", () => {
  const mockRouter = {
    refresh: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  };

  const createMockEvent = (
    welcomeOverrides?: Partial<Event["welcome"]>
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
    welcome: {
      title: "Welcome!",
      body: "Join us for fun",
      ctaLabel: "Get Started",
      backgroundColor: "#FFFFFF",
      backgroundImage: "",
      ...welcomeOverrides,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("rendering with nested welcome object", () => {
    it("renders all form fields with values from event.welcome", () => {
      const event = createMockEvent({
        title: "Custom Welcome",
        body: "Custom Description",
        ctaLabel: "Start Now",
        backgroundColor: "#FF0000",
        backgroundImage: "https://example.com/bg.jpg",
      });

      render(<WelcomeEditor event={event} />);

      // Check title input
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue("Custom Welcome");

      // Check description textarea
      const bodyTextarea = screen.getByLabelText(/description/i);
      expect(bodyTextarea).toHaveValue("Custom Description");

      // Check CTA label input
      const ctaInput = screen.getByLabelText(/button label/i);
      expect(ctaInput).toHaveValue("Start Now");

      // Check background color inputs
      const colorInputs = screen.getAllByDisplayValue("#FF0000");
      expect(colorInputs.length).toBeGreaterThan(0);

      // Check background image field
      const bgImageInput = screen.getByTestId("welcome-bg-image-input");
      expect(bgImageInput).toHaveValue("https://example.com/bg.jpg");
    });

    it("renders preview panel with welcome content", () => {
      const event = createMockEvent({
        title: "Preview Title",
        body: "Preview Body",
        ctaLabel: "Preview CTA",
      });

      render(<WelcomeEditor event={event} />);

      // Check preview content
      const previewPanel = screen.getByTestId("preview-panel");
      expect(previewPanel).toBeInTheDocument();

      // Text appears in both form and preview, use getAllByText
      expect(screen.getAllByText("Preview Title").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Preview Body").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Preview CTA").length).toBeGreaterThan(0);
    });
  });

  describe("handling undefined welcome object", () => {
    it("initializes form with default values when welcome is undefined", () => {
      const eventWithoutWelcome: Event = {
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
        // welcome is undefined
      };

      render(<WelcomeEditor event={eventWithoutWelcome} />);

      // Check default values
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue("");

      const bodyTextarea = screen.getByLabelText(/description/i);
      expect(bodyTextarea).toHaveValue("");

      const ctaInput = screen.getByLabelText(/button label/i);
      expect(ctaInput).toHaveValue("Get Started"); // Default value

      const colorInputs = screen.getAllByDisplayValue("#FFFFFF");
      expect(colorInputs.length).toBeGreaterThan(0); // Default color
    });

    it("handles partial welcome object with optional chaining", () => {
      const eventWithPartialWelcome = createMockEvent({
        title: "Only Title",
        // Other fields undefined
        body: undefined,
        ctaLabel: undefined,
        backgroundColor: undefined,
        backgroundImage: undefined,
      });

      render(<WelcomeEditor event={eventWithPartialWelcome} />);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue("Only Title");

      // Should use defaults for undefined fields
      const bodyTextarea = screen.getByLabelText(/description/i);
      expect(bodyTextarea).toHaveValue("");

      const ctaInput = screen.getByLabelText(/button label/i);
      expect(ctaInput).toHaveValue("Get Started");
    });
  });

  describe("saving with nested welcome object", () => {
    it("calls updateEventWelcome with nested structure on save", async () => {
      const event = createMockEvent();
      (updateEventWelcome as jest.Mock).mockResolvedValue({ success: true });

      render(<WelcomeEditor event={event} />);

      // Modify form fields
      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "New Title");

      const bodyTextarea = screen.getByLabelText(/description/i);
      await userEvent.clear(bodyTextarea);
      await userEvent.type(bodyTextarea, "New Description");

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      // Wait for async operation
      await waitFor(() => {
        expect(updateEventWelcome).toHaveBeenCalledWith("event-123", {
          title: "New Title",
          body: "New Description",
          ctaLabel: "Get Started",
          backgroundColor: "#FFFFFF",
          backgroundImage: "",
        });
      });
    });

    it("shows success toast and refreshes router on successful save", async () => {
      const event = createMockEvent();
      (updateEventWelcome as jest.Mock).mockResolvedValue({ success: true });

      render(<WelcomeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Welcome screen updated successfully"
        );
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it("shows error toast on failed save", async () => {
      const event = createMockEvent();
      (updateEventWelcome as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid data",
        },
      });

      render(<WelcomeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid data");
      });
    });

    it("disables save button while saving", async () => {
      const event = createMockEvent();
      let resolveUpdate: (value: { success: boolean }) => void;
      const updatePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveUpdate = resolve;
      });
      (updateEventWelcome as jest.Mock).mockReturnValue(updatePromise);

      render(<WelcomeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      // Button should be disabled and show "Saving..."
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(saveButton).toHaveTextContent("Saving...");
      });

      // Resolve the promise
      resolveUpdate!({ success: true });

      // Button should be enabled again
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
        expect(saveButton).toHaveTextContent("Save Changes");
      });
    });

    it("prevents multiple simultaneous saves", async () => {
      const event = createMockEvent();
      let resolveUpdate: (value: { success: boolean }) => void;
      const updatePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveUpdate = resolve;
      });
      (updateEventWelcome as jest.Mock).mockReturnValue(updatePromise);

      render(<WelcomeEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });

      // Click save multiple times
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      // Should only call updateEventWelcome once
      await waitFor(() => {
        expect(updateEventWelcome).toHaveBeenCalledTimes(1);
      });

      // Resolve the promise
      resolveUpdate!({ success: true });
    });
  });

  describe("form validation and character limits", () => {
    it("enforces character limits on title field", async () => {
      const event = createMockEvent();
      render(<WelcomeEditor event={event} />);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute("maxLength", "500");

      // Check character counter
      expect(screen.getByText(/8\/500 characters/i)).toBeInTheDocument(); // "Welcome!" = 8 chars
    });

    it("enforces character limits on body field", async () => {
      const event = createMockEvent();
      render(<WelcomeEditor event={event} />);

      const bodyTextarea = screen.getByLabelText(/description/i);
      expect(bodyTextarea).toHaveAttribute("maxLength", "500");

      // Check character counter
      expect(screen.getByText(/15\/500 characters/i)).toBeInTheDocument(); // "Join us for fun" = 15 chars
    });

    it("enforces character limits on CTA label field", async () => {
      const event = createMockEvent();
      render(<WelcomeEditor event={event} />);

      const ctaInput = screen.getByLabelText(/button label/i);
      expect(ctaInput).toHaveAttribute("maxLength", "50");

      // Check character counter
      expect(screen.getByText(/11\/50 characters/i)).toBeInTheDocument(); // "Get Started" = 11 chars
    });

    it("updates character counter as user types", async () => {
      const event = createMockEvent({ title: "", body: "" });
      render(<WelcomeEditor event={event} />);

      // Initially both counters show 0/500
      const initialCounters = screen.getAllByText(/0\/500 characters/i);
      expect(initialCounters).toHaveLength(2); // Title and body

      const titleInput = screen.getByLabelText(/title/i);

      // Type text in title
      fireEvent.change(titleInput, { target: { value: "Hello" } });

      // Now we should have one counter showing 5/500
      const updatedCounters = screen.queryAllByText(/5\/500 characters/i);
      expect(updatedCounters.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("background customization", () => {
    it("updates background color via color picker", async () => {
      const event = createMockEvent();
      render(<WelcomeEditor event={event} />);

      // Find all inputs - one will be color type, one will be text
      const colorInputs = screen.getAllByDisplayValue("#FFFFFF");
      const textInput = colorInputs.find((input) => input.getAttribute("type") === "text");

      if (textInput) {
        await userEvent.clear(textInput);
        await userEvent.type(textInput, "#FF0000");

        // Color should be updated
        await waitFor(() => {
          expect(textInput).toHaveValue("#FF0000");
        });
      }
    });

    it("updates background image via ImageUploadField", async () => {
      const event = createMockEvent();
      render(<WelcomeEditor event={event} />);

      const bgImageInput = screen.getByTestId("welcome-bg-image-input");
      fireEvent.change(bgImageInput, {
        target: { value: "https://example.com/new-bg.jpg" },
      });

      // Image URL should be reflected in input state
      await waitFor(() => {
        expect(bgImageInput).toHaveValue("https://example.com/new-bg.jpg");
      });
    });

    it("shows overlay when background image is present", () => {
      const event = createMockEvent({
        backgroundImage: "https://example.com/bg.jpg",
      });
      render(<WelcomeEditor event={event} />);

      // Should have overlay div for readability
      const overlay = screen
        .getByTestId("preview-panel")
        .querySelector(".bg-black\\/40");
      expect(overlay).toBeInTheDocument();
    });

    it("hides overlay when no background image", () => {
      const event = createMockEvent({ backgroundImage: "" });
      render(<WelcomeEditor event={event} />);

      // Should not have overlay div
      const overlay = screen
        .getByTestId("preview-panel")
        .querySelector(".bg-black\\/40");
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe("live preview updates", () => {
    it("updates preview when title changes", async () => {
      const event = createMockEvent({ title: "" });
      render(<WelcomeEditor event={event} />);

      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.type(titleInput, "Live Title");

      // Preview should show new title
      expect(screen.getByText("Live Title")).toBeInTheDocument();
    });

    it("updates preview when body changes", async () => {
      const event = createMockEvent({ body: "" });
      render(<WelcomeEditor event={event} />);

      const bodyTextarea = screen.getByLabelText(/description/i);
      await userEvent.type(bodyTextarea, "Live Description");

      // Preview should show new body
      await waitFor(() => {
        expect(screen.getAllByText("Live Description").length).toBeGreaterThan(0);
      });
    });

    it("updates preview when CTA label changes", async () => {
      const event = createMockEvent();
      render(<WelcomeEditor event={event} />);

      const ctaInput = screen.getByLabelText(/button label/i);
      await userEvent.clear(ctaInput);
      await userEvent.type(ctaInput, "New CTA");

      // Preview should show new CTA
      const ctaButtons = screen.getAllByText("New CTA");
      expect(ctaButtons.length).toBeGreaterThan(0);
    });
  });
});
