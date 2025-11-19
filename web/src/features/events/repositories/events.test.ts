import { db } from "@/lib/firebase/admin";
import type { Event } from "../types/event.types";
import {
  createEvent,
  getEvent,
  listEvents,
} from "./events";

describe("Events Repository", () => {
  const mockDb = db as unknown as {
    collection: ReturnType<typeof jest.fn>;
    runTransaction: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEvent", () => {
    it("creates an event", async () => {
      const mockEventRef = {
        id: "event-123",
        set: jest.fn(),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const eventId = await createEvent({
        title: "Summer Festival",
        companyId: "company-123",
      });

      expect(eventId).toBe("event-123");
      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.set).toHaveBeenCalled();

      // Verify event data structure
      const eventData = mockEventRef.set.mock.calls[0][0] as Event;
      expect(eventData).toMatchObject({
        id: "event-123",
        title: "Summer Festival",
        companyId: "company-123",
        status: "draft",
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
        share: {
          allowDownload: true,
          allowSystemShare: true,
          allowEmail: false,
          socials: [],
        },
      });
      expect(eventData.createdAt).toBeGreaterThan(0);
      expect(eventData.updatedAt).toBe(eventData.createdAt);
    });
  });

  describe("getEvent", () => {
    it("returns event when it exists", async () => {
      const mockEventData = {
        title: "Test Event",
        status: "live",
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
        createdAt: 1234567890,
        updatedAt: 1234567890,
        companyId: null,
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
      };

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

    it("validates event data with schema", async () => {
      const invalidEventData = {
        title: "",
        status: "invalid-status",
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
        createdAt: 1234567890,
        updatedAt: 1234567890,
        companyId: null,
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
  });

  describe("listEvents", () => {
    it("returns events ordered by createdAt descending", async () => {
      const mockEvents = [
        {
          id: "event-2",
          title: "Newer Event",
          status: "live",
          joinPath: "/join/event-2",
          qrPngPath: "events/event-2/qr/join.png",
          companyId: null,
          share: { allowDownload: true, allowSystemShare: true, allowEmail: false, socials: [] },
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
          createdAt: 2000000000,
          updatedAt: 2000000000,
        },
        {
          id: "event-1",
          title: "Older Event",
          status: "draft",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: null,
          share: { allowDownload: true, allowSystemShare: true, allowEmail: false, socials: [] },
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
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

    it("filters events by companyId when provided", async () => {
      const mockEvents = [
        {
          id: "event-1",
          title: "Company A Event",
          status: "live",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: "company-a",
          share: { allowDownload: true, allowSystemShare: true, allowEmail: false, socials: [] },
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
          createdAt: 2000000000,
          updatedAt: 2000000000,
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

      const events = await listEvents({ companyId: "company-a" });

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockWhere).toHaveBeenCalledWith("companyId", "==", "company-a");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(events).toHaveLength(1);
      expect(events[0].companyId).toBe("company-a");
    });

    it("filters events with no company when companyId is null", async () => {
      const mockEvents = [
        {
          id: "event-1",
          title: "No Company Event",
          status: "live",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: null,
          share: { allowDownload: true, allowSystemShare: true, allowEmail: false, socials: [] },
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
          createdAt: 2000000000,
          updatedAt: 2000000000,
        },
        {
          id: "event-2",
          title: "Company Event",
          status: "draft",
          joinPath: "/join/event-2",
          qrPngPath: "events/event-2/qr/join.png",
          companyId: "company-a",
          share: { allowDownload: true, allowSystemShare: true, allowEmail: false, socials: [] },
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
          createdAt: 1000000000,
          updatedAt: 1000000000,
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

      const events = await listEvents({ companyId: null });

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(events).toHaveLength(1);
      expect(events[0].companyId).toBeNull();
    });
  });

  // updateEventBranding tests removed - brandColor and showTitleOverlay deprecated
  // Theme updates now handled by updateEventTheme Server Action

});
