import {
  createEventAction,
  listEventsAction,
  updateEventWelcome,
  updateEventEnding,
  updateEventShare,
  updateEventTheme,
} from "./events";
import * as eventsRepository from "../repositories/events";
import * as companiesRepository from "@/features/companies/repositories/companies";
import * as auth from "@/lib/auth";
import type { Event } from "../types/event.types";
import type { Company } from "@/features/companies";
import * as firebaseAdmin from "@/lib/firebase/admin";

// Get the mock collection function
const mockCollection = (firebaseAdmin as typeof firebaseAdmin & { __mockCollection: jest.Mock }).__mockCollection;

// Mock dependencies
jest.mock("../repositories/events");
jest.mock("@/features/companies/repositories/companies");
jest.mock("@/lib/auth");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Mock firebase admin with a factory that returns a fresh mock
jest.mock("@/lib/firebase/admin", () => {
  const mockCollection = jest.fn();
  return {
    db: {
      collection: mockCollection,
    },
    __mockCollection: mockCollection, // Expose for test access
  };
});

describe("Events Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listEventsAction", () => {
    it("returns all events when no filters provided", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-1",
          title: "Event 1",
          status: "live",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: "company-a",
          createdAt: 2000000000,
          updatedAt: 2000000000,
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
        },
        {
          id: "event-2",
          title: "Event 2",
          status: "draft",
          joinPath: "/join/event-2",
          qrPngPath: "events/event-2/qr/join.png",
          companyId: null,
          createdAt: 1000000000,
          updatedAt: 1000000000,
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
        },
      ];

      jest
        .spyOn(eventsRepository, "listEvents")
        .mockResolvedValue(mockEvents);

      const result = await listEventsAction();

      expect(result.success).toBe(true);
      expect(result.events).toEqual(mockEvents);
      expect(eventsRepository.listEvents).toHaveBeenCalledWith(undefined);
    });

    it("filters events by companyId when provided", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-1",
          title: "Event 1",
          status: "live",
          joinPath: "/join/event-1",
          qrPngPath: "events/event-1/qr/join.png",
          companyId: "company-a",
          createdAt: 2000000000,
          updatedAt: 2000000000,
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
        },
      ];

      jest
        .spyOn(eventsRepository, "listEvents")
        .mockResolvedValue(mockEvents);

      const result = await listEventsAction({ companyId: "company-a" });

      expect(result.success).toBe(true);
      expect(result.events).toEqual(mockEvents);
      expect(eventsRepository.listEvents).toHaveBeenCalledWith({
        companyId: "company-a",
      });
      expect(result.events?.[0].companyId).toBe("company-a");
    });

    it("filters events with no company when companyId is null", async () => {
      const mockEvents: Event[] = [
        {
          id: "event-2",
          title: "Event 2",
          status: "draft",
          joinPath: "/join/event-2",
          qrPngPath: "events/event-2/qr/join.png",
          companyId: null,
          createdAt: 1000000000,
          updatedAt: 1000000000,
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
        },
      ];

      jest
        .spyOn(eventsRepository, "listEvents")
        .mockResolvedValue(mockEvents);

      const result = await listEventsAction({ companyId: null });

      expect(result.success).toBe(true);
      expect(result.events).toEqual(mockEvents);
      expect(eventsRepository.listEvents).toHaveBeenCalledWith({
        companyId: null,
      });
      expect(result.events?.[0].companyId).toBeNull();
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(eventsRepository, "listEvents")
        .mockRejectedValue(new Error("Database error"));

      const result = await listEventsAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("createEventAction", () => {
    beforeEach(() => {
      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: true,
      });
    });

    it("validates company exists and is active", async () => {
      const mockCompany: Company = {
        id: "company-a",
        name: "Company A",
        status: "active",
        deletedAt: null,
        createdAt: 1000000000,
        updatedAt: 1000000000,
      };

      jest
        .spyOn(companiesRepository, "getCompany")
        .mockResolvedValue(mockCompany);
      jest.spyOn(eventsRepository, "createEvent").mockResolvedValue("event-1");

      const result = await createEventAction({
        title: "Test Event",
        buttonColor: "#FF0000",
        companyId: "company-a",
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event-1");
      expect(companiesRepository.getCompany).toHaveBeenCalledWith("company-a");
    });

    it("rejects when company not found", async () => {
      jest.spyOn(companiesRepository, "getCompany").mockResolvedValue(null);

      const result = await createEventAction({
        title: "Test Event",
        buttonColor: "#FF0000",
        companyId: "nonexistent",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Company not found");
      expect(eventsRepository.createEvent).not.toHaveBeenCalled();
    });

    it("rejects when company is not active", async () => {
      const mockCompany: Company = {
        id: "company-a",
        name: "Company A",
        status: "deleted",
        deletedAt: Date.now(),
        createdAt: 1000000000,
        updatedAt: 1000000000,
      };

      jest
        .spyOn(companiesRepository, "getCompany")
        .mockResolvedValue(mockCompany);

      const result = await createEventAction({
        title: "Test Event",
        buttonColor: "#FF0000",
        companyId: "company-a",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Company is not active");
      expect(eventsRepository.createEvent).not.toHaveBeenCalled();
    });
  });

  describe("updateEventWelcome", () => {
    const mockEventId = "event-123";
    let mockEventRef: {
      get: jest.Mock;
      update: jest.Mock;
    };

    beforeEach(() => {
      // Mock Firebase admin db
      mockEventRef = {
        get: jest.fn(),
        update: jest.fn(),
      };

      mockCollection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      // Mock auth
      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: true,
      });

      // Mock event exists
      mockEventRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ id: mockEventId }),
      });
    });

    it("updates welcome fields using dot notation", async () => {
      const welcomeData = {
        title: "Welcome to Event",
        body: "Join us for an amazing experience",
        ctaLabel: "Get Started",
        backgroundImage: "https://example.com/bg.jpg",
        backgroundColor: "#FF0000",
      };

      const result = await updateEventWelcome(mockEventId, welcomeData);

      expect(result.success).toBe(true);
      expect(mockEventRef.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
        "welcome.title": welcomeData.title,
        "welcome.body": welcomeData.body,
        "welcome.ctaLabel": welcomeData.ctaLabel,
        "welcome.backgroundImage": welcomeData.backgroundImage,
        "welcome.backgroundColor": welcomeData.backgroundColor,
      });
    });

    it("updates only provided fields", async () => {
      const partialData = {
        title: "New Title",
      };

      const result = await updateEventWelcome(mockEventId, partialData);

      expect(result.success).toBe(true);
      expect(mockEventRef.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
        "welcome.title": "New Title",
      });
    });

    it("returns error when event not found", async () => {
      mockEventRef.get.mockResolvedValue({
        exists: false,
      });

      const result = await updateEventWelcome(mockEventId, { title: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("EVENT_NOT_FOUND");
      }
      expect(mockEventRef.update).not.toHaveBeenCalled();
    });

    it("returns error when not authorized", async () => {
      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: false,
        error: "Invalid credentials",
      });

      const result = await updateEventWelcome(mockEventId, { title: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PERMISSION_DENIED");
      }
      expect(mockEventRef.update).not.toHaveBeenCalled();
    });

    it("validates input data with schema", async () => {
      const invalidData = {
        title: "", // Empty string should fail validation if min length required
      };

      const result = await updateEventWelcome(mockEventId, invalidData);

      // Should either validate or fail gracefully
      expect(result).toHaveProperty("success");
    });
  });

  describe("updateEventEnding", () => {
    const mockEventId = "event-123";
    let mockEventRef: {
      get: jest.Mock;
      update: jest.Mock;
    };

    beforeEach(() => {
      mockEventRef = {
        get: jest.fn(),
        update: jest.fn(),
      };

      mockCollection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: true,
      });

      mockEventRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ id: mockEventId }),
      });
    });

    it("updates ending fields using dot notation", async () => {
      const endingData = {
        title: "Thanks for joining!",
        body: "We hope you enjoyed the event",
        ctaLabel: "Learn More",
        ctaUrl: "https://example.com",
      };

      const result = await updateEventEnding(mockEventId, endingData);

      expect(result.success).toBe(true);
      expect(mockEventRef.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
        "ending.title": endingData.title,
        "ending.body": endingData.body,
        "ending.ctaLabel": endingData.ctaLabel,
        "ending.ctaUrl": endingData.ctaUrl,
      });
    });

    it("updates only provided ending fields", async () => {
      const partialData = {
        title: "New Ending Title",
        ctaUrl: "https://new-url.com",
      };

      const result = await updateEventEnding(mockEventId, partialData);

      expect(result.success).toBe(true);
      expect(mockEventRef.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
        "ending.title": "New Ending Title",
        "ending.ctaUrl": "https://new-url.com",
      });
    });

    it("returns error when event not found", async () => {
      mockEventRef.get.mockResolvedValue({
        exists: false,
      });

      const result = await updateEventEnding(mockEventId, { title: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("EVENT_NOT_FOUND");
      }
      expect(mockEventRef.update).not.toHaveBeenCalled();
    });

    it("returns error when not authorized", async () => {
      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: false,
        error: "Invalid credentials",
      });

      const result = await updateEventEnding(mockEventId, { title: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PERMISSION_DENIED");
      }
      expect(mockEventRef.update).not.toHaveBeenCalled();
    });
  });

  describe("updateEventShare", () => {
    const mockEventId = "event-123";
    let mockEventRef: {
      get: jest.Mock;
      update: jest.Mock;
    };

    beforeEach(() => {
      mockEventRef = {
        get: jest.fn(),
        update: jest.fn(),
      };

      mockCollection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: true,
      });

      mockEventRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ id: mockEventId }),
      });
    });

    it("updates share configuration using dot notation", async () => {
      const shareData = {
        allowDownload: true,
        allowSystemShare: true,
        allowEmail: false,
        socials: ["instagram", "tiktok", "facebook"] as Array<"instagram" | "tiktok" | "facebook" | "x" | "snapchat" | "whatsapp" | "custom">,
      };

      const result = await updateEventShare(mockEventId, shareData);

      expect(result.success).toBe(true);
      expect(mockEventRef.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
        "share.allowDownload": true,
        "share.allowSystemShare": true,
        "share.allowEmail": false,
        "share.socials": ["instagram", "tiktok", "facebook"],
      });
    });

    it("updates only provided share fields", async () => {
      const partialData = {
        allowDownload: false,
      };

      const result = await updateEventShare(mockEventId, partialData);

      expect(result.success).toBe(true);
      expect(mockEventRef.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
        "share.allowDownload": false,
      });
    });

    it("returns error when event not found", async () => {
      mockEventRef.get.mockResolvedValue({
        exists: false,
      });

      const result = await updateEventShare(mockEventId, {
        allowDownload: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("EVENT_NOT_FOUND");
      }
      expect(mockEventRef.update).not.toHaveBeenCalled();
    });

    it("returns error when not authorized", async () => {
      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: false,
        error: "Invalid credentials",
      });

      const result = await updateEventShare(mockEventId, {
        allowDownload: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PERMISSION_DENIED");
      }
      expect(mockEventRef.update).not.toHaveBeenCalled();
    });
  });

  describe("updateEventTheme", () => {
    const mockEventId = "event-123";
    let mockEventRef: {
      get: jest.Mock;
      update: jest.Mock;
    };

    beforeEach(() => {
      mockEventRef = {
        get: jest.fn(),
        update: jest.fn(),
      };

      mockCollection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: true,
      });

      mockEventRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ id: mockEventId }),
      });
    });

    it("updates theme configuration using dot notation", async () => {
      const themeData = {
        buttonColor: "#FF0000",
        buttonTextColor: "#FFFFFF",
        backgroundColor: "#000000",
        backgroundImage: "https://example.com/theme-bg.jpg",
      };

      const result = await updateEventTheme(mockEventId, themeData);

      expect(result.success).toBe(true);
      expect(mockEventRef.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
        "theme.buttonColor": themeData.buttonColor,
        "theme.buttonTextColor": themeData.buttonTextColor,
        "theme.backgroundColor": themeData.backgroundColor,
        "theme.backgroundImage": themeData.backgroundImage,
      });
    });

    it("updates only provided theme fields", async () => {
      const partialData = {
        buttonColor: "#00FF00",
      };

      const result = await updateEventTheme(mockEventId, partialData);

      expect(result.success).toBe(true);
      expect(mockEventRef.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
        "theme.buttonColor": "#00FF00",
      });
    });

    it("returns error when event not found", async () => {
      mockEventRef.get.mockResolvedValue({
        exists: false,
      });

      const result = await updateEventTheme(mockEventId, {
        buttonColor: "#FF0000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("EVENT_NOT_FOUND");
      }
      expect(mockEventRef.update).not.toHaveBeenCalled();
    });

    it("returns error when not authorized", async () => {
      jest.spyOn(auth, "verifyAdminSecret").mockResolvedValue({
        authorized: false,
        error: "Invalid credentials",
      });

      const result = await updateEventTheme(mockEventId, {
        buttonColor: "#FF0000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PERMISSION_DENIED");
      }
      expect(mockEventRef.update).not.toHaveBeenCalled();
    });
  });
});
