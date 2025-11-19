import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EndingEditor } from "./EndingEditor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Event } from "../../types/event.types";
import * as eventsActions from "../../actions/events";

// Mock dependencies
jest.mock("../../actions/events", () => ({
  updateEventEnding: jest.fn(),
  updateEventShare: jest.fn(),
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
jest.mock("./PreviewPanel", () => ({
  PreviewPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="preview-panel">{children}</div>
  ),
}));

// Get mocked functions
const { updateEventEnding, updateEventShare } = eventsActions as jest.Mocked<typeof eventsActions>;

describe("EndingEditor", () => {
  const mockRouter = {
    refresh: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  };

  const createMockEvent = (
    endingOverrides?: Partial<Event["ending"]>,
    shareOverrides?: Partial<Event["share"]>
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
      allowEmail: false,
      socials: [],
      ...shareOverrides,
    },
    experiencesCount: 0,
    sessionsCount: 0,
    readyCount: 0,
    sharesCount: 0,
    ending: {
      title: "Thanks!",
      body: "Share your result",
      ctaLabel: "Share Now",
      ctaUrl: "",
      ...endingOverrides,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("rendering with nested ending/share objects", () => {
    it("renders all ending form fields with values from event.ending", () => {
      const event = createMockEvent({
        title: "Custom Ending",
        body: "Custom Message",
        ctaLabel: "Custom CTA",
        ctaUrl: "https://example.com",
      });

      render(<EndingEditor event={event} />);

      // Check title input
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue("Custom Ending");

      // Check body textarea
      const bodyTextarea = screen.getByLabelText(/body text/i);
      expect(bodyTextarea).toHaveValue("Custom Message");

      // Check CTA label input
      const ctaLabelInput = screen.getByLabelText(/button label/i);
      expect(ctaLabelInput).toHaveValue("Custom CTA");

      // Check CTA URL input
      const ctaUrlInput = screen.getByLabelText(/button url/i);
      expect(ctaUrlInput).toHaveValue("https://example.com");
    });

    it("renders all share form fields with values from event.share", () => {
      const event = createMockEvent(undefined, {
        allowDownload: false,
        allowSystemShare: false,
        allowEmail: true,
        socials: ["instagram", "facebook", "x"],
      });

      render(<EndingEditor event={event} />);

      // Check share toggles
      const downloadCheckbox = screen.getByLabelText(/allow download/i);
      expect(downloadCheckbox).not.toBeChecked();

      const systemShareCheckbox = screen.getByLabelText(/allow system share/i);
      expect(systemShareCheckbox).not.toBeChecked();

      const emailCheckbox = screen.getByLabelText(/allow email share/i);
      expect(emailCheckbox).toBeChecked();

      // Check social platforms
      const instagramCheckbox = screen.getByLabelText(/instagram/i);
      expect(instagramCheckbox).toBeChecked();

      const facebookCheckbox = screen.getByLabelText(/facebook/i);
      expect(facebookCheckbox).toBeChecked();

      const xCheckbox = screen.getByLabelText(/x \(twitter\)/i);
      expect(xCheckbox).toBeChecked();

      const tiktokCheckbox = screen.getByLabelText(/tiktok/i);
      expect(tiktokCheckbox).not.toBeChecked();
    });

    it("renders preview panel with ending content", () => {
      const event = createMockEvent({
        title: "Preview Title",
        body: "Preview Body",
        ctaLabel: "Preview CTA",
      });

      render(<EndingEditor event={event} />);

      // Check preview content
      const previewPanel = screen.getByTestId("preview-panel");
      expect(previewPanel).toBeInTheDocument();

      // Text appears in both form and preview, use getAllByText
      expect(screen.getAllByText("Preview Title").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Preview Body").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Preview CTA").length).toBeGreaterThan(0);
    });
  });

  describe("handling undefined ending object", () => {
    it("initializes form with default values when ending is undefined", () => {
      const eventWithoutEnding: Event = {
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
          allowEmail: false,
          socials: [],
        },
        experiencesCount: 0,
        sessionsCount: 0,
        readyCount: 0,
        sharesCount: 0,
        // ending is undefined
      };

      render(<EndingEditor event={eventWithoutEnding} />);

      // Check default values
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue("");

      const bodyTextarea = screen.getByLabelText(/body text/i);
      expect(bodyTextarea).toHaveValue("");

      const ctaLabelInput = screen.getByLabelText(/button label/i);
      expect(ctaLabelInput).toHaveValue("");

      const ctaUrlInput = screen.getByLabelText(/button url/i);
      expect(ctaUrlInput).toHaveValue("");
    });

    it("handles partial ending object with optional chaining", () => {
      const eventWithPartialEnding = createMockEvent({
        title: "Only Title",
        // Other fields undefined
        body: undefined,
        ctaLabel: undefined,
        ctaUrl: undefined,
      });

      render(<EndingEditor event={eventWithPartialEnding} />);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue("Only Title");

      // Should use defaults for undefined fields
      const bodyTextarea = screen.getByLabelText(/body text/i);
      expect(bodyTextarea).toHaveValue("");

      const ctaLabelInput = screen.getByLabelText(/button label/i);
      expect(ctaLabelInput).toHaveValue("");
    });
  });

  describe("saving ending and share separately", () => {
    it("calls both updateEventEnding and updateEventShare on save", async () => {
      const event = createMockEvent();
      (updateEventEnding as jest.Mock).mockResolvedValue({ success: true });
      (updateEventShare as jest.Mock).mockResolvedValue({ success: true });

      render(<EndingEditor event={event} />);

      // Modify ending fields
      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "New Title");

      const bodyTextarea = screen.getByLabelText(/body text/i);
      await userEvent.clear(bodyTextarea);
      await userEvent.type(bodyTextarea, "New Body");

      // Modify share fields
      const downloadCheckbox = screen.getByLabelText(/allow download/i);
      fireEvent.click(downloadCheckbox);

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      // Wait for async operations
      await waitFor(() => {
        expect(updateEventEnding).toHaveBeenCalledWith("event-123", {
          title: "New Title",
          body: "New Body",
          ctaLabel: "Share Now",
          ctaUrl: "",
        });

        expect(updateEventShare).toHaveBeenCalledWith("event-123", {
          allowDownload: false, // Was toggled
          allowSystemShare: true,
          allowEmail: false,
          socials: [],
        });
      });
    });

    it("shows success toast and refreshes router when both saves succeed", async () => {
      const event = createMockEvent();
      (updateEventEnding as jest.Mock).mockResolvedValue({ success: true });
      (updateEventShare as jest.Mock).mockResolvedValue({ success: true });

      render(<EndingEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Ending screen and share settings updated successfully"
        );
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it("shows error toast when ending save fails", async () => {
      const event = createMockEvent();
      (updateEventEnding as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ending data",
        },
      });
      (updateEventShare as jest.Mock).mockResolvedValue({ success: true });

      render(<EndingEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid ending data");
      });
    });

    it("shows error toast when share save fails", async () => {
      const event = createMockEvent();
      (updateEventEnding as jest.Mock).mockResolvedValue({ success: true });
      (updateEventShare as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid share data",
        },
      });

      render(<EndingEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid share data");
      });
    });

    it("disables save button while saving", async () => {
      const event = createMockEvent();
      let resolveEndingUpdate: (value: { success: boolean }) => void;
      let resolveShareUpdate: (value: { success: boolean }) => void;

      const endingPromise = new Promise<{ success: boolean }>((resolve) => {
        resolveEndingUpdate = resolve;
      });
      const sharePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveShareUpdate = resolve;
      });

      (updateEventEnding as jest.Mock).mockReturnValue(endingPromise);
      (updateEventShare as jest.Mock).mockReturnValue(sharePromise);

      render(<EndingEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      // Button should be disabled and show "Saving..."
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(saveButton).toHaveTextContent("Saving...");
      });

      // Resolve both promises
      resolveEndingUpdate!({ success: true });
      resolveShareUpdate!({ success: true });

      // Button should be enabled again
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
        expect(saveButton).toHaveTextContent("Save Changes");
      });
    });

    it("prevents multiple simultaneous saves", async () => {
      const event = createMockEvent();
      let resolveEndingUpdate: (value: { success: boolean }) => void;
      let resolveShareUpdate: (value: { success: boolean }) => void;

      const endingPromise = new Promise<{ success: boolean }>((resolve) => {
        resolveEndingUpdate = resolve;
      });
      const sharePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveShareUpdate = resolve;
      });

      (updateEventEnding as jest.Mock).mockReturnValue(endingPromise);
      (updateEventShare as jest.Mock).mockReturnValue(sharePromise);

      render(<EndingEditor event={event} />);

      const saveButton = screen.getByRole("button", { name: /save changes/i });

      // Click save multiple times
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      // Should only call each Server Action once
      await waitFor(() => {
        expect(updateEventEnding).toHaveBeenCalledTimes(1);
        expect(updateEventShare).toHaveBeenCalledTimes(1);
      });

      // Resolve both promises
      resolveEndingUpdate!({ success: true });
      resolveShareUpdate!({ success: true });
    });
  });

  describe("social platform toggles", () => {
    it("toggles social platforms on and off", async () => {
      const event = createMockEvent(undefined, { socials: [] });
      render(<EndingEditor event={event} />);

      const instagramCheckbox = screen.getByLabelText(/instagram/i);
      expect(instagramCheckbox).not.toBeChecked();

      // Toggle on
      fireEvent.click(instagramCheckbox);
      expect(instagramCheckbox).toBeChecked();

      // Toggle off
      fireEvent.click(instagramCheckbox);
      expect(instagramCheckbox).not.toBeChecked();
    });

    it("allows multiple social platforms to be selected", async () => {
      const event = createMockEvent(undefined, { socials: [] });
      render(<EndingEditor event={event} />);

      const instagramCheckbox = screen.getByLabelText(/instagram/i);
      const facebookCheckbox = screen.getByLabelText(/facebook/i);
      const xCheckbox = screen.getByLabelText(/x \(twitter\)/i);

      // Select multiple platforms
      fireEvent.click(instagramCheckbox);
      fireEvent.click(facebookCheckbox);
      fireEvent.click(xCheckbox);

      expect(instagramCheckbox).toBeChecked();
      expect(facebookCheckbox).toBeChecked();
      expect(xCheckbox).toBeChecked();
    });

    it("saves selected social platforms correctly", async () => {
      const event = createMockEvent(undefined, { socials: [] });
      (updateEventEnding as jest.Mock).mockResolvedValue({ success: true });
      (updateEventShare as jest.Mock).mockResolvedValue({ success: true });

      render(<EndingEditor event={event} />);

      // Select platforms
      const instagramCheckbox = screen.getByLabelText(/instagram/i);
      const tiktokCheckbox = screen.getByLabelText(/tiktok/i);
      fireEvent.click(instagramCheckbox);
      fireEvent.click(tiktokCheckbox);

      // Save
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateEventShare).toHaveBeenCalledWith("event-123", {
          allowDownload: true,
          allowSystemShare: true,
          allowEmail: false,
          socials: expect.arrayContaining(["instagram", "tiktok"]),
        });
      });
    });
  });

  describe("form validation and character limits", () => {
    it("enforces character limits on title field", () => {
      const event = createMockEvent();
      render(<EndingEditor event={event} />);

      const titleInput = screen.getByLabelText(/^title$/i);
      expect(titleInput).toHaveAttribute("maxLength", "500");

      // Check character counter - "Thanks!" = 7 chars
      const charCounters = screen.getAllByText(/7\/500 characters/i);
      expect(charCounters.length).toBeGreaterThan(0);
    });

    it("enforces character limits on body field", () => {
      const event = createMockEvent();
      render(<EndingEditor event={event} />);

      const bodyTextarea = screen.getByLabelText(/body text/i);
      expect(bodyTextarea).toHaveAttribute("maxLength", "500");

      // Check character counter
      expect(screen.getByText(/17\/500 characters/i)).toBeInTheDocument(); // "Share your result" = 17 chars
    });

    it("enforces character limits on CTA label field", () => {
      const event = createMockEvent();
      render(<EndingEditor event={event} />);

      const ctaLabelInput = screen.getByLabelText(/button label/i);
      expect(ctaLabelInput).toHaveAttribute("maxLength", "50");

      // Check character counter
      expect(screen.getByText(/9\/50 characters/i)).toBeInTheDocument(); // "Share Now" = 9 chars
    });

    it("updates character counter as user types", async () => {
      const event = createMockEvent({ title: "", body: "" });
      render(<EndingEditor event={event} />);

      const titleInput = screen.getByLabelText(/title/i);

      // Type text in title
      fireEvent.change(titleInput, { target: { value: "Hello" } });

      // Should show updated counter
      const updatedCounters = screen.queryAllByText(/5\/500 characters/i);
      expect(updatedCounters.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("live preview updates", () => {
    it("updates preview when ending title changes", async () => {
      const event = createMockEvent({ title: "" });
      render(<EndingEditor event={event} />);

      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.type(titleInput, "Live Title");

      // Preview should show new title
      expect(screen.getByText("Live Title")).toBeInTheDocument();
    });

    it("updates preview when body changes", async () => {
      const event = createMockEvent({ body: "" });
      render(<EndingEditor event={event} />);

      const bodyTextarea = screen.getByLabelText(/body text/i);
      await userEvent.type(bodyTextarea, "Live Description");

      // Preview should show new body (appears in both textarea and preview)
      await waitFor(() => {
        expect(screen.getAllByText("Live Description").length).toBeGreaterThan(0);
      });
    });

    it("shows share buttons in preview based on toggles", () => {
      const event = createMockEvent(undefined, {
        allowDownload: true,
        allowSystemShare: true,
        allowEmail: true,
      });
      render(<EndingEditor event={event} />);

      // Preview should show all enabled share buttons
      const downloadButtons = screen.getAllByText("Download");
      expect(downloadButtons.length).toBeGreaterThan(0);

      const shareButtons = screen.getAllByText("Share");
      expect(shareButtons.length).toBeGreaterThan(0);

      const emailButtons = screen.getAllByText("Email");
      expect(emailButtons.length).toBeGreaterThan(0);
    });
  });
});
