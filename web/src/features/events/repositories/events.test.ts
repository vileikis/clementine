/**
 * Tests for Events Repository (V4 schema)
 *
 * Tests cover:
 * - createEvent (name, ownerId, primaryColor)
 * - getEvent
 * - listEvents (with ownerId filter)
 */

import { db } from "@/lib/firebase/admin";
import type { Event } from "../types/event.types";
import {
  createEvent,
  getEvent,
  listEvents,
} from "./events";

// V4 schema mock event helper
function createMockEventData(overrides: Partial<Event> = {}): Omit<Event, "id"> {
  return {
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

describe("Events Repository", () => {
  const mockDb = db as unknown as {
    collection: ReturnType<typeof jest.fn>;
    runTransaction: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEvent", () => {
    it("creates an event with V4 schema structure", async () => {
      const mockEventRef = {
        id: "event-123",
        set: jest.fn(),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const eventId = await createEvent({
        name: "Summer Festival",
        ownerId: "company-123",
        primaryColor: "#3B82F6",
      });

      expect(eventId).toBe("event-123");
      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.set).toHaveBeenCalled();

      // Verify event data structure matches V4 schema
      const eventData = mockEventRef.set.mock.calls[0][0] as Event;
      expect(eventData).toMatchObject({
        id: "event-123",
        name: "Summer Festival",
        ownerId: "company-123",
        status: "draft",
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
        activeJourneyId: null,
      });

      // Verify theme structure (V4)
      expect(eventData.theme).toBeDefined();
      expect(eventData.theme.primaryColor).toBe("#3B82F6");
      expect(eventData.theme.text).toBeDefined();
      expect(eventData.theme.button).toBeDefined();
      expect(eventData.theme.background).toBeDefined();

      // Verify timestamps
      expect(eventData.createdAt).toBeGreaterThan(0);
      expect(eventData.updatedAt).toBe(eventData.createdAt);
    });

    it("initializes theme with defaults and provided primaryColor", async () => {
      const mockEventRef = {
        id: "event-456",
        set: jest.fn(),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await createEvent({
        name: "Custom Event",
        ownerId: "company-456",
        primaryColor: "#FF5733",
      });

      const eventData = mockEventRef.set.mock.calls[0][0] as Event;

      // Check theme defaults are applied correctly
      expect(eventData.theme.primaryColor).toBe("#FF5733");
      expect(eventData.theme.logoUrl).toBeNull();
      expect(eventData.theme.fontFamily).toBeNull();
      expect(eventData.theme.text.color).toBe("#000000");
      expect(eventData.theme.text.alignment).toBe("center");
      expect(eventData.theme.button.backgroundColor).toBeNull(); // Inherits primaryColor
      expect(eventData.theme.button.textColor).toBe("#FFFFFF");
      expect(eventData.theme.button.radius).toBe("md");
      expect(eventData.theme.background.color).toBe("#F9FAFB");
      expect(eventData.theme.background.image).toBeNull();
      expect(eventData.theme.background.overlayOpacity).toBe(0.5);
    });
  });

  describe("getEvent", () => {
    it("returns event when it exists with V4 schema", async () => {
      const mockEventData = createMockEventData();

      const mockDoc = {
        exists: true,
        id: "event-123",
        data: jest.fn().mockReturnValue(mockEventData),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      const event = await getEvent("event-123");

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(event).toEqual({ id: "event-123", ...mockEventData });
    });

    it("returns null when event does not exist", async () => {
      const mockDoc = {
        exists: false,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      const event = await getEvent("nonexistent");

      expect(event).toBeNull();
    });

    it("validates event data with V4 schema", async () => {
      const invalidEventData = {
        name: "", // Invalid: empty name
        status: "invalid-status", // Invalid: not in enum
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
        ownerId: null,
        activeJourneyId: null,
        theme: {
          primaryColor: "#3B82F6",
          text: { color: "#000000", alignment: "center" },
          button: { backgroundColor: null, textColor: "#FFFFFF", radius: "md" },
          background: { color: "#F9FAFB", image: null, overlayOpacity: 0.5 },
        },
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      const mockDoc = {
        exists: true,
        id: "event-123",
        data: jest.fn().mockReturnValue(invalidEventData),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      await expect(getEvent("event-123")).rejects.toThrow();
    });

    it("validates nested theme structure", async () => {
      const invalidThemeData = {
        name: "Test Event",
        status: "draft",
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
        ownerId: null,
        activeJourneyId: null,
        theme: {
          primaryColor: "invalid-color", // Invalid: not hex format
          text: { color: "#000000", alignment: "center" },
          button: { backgroundColor: null, textColor: "#FFFFFF", radius: "md" },
          background: { color: "#F9FAFB", image: null, overlayOpacity: 0.5 },
        },
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      const mockDoc = {
        exists: true,
        id: "event-456",
        data: jest.fn().mockReturnValue(invalidThemeData),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      await expect(getEvent("event-456")).rejects.toThrow();
    });
  });

  describe("listEvents", () => {
    it("returns events ordered by createdAt descending", async () => {
      const mockEvents = [
        {
          ...createMockEventData({ name: "Newer Event" }),
          id: "event-2",
          createdAt: 2000000000,
          updatedAt: 2000000000,
        },
        {
          ...createMockEventData({ name: "Older Event" }),
          id: "event-1",
          status: "draft" as const,
          createdAt: 1000000000,
          updatedAt: 1000000000,
        },
      ];

      const mockDocs = mockEvents.map((event) => ({
        id: event.id,
        data: jest.fn().mockReturnValue(event),
      }));

      mockDb.collection.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: mockDocs }),
        }),
      });

      const events = await listEvents();

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(events).toHaveLength(2);
      expect(events[0].id).toBe("event-2");
      expect(events[1].id).toBe("event-1");
    });

    it("returns empty array when no events exist", async () => {
      mockDb.collection.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: [] }),
        }),
      });

      const events = await listEvents();

      expect(events).toEqual([]);
    });

    it("filters events by ownerId when provided", async () => {
      const mockEvents = [
        {
          ...createMockEventData({ name: "Company A Event", ownerId: "company-a" }),
          id: "event-1",
        },
      ];

      const mockDocs = mockEvents.map((event) => ({
        id: event.id,
        data: jest.fn().mockReturnValue(event),
      }));

      const mockOrderBy = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const mockWhere = jest.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });

      mockDb.collection.mockReturnValue({
        where: mockWhere,
      });

      const events = await listEvents({ ownerId: "company-a" });

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockWhere).toHaveBeenCalledWith("ownerId", "==", "company-a");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(events).toHaveLength(1);
      expect(events[0].ownerId).toBe("company-a");
    });

    it("filters events with no owner when ownerId is null", async () => {
      const mockEvents = [
        {
          ...createMockEventData({ name: "No Company Event", ownerId: null }),
          id: "event-1",
        },
      ];

      const mockDocs = mockEvents.map((event) => ({
        id: event.id,
        data: jest.fn().mockReturnValue(event),
      }));

      const mockOrderBy = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      mockDb.collection.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const events = await listEvents({ ownerId: null });

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(events).toHaveLength(1);
      expect(events[0].ownerId).toBeNull();
    });
  });
});
