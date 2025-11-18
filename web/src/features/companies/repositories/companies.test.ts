import { db } from "@/lib/firebase/admin";
import type { Company } from "../types/company.types";
import { createCompany, listCompanies, getCompany, deleteCompany } from "./companies";

describe("Companies Repository", () => {
  const mockDb = db as unknown as {
    collection: ReturnType<typeof jest.fn>;
    runTransaction: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCompany", () => {
    it("creates a company with unique name validation", async () => {
      const mockCompanyRef = {
        id: "company-123",
      };

      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockCompanyRef),
        where: jest.fn().mockReturnValue(mockQuery),
      });

      const mockTxn = {
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
        set: jest.fn(),
      };

      mockDb.runTransaction.mockImplementation(async (callback) => {
        return await callback(mockTxn);
      });

      const companyId = await createCompany({
        name: "Acme Corp",
      });

      expect(companyId).toBe("company-123");
      expect(mockDb.collection).toHaveBeenCalledWith("companies");
      expect(mockDb.runTransaction).toHaveBeenCalled();

      // Verify uniqueness check was performed
      expect(mockTxn.get).toHaveBeenCalled();

      // Verify company data structure
      const companyCall = mockTxn.set.mock.calls[0];
      const companyData = companyCall[1] as Company;
      expect(companyData).toMatchObject({
        id: "company-123",
        name: "Acme Corp",
        status: "active",
        deletedAt: null,
      });
      expect(companyData.createdAt).toBeGreaterThan(0);
      expect(companyData.updatedAt).toBe(companyData.createdAt);
    });

    it("rejects duplicate company name (case-insensitive)", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({ id: "company-new" }),
        where: jest.fn().mockReturnValue(mockQuery),
      });

      const mockTxn = {
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: "existing-123",
              data: () => ({ name: "Acme Corp", status: "active" }),
            },
          ],
        }),
        set: jest.fn(),
      };

      mockDb.runTransaction.mockImplementation(async (callback) => {
        return await callback(mockTxn);
      });

      await expect(
        createCompany({
          name: "Acme Corp",
        })
      ).rejects.toThrow('Company name "Acme Corp" already exists');

      expect(mockTxn.set).not.toHaveBeenCalled();
    });

    it("creates company with optional metadata", async () => {
      const mockCompanyRef = {
        id: "company-456",
      };

      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockCompanyRef),
        where: jest.fn().mockReturnValue(mockQuery),
      });

      const mockTxn = {
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
        set: jest.fn(),
      };

      mockDb.runTransaction.mockImplementation(async (callback) => {
        return await callback(mockTxn);
      });

      const companyId = await createCompany({
        name: "Nike Inc",
        brandColor: "#FF5733",
        contactEmail: "contact@nike.com",
        termsUrl: "https://nike.com/terms",
        privacyUrl: "https://nike.com/privacy",
      });

      expect(companyId).toBe("company-456");

      const companyCall = mockTxn.set.mock.calls[0];
      const companyData = companyCall[1] as Company;
      expect(companyData).toMatchObject({
        id: "company-456",
        name: "Nike Inc",
        status: "active",
        deletedAt: null,
        brandColor: "#FF5733",
        contactEmail: "contact@nike.com",
        termsUrl: "https://nike.com/terms",
        privacyUrl: "https://nike.com/privacy",
      });
    });
  });

  describe("listCompanies", () => {
    it("returns only active companies ordered by name", async () => {
      const mockCompanies = [
        {
          id: "company-1",
          name: "Acme Corp",
          status: "active",
          deletedAt: null,
          createdAt: 1000000000,
          updatedAt: 1000000000,
        },
        {
          id: "company-2",
          name: "Beta Inc",
          status: "active",
          deletedAt: null,
          createdAt: 2000000000,
          updatedAt: 2000000000,
        },
      ];

      const mockDocs = mockCompanies.map((company) => ({
        id: company.id,
        data: jest.fn().mockReturnValue(company),
      }));

      mockDb.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ docs: mockDocs }),
          }),
        }),
      });

      const companies = await listCompanies();

      expect(mockDb.collection).toHaveBeenCalledWith("companies");
      expect(companies).toHaveLength(2);
      expect(companies[0].name).toBe("Acme Corp");
      expect(companies[1].name).toBe("Beta Inc");
    });

    it("excludes deleted companies from list", async () => {
      const mockCompanies = [
        {
          id: "company-1",
          name: "Active Corp",
          status: "active",
          deletedAt: null,
          createdAt: 1000000000,
          updatedAt: 1000000000,
        },
      ];

      const mockDocs = mockCompanies.map((company) => ({
        id: company.id,
        data: jest.fn().mockReturnValue(company),
      }));

      const mockWhere = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: mockDocs }),
        }),
      });

      mockDb.collection.mockReturnValue({
        where: mockWhere,
      });

      const companies = await listCompanies();

      // Verify that we filter by status == 'active'
      expect(mockWhere).toHaveBeenCalledWith("status", "==", "active");
      expect(companies).toHaveLength(1);
      expect(companies[0].name).toBe("Active Corp");
    });

    it("returns empty array when no companies exist", async () => {
      mockDb.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ docs: [] }),
          }),
        }),
      });

      const companies = await listCompanies();

      expect(companies).toEqual([]);
    });
  });

  describe("getCompany", () => {
    it("returns company when it exists", async () => {
      const mockCompanyData = {
        name: "Test Company",
        status: "active",
        deletedAt: null,
        brandColor: "#000000",
        contactEmail: "test@example.com",
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      const mockDoc = {
        exists: true,
        id: "company-123",
        data: jest.fn().mockReturnValue(mockCompanyData),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      const company = await getCompany("company-123");

      expect(mockDb.collection).toHaveBeenCalledWith("companies");
      expect(company).toEqual({ id: "company-123", ...mockCompanyData });
    });

    it("returns null when company does not exist", async () => {
      const mockDoc = {
        exists: false,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      const company = await getCompany("nonexistent");

      expect(company).toBeNull();
    });

    it("validates company data with schema", async () => {
      const invalidCompanyData = {
        name: "",
        status: "invalid-status",
        deletedAt: null,
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      const mockDoc = {
        exists: true,
        id: "company-123",
        data: jest.fn().mockReturnValue(invalidCompanyData),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      });

      await expect(getCompany("company-123")).rejects.toThrow();
    });
  });

  describe("deleteCompany", () => {
    it("soft deletes a company by setting status to deleted and deletedAt timestamp", async () => {
      const mockUpdate = jest.fn();
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      await deleteCompany("company-123");

      expect(mockDb.collection).toHaveBeenCalledWith("companies");
      expect(mockUpdate).toHaveBeenCalledWith({
        status: "deleted",
        deletedAt: expect.any(Number),
        updatedAt: expect.any(Number),
      });

      // Verify deletedAt and updatedAt are recent timestamps
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.deletedAt).toBeGreaterThan(Date.now() - 1000);
      expect(updateCall.updatedAt).toBeGreaterThan(Date.now() - 1000);
    });

    it("does not actually delete the document from Firestore", async () => {
      const mockUpdate = jest.fn();
      const mockDelete = jest.fn();
      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          update: mockUpdate,
          delete: mockDelete,
        }),
      });

      await deleteCompany("company-123");

      // Verify we called update, not delete
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
