/**
 * Tests for Event Server Actions (V4 schema)
 *
 * Tests cover:
 * - createEventAction (name, ownerId, primaryColor)
 * - getEventAction
 * - listEventsAction (with ownerId filter)
 * - updateEventNameAction
 * - updateEventStatusAction
 * - updateEventTheme (nested V4 structure)
 * - updateEventSwitchboardAction (activeJourneyId)
 */

// Mock dependencies before imports
jest.mock("@/lib/firebase/admin", () => ({
  db: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  },
}));

jest.mock("@/lib/auth", () => ({
  verifyAdminSecret: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/features/companies/repositories/companies.repository", () => ({
  getCompany: jest.fn(),
}));

jest.mock("../repositories/events", () => ({
  createEvent: jest.fn(),
  getEvent: jest.fn(),
  listEvents: jest.fn(),
  updateEventBranding: jest.fn(),
  updateEventStatus: jest.fn(),
  updateEventName: jest.fn(),
}));

import { db } from "@/lib/firebase/admin";
import { verifyAdminSecret } from "@/lib/auth";
import { getCompany } from "@/features/companies/repositories/companies.repository";
import {
  createEvent,
  getEvent,
  listEvents,
  updateEventStatus,
  updateEventName,
} from "../repositories/events";
import {
  createEventAction,
  getEventAction,
  listEventsAction,
  updateEventNameAction,
  updateEventStatusAction,
  updateEventTheme,
  updateEventSwitchboardAction,
} from "./events";
import type { Event } from "../types/event.types";

// Mock types
const mockVerifyAdminSecret = verifyAdminSecret as jest.MockedFunction<typeof verifyAdminSecret>;
const mockGetCompany = getCompany as jest.MockedFunction<typeof getCompany>;
const mockCreateEvent = createEvent as jest.MockedFunction<typeof createEvent>;
const mockGetEvent = getEvent as jest.MockedFunction<typeof getEvent>;
const mockListEvents = listEvents as jest.MockedFunction<typeof listEvents>;
const mockUpdateEventStatus = updateEventStatus as jest.MockedFunction<typeof updateEventStatus>;
const mockUpdateEventName = updateEventName as jest.MockedFunction<typeof updateEventName>;
const mockDb = db as unknown as {
  collection: jest.MockedFunction<() => {
    doc: jest.MockedFunction<() => {
      update: jest.MockedFunction<() => Promise<void>>;
    }>;
  }>;
};

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

describe("Event Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // createEventAction
  // ============================================================================
  describe("createEventAction", () => {
    it("creates an event successfully with valid input", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockGetCompany.mockResolvedValue({
        id: "company-123",
        name: "Test Company",
        slug: "test-company",
        status: "active",
        deletedAt: null,
        contactEmail: null,
        termsUrl: null,
        privacyUrl: null,
        createdAt: 1234567890,
        updatedAt: 1234567890,
      });
      mockCreateEvent.mockResolvedValue("new-event-id");

      const result = await createEventAction({
        name: "My New Event",
        ownerId: "company-123",
        primaryColor: "#FF5733",
      });

      expect(result.success).toBe(true);
      expect((result as { success: true; eventId: string }).eventId).toBe("new-event-id");
      expect(mockCreateEvent).toHaveBeenCalledWith({
        name: "My New Event",
        ownerId: "company-123",
        primaryColor: "#FF5733",
      });
    });

    it("returns error when not authorized", async () => {
      mockVerifyAdminSecret.mockResolvedValue({
        authorized: false,
        error: "Unauthorized",
      });

      const result = await createEventAction({
        name: "My Event",
        ownerId: "company-123",
        primaryColor: "#3B82F6",
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("PERMISSION_DENIED");
    });

    it("returns error when owner not found", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockGetCompany.mockResolvedValue(null);

      const result = await createEventAction({
        name: "My Event",
        ownerId: "nonexistent",
        primaryColor: "#3B82F6",
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("OWNER_NOT_FOUND");
    });

    it("returns error when owner is inactive", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockGetCompany.mockResolvedValue({
        id: "company-123",
        name: "Deleted Company",
        slug: "deleted-company",
        status: "deleted",
        deletedAt: 1234567890,
        contactEmail: null,
        termsUrl: null,
        privacyUrl: null,
        createdAt: 1234567890,
        updatedAt: 1234567890,
      });

      const result = await createEventAction({
        name: "My Event",
        ownerId: "company-123",
        primaryColor: "#3B82F6",
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("OWNER_INACTIVE");
    });

    it("returns validation error for invalid input", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await createEventAction({
        name: "", // Invalid: empty name
        ownerId: "company-123",
        primaryColor: "#3B82F6",
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    });

    it("returns validation error for invalid color format", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await createEventAction({
        name: "My Event",
        ownerId: "company-123",
        primaryColor: "invalid-color", // Invalid: not hex format
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ============================================================================
  // getEventAction
  // ============================================================================
  describe("getEventAction", () => {
    it("returns event when it exists", async () => {
      const mockEvent = createMockEvent();
      mockGetEvent.mockResolvedValue(mockEvent);

      const result = await getEventAction("event-123");

      expect(result.success).toBe(true);
      expect((result as { success: true; event: Event }).event).toEqual(mockEvent);
    });

    it("returns error when event not found", async () => {
      mockGetEvent.mockResolvedValue(null);

      const result = await getEventAction("nonexistent");

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("EVENT_NOT_FOUND");
    });

    it("returns error on internal failure", async () => {
      mockGetEvent.mockRejectedValue(new Error("Database error"));

      const result = await getEventAction("event-123");

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("INTERNAL_ERROR");
    });
  });

  // ============================================================================
  // listEventsAction
  // ============================================================================
  describe("listEventsAction", () => {
    it("returns all events when no filter provided", async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: "event-456" })];
      mockListEvents.mockResolvedValue(mockEvents);

      const result = await listEventsAction();

      expect(result.success).toBe(true);
      expect((result as { success: true; events: Event[] }).events).toHaveLength(2);
      expect(mockListEvents).toHaveBeenCalledWith(undefined);
    });

    it("filters events by ownerId", async () => {
      const mockEvents = [createMockEvent({ ownerId: "company-a" })];
      mockListEvents.mockResolvedValue(mockEvents);

      const result = await listEventsAction({ ownerId: "company-a" });

      expect(result.success).toBe(true);
      expect(mockListEvents).toHaveBeenCalledWith({ ownerId: "company-a" });
    });

    it("filters events with null ownerId", async () => {
      const mockEvents = [createMockEvent({ ownerId: null })];
      mockListEvents.mockResolvedValue(mockEvents);

      const result = await listEventsAction({ ownerId: null });

      expect(result.success).toBe(true);
      expect(mockListEvents).toHaveBeenCalledWith({ ownerId: null });
    });

    it("returns error on internal failure", async () => {
      mockListEvents.mockRejectedValue(new Error("Database error"));

      const result = await listEventsAction();

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("INTERNAL_ERROR");
    });
  });

  // ============================================================================
  // updateEventNameAction
  // ============================================================================
  describe("updateEventNameAction", () => {
    it("updates event name successfully", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockUpdateEventName.mockResolvedValue(undefined);

      const result = await updateEventNameAction("event-123", "New Event Name");

      expect(result.success).toBe(true);
      expect(mockUpdateEventName).toHaveBeenCalledWith("event-123", "New Event Name");
    });

    it("returns error when not authorized", async () => {
      mockVerifyAdminSecret.mockResolvedValue({
        authorized: false,
        error: "Unauthorized",
      });

      const result = await updateEventNameAction("event-123", "New Name");

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("PERMISSION_DENIED");
    });

    it("returns validation error for empty name", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventNameAction("event-123", "");

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    });

    it("returns validation error for name exceeding max length", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventNameAction("event-123", "a".repeat(201));

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ============================================================================
  // updateEventStatusAction
  // ============================================================================
  describe("updateEventStatusAction", () => {
    it("updates status to draft", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockUpdateEventStatus.mockResolvedValue(undefined);

      const result = await updateEventStatusAction("event-123", "draft");

      expect(result.success).toBe(true);
      expect(mockUpdateEventStatus).toHaveBeenCalledWith("event-123", "draft");
    });

    it("updates status to live", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockUpdateEventStatus.mockResolvedValue(undefined);

      const result = await updateEventStatusAction("event-123", "live");

      expect(result.success).toBe(true);
      expect(mockUpdateEventStatus).toHaveBeenCalledWith("event-123", "live");
    });

    it("updates status to archived", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockUpdateEventStatus.mockResolvedValue(undefined);

      const result = await updateEventStatusAction("event-123", "archived");

      expect(result.success).toBe(true);
      expect(mockUpdateEventStatus).toHaveBeenCalledWith("event-123", "archived");
    });

    it("returns error when not authorized", async () => {
      mockVerifyAdminSecret.mockResolvedValue({
        authorized: false,
        error: "Unauthorized",
      });

      const result = await updateEventStatusAction("event-123", "live");

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("PERMISSION_DENIED");
    });
  });

  // ============================================================================
  // updateEventTheme
  // ============================================================================
  describe("updateEventTheme", () => {
    let mockUpdate: jest.Mock;

    beforeEach(() => {
      mockUpdate = jest.fn().mockResolvedValue(undefined);
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });
    });

    it("updates primary color successfully", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventTheme("event-123", {
        primaryColor: "#FF5733",
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          "theme.primaryColor": "#FF5733",
          updatedAt: expect.any(Number),
        })
      );
    });

    it("updates nested text fields with dot notation", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventTheme("event-123", {
        text: {
          color: "#333333",
          alignment: "left",
        },
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          "theme.text.color": "#333333",
          "theme.text.alignment": "left",
          updatedAt: expect.any(Number),
        })
      );
    });

    it("updates nested button fields with dot notation", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventTheme("event-123", {
        button: {
          backgroundColor: "#FF0000",
          textColor: "#FFFFFF",
          radius: "full",
        },
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          "theme.button.backgroundColor": "#FF0000",
          "theme.button.textColor": "#FFFFFF",
          "theme.button.radius": "full",
          updatedAt: expect.any(Number),
        })
      );
    });

    it("updates nested background fields with dot notation", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventTheme("event-123", {
        background: {
          color: "#000000",
          image: "https://example.com/bg.jpg",
          overlayOpacity: 0.8,
        },
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          "theme.background.color": "#000000",
          "theme.background.image": "https://example.com/bg.jpg",
          "theme.background.overlayOpacity": 0.8,
          updatedAt: expect.any(Number),
        })
      );
    });

    it("updates logo and font family", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventTheme("event-123", {
        logoUrl: "https://example.com/logo.png",
        fontFamily: "Roboto, sans-serif",
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          "theme.logoUrl": "https://example.com/logo.png",
          "theme.fontFamily": "Roboto, sans-serif",
          updatedAt: expect.any(Number),
        })
      );
    });

    it("allows null values for optional fields", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventTheme("event-123", {
        logoUrl: null,
        fontFamily: null,
        button: {
          backgroundColor: null,
        },
        background: {
          image: null,
        },
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          "theme.logoUrl": null,
          "theme.fontFamily": null,
          "theme.button.backgroundColor": null,
          "theme.background.image": null,
          updatedAt: expect.any(Number),
        })
      );
    });

    it("returns error when not authorized", async () => {
      mockVerifyAdminSecret.mockResolvedValue({
        authorized: false,
        error: "Unauthorized",
      });

      const result = await updateEventTheme("event-123", {
        primaryColor: "#FF5733",
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("PERMISSION_DENIED");
    });

    it("returns error when event not found (Firebase code 5)", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockUpdate.mockRejectedValue({ code: 5 }); // Firestore NOT_FOUND

      const result = await updateEventTheme("nonexistent", {
        primaryColor: "#FF5733",
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("EVENT_NOT_FOUND");
    });

    it("returns validation error for invalid color format", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventTheme("event-123", {
        primaryColor: "invalid-color",
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    });

    it("returns validation error for invalid overlay opacity", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventTheme("event-123", {
        background: {
          overlayOpacity: 1.5, // Invalid: must be 0-1
        },
      });

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ============================================================================
  // updateEventSwitchboardAction
  // ============================================================================
  describe("updateEventSwitchboardAction", () => {
    let mockUpdate: jest.Mock;

    beforeEach(() => {
      mockUpdate = jest.fn().mockResolvedValue(undefined);
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });
    });

    it("sets activeJourneyId successfully", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventSwitchboardAction("event-123", "journey-456");

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        activeJourneyId: "journey-456",
        updatedAt: expect.any(Number),
      });
    });

    it("clears activeJourneyId with null", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });

      const result = await updateEventSwitchboardAction("event-123", null);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        activeJourneyId: null,
        updatedAt: expect.any(Number),
      });
    });

    it("returns error when not authorized", async () => {
      mockVerifyAdminSecret.mockResolvedValue({
        authorized: false,
        error: "Unauthorized",
      });

      const result = await updateEventSwitchboardAction("event-123", "journey-456");

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("PERMISSION_DENIED");
    });

    it("returns error when event not found (Firebase code 5)", async () => {
      mockVerifyAdminSecret.mockResolvedValue({ authorized: true });
      mockUpdate.mockRejectedValue({ code: 5 }); // Firestore NOT_FOUND

      const result = await updateEventSwitchboardAction("nonexistent", "journey-456");

      expect(result.success).toBe(false);
      expect((result as { success: false; error: { code: string } }).error.code).toBe("EVENT_NOT_FOUND");
    });
  });
});
