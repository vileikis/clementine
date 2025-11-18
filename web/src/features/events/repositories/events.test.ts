import { db } from "@/lib/firebase/admin";
import type { Event, Scene } from "../types/event.types";
import {
  createEvent,
  getEvent,
  listEvents,
  updateEventBranding,
  getCurrentScene,
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
    it("creates an event with default scene in a transaction", async () => {
      const mockEventRef = {
        id: "event-123",
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: "scene-456" }),
        }),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const mockTxn = {
        set: jest.fn(),
      };

      mockDb.runTransaction.mockImplementation(async (callback) => {
        await callback(mockTxn);
      });

      const eventId = await createEvent({
        title: "Summer Festival",
        brandColor: "#FF5733",
        showTitleOverlay: true,
        companyId: "company-123",
      });

      expect(eventId).toBe("event-123");
      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockDb.runTransaction).toHaveBeenCalled();

      // Verify event data structure
      const eventCall = mockTxn.set.mock.calls[0];
      const eventData = eventCall[1] as Event;
      expect(eventData).toMatchObject({
        id: "event-123",
        title: "Summer Festival",
        brandColor: "#FF5733",
        showTitleOverlay: true,
        status: "draft",
        currentSceneId: "scene-456",
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
      });
      expect(eventData.createdAt).toBeGreaterThan(0);
      expect(eventData.updatedAt).toBe(eventData.createdAt);

      // Verify scene data structure
      const sceneCall = mockTxn.set.mock.calls[1];
      const sceneData = sceneCall[1] as Scene;
      expect(sceneData).toMatchObject({
        id: "scene-456",
        label: "Default Scene v1",
        mode: "photo",
        prompt: "Apply clean studio background with brand color accents.",
        flags: {
          customTextTool: false,
          stickersTool: false,
        },
        status: "active",
      });
      expect(sceneData.createdAt).toBeGreaterThan(0);
    });
  });

  describe("getEvent", () => {
    it("returns event when it exists", async () => {
      const mockEventData = {
        title: "Test Event",
        brandColor: "#000000",
        showTitleOverlay: false,
        status: "live",
        currentSceneId: "scene-123",
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
        createdAt: 1234567890,
        updatedAt: 1234567890,
        companyId: null,
        shareAllowDownload: true,
        shareAllowSystemShare: true,
        shareAllowEmail: true,
        shareSocials: [],
        surveyEnabled: false,
        surveyRequired: false,
        surveyStepsCount: 0,
        surveyStepsOrder: [],
        surveyVersion: 1,
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
        brandColor: "invalid-color",
        showTitleOverlay: false,
        status: "invalid-status",
        currentSceneId: "scene-123",
        joinPath: "/join/event-123",
        qrPngPath: "events/event-123/qr/join.png",
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
  });

  describe("listEvents", () => {
    it("returns events ordered by createdAt descending", async () => {
      const mockEvents = [
        {
          id: "event-2",
          title: "Newer Event",
          brandColor: "#111111",
          showTitleOverlay: true,
          status: "live",
          currentSceneId: "scene-2",
          joinPath: "/join/event-2",
          qrPngPath: "events/event-2/qr/join.png",
          createdAt: 2000000000,
          updatedAt: 2000000000,
        },
        {
          id: "event-1",
          title: "Older Event",
          brandColor: "#222222",
          showTitleOverlay: false,
          status: "draft",
          currentSceneId: "scene-1",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
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
          brandColor: "#111111",
          showTitleOverlay: true,
          status: "live",
          currentSceneId: "scene-1",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: "company-a",
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
          brandColor: "#111111",
          showTitleOverlay: true,
          status: "live",
          currentSceneId: "scene-1",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: null,
          createdAt: 2000000000,
          updatedAt: 2000000000,
          shareAllowDownload: true,
          shareAllowSystemShare: true,
          shareAllowEmail: true,
          shareSocials: [],
          surveyEnabled: false,
          surveyRequired: false,
          surveyStepsCount: 0,
          surveyStepsOrder: [],
          surveyVersion: 1,
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
        },
        {
          id: "event-2",
          title: "Company Event",
          brandColor: "#222222",
          showTitleOverlay: false,
          status: "draft",
          currentSceneId: "scene-2",
          joinPath: "/join/event-2",
          qrPngPath: "events/event-2/qr/join.png",
          companyId: "company-a",
          createdAt: 1000000000,
          updatedAt: 1000000000,
          shareAllowDownload: true,
          shareAllowSystemShare: true,
          shareAllowEmail: true,
          shareSocials: [],
          surveyEnabled: false,
          surveyRequired: false,
          surveyStepsCount: 0,
          surveyStepsOrder: [],
          surveyVersion: 1,
          experiencesCount: 0,
          sessionsCount: 0,
          readyCount: 0,
          sharesCount: 0,
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

  describe("updateEventBranding", () => {
    it("updates brand color", async () => {
      const mockUpdate = jest.fn();
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      await updateEventBranding("event-123", {
        brandColor: "#FF00FF",
      });

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockUpdate).toHaveBeenCalledWith({
        brandColor: "#FF00FF",
        updatedAt: expect.any(Number),
      });
    });

    it("updates showTitleOverlay", async () => {
      const mockUpdate = jest.fn();
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      await updateEventBranding("event-123", {
        showTitleOverlay: true,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        showTitleOverlay: true,
        updatedAt: expect.any(Number),
      });
    });

    it("updates both branding properties", async () => {
      const mockUpdate = jest.fn();
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      await updateEventBranding("event-123", {
        brandColor: "#00FF00",
        showTitleOverlay: false,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        brandColor: "#00FF00",
        showTitleOverlay: false,
        updatedAt: expect.any(Number),
      });
    });
  });

  describe("getCurrentScene", () => {
    it("returns current scene for an event", async () => {
      const mockEventData = {
        currentSceneId: "scene-123",
      };

      const mockSceneData = {
        label: "Test Scene",
        mode: "photo",
        effect: "background_swap",
        prompt: "Test prompt",
        defaultPrompt: "Default prompt",
        flags: {
          customTextTool: false,
          stickersTool: true,
        },
        status: "active",
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      const mockEventDoc = {
        exists: true,
        data: jest.fn().mockReturnValue(mockEventData),
      };

      const mockSceneDoc = {
        exists: true,
        id: "scene-123",
        data: jest.fn().mockReturnValue(mockSceneData),
      };

      const mockSceneRef = {
        get: jest.fn().mockResolvedValue(mockSceneDoc),
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        get: jest.fn().mockResolvedValue(mockEventDoc),
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const scene = await getCurrentScene("event-123");

      expect(scene).toEqual({ id: "scene-123", ...mockSceneData });
      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.collection).toHaveBeenCalledWith("scenes");
    });

    it("returns null when event does not exist", async () => {
      const mockEventDoc = {
        exists: false,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockEventDoc),
        }),
      });

      const scene = await getCurrentScene("nonexistent");

      expect(scene).toBeNull();
    });

    it("returns null when scene does not exist", async () => {
      const mockEventData = {
        currentSceneId: "scene-123",
      };

      const mockEventDoc = {
        exists: true,
        data: jest.fn().mockReturnValue(mockEventData),
      };

      const mockSceneDoc = {
        exists: false,
      };

      const mockSceneRef = {
        get: jest.fn().mockResolvedValue(mockSceneDoc),
      };

      const mockEventRef = {
        get: jest.fn().mockResolvedValue(mockEventDoc),
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue(mockSceneRef),
        }),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const scene = await getCurrentScene("event-123");

      expect(scene).toBeNull();
    });
  });
});
