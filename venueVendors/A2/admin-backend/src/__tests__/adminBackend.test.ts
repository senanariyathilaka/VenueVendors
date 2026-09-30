import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { rootValue } from "../schema";
import { AdminDataSource } from "../data-source";
import { Vendor } from "../entity/vendorEntity";
import { Venue } from "../entity/venueEntity";
import { Application } from "../entity/applicationEntity";

const adminContext = {
  token: "admin-static-token",
};

const noAdminContext = {
  token: "",
};

const wrongAdminContext = {
  token: "wrong-token",
};

type MockFn = ReturnType<typeof jest.fn>;

type MockRepository = {
  find?: MockFn;
  findOne?: MockFn;
  findOneBy?: MockFn;
  create?: MockFn;
  save?: MockFn;
  remove?: MockFn;
  delete?: MockFn;
  count?: MockFn;
};

function mockRepositories(repositories: {
  vendorRepository?: MockRepository;
  venueRepository?: MockRepository;
  applicationRepository?: MockRepository;
}) {
  jest
    .spyOn(AdminDataSource, "getRepository")
    .mockImplementation((entity: unknown) => {
      if (entity === Vendor && repositories.vendorRepository) {
        return repositories.vendorRepository as never;
      }

      if (entity === Venue && repositories.venueRepository) {
        return repositories.venueRepository as never;
      }

      if (entity === Application && repositories.applicationRepository) {
        return repositories.applicationRepository as never;
      }

      throw new Error("Repository was not mocked for this test.");
    });
}

describe("Admin GraphQL backend contextual unit tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("1. Admin login accepts correct credentials and rejects wrong credentials", async () => {
    // This test checks the required admin login behaviour.
    // Admin must log in using admin/admin before using the dashboard.
    // It also checks a failed login so the test is not only testing the happy path.

    const successfulLogin = await rootValue.adminLogin({
      username: "admin",
      password: "admin",
    });

    const failedLogin = await rootValue.adminLogin({
      username: "admin",
      password: "wrong-password",
    });

    expect(successfulLogin.success).toBe(true);
    expect(successfulLogin.message).toBe("Admin login successful.");
    expect(successfulLogin.token).toBe("admin-static-token");

    expect(failedLogin.success).toBe(false);
    expect(failedLogin.message).toBe("Invalid admin credentials.");
    expect(failedLogin.token).toBeNull();
  });

  test("2. Protected admin queries reject missing or invalid admin tokens", async () => {
    // This test checks that the admin GraphQL API is protected.
    // A marker should not be able to call admin dashboard data without the admin token.
    // It checks both no token and a wrong token.

    await expect(
      Promise.resolve().then(() => rootValue.vendors({}, noAdminContext))
    ).rejects.toThrow("Admin authentication required");

    await expect(
      Promise.resolve().then(() => rootValue.vendors({}, wrongAdminContext))
    ).rejects.toThrow("Admin authentication required");
  });

  test("3. Admin can create a venue and the venue is saved with the selected vendor", async () => {
    // This test covers the proves the backend finds the chosen vendor, creates a venue entity,
    // And saves it using TypeORM, reloads it with the vendor relation, and returns the correct GraphQL response.

    const vendorRecord = {
      id: 1,
      name: "Luca Bennett",
      email: "luca.vendor@venuevendors.com",
      password: "hashed-password",
      venue: "Riverside Loft",
    };

    const savedVenue = {
      id: 20,
      name: "Admin Test Venue",
      type: "Corporate",
      location: "Melbourne CBD",
      capacity: 80,
      recommendedSuitability: "Corporate, Networking",
      blockedDateFrom: null,
      blockedDateTo: null,
      isFeatured: false,
      vendor: vendorRecord,
      applications: [],
      preferences: [],
    };

    const venueRepository = {
      create: jest.fn((venueData: Record<string, unknown>) => venueData),
      save: jest.fn(async () => savedVenue),
      findOne: jest.fn(async () => savedVenue),
    };

    const vendorRepository = {
      findOneBy: jest.fn(async () => vendorRecord),
    };

    mockRepositories({
      vendorRepository,
      venueRepository,
    });

    const input = {
      name: "Admin Test Venue",
      type: "Corporate",
      location: "Melbourne CBD",
      capacity: 80,
      recommendedSuitability: "Corporate, Networking",
      vendorId: 1,
    };

    const result = await rootValue.createVenue({ input }, adminContext);

    expect(vendorRepository.findOneBy).toHaveBeenCalledTimes(1);
    expect(venueRepository.create).toHaveBeenCalledTimes(1);
    expect(venueRepository.save).toHaveBeenCalledTimes(1);
    expect(venueRepository.findOne).toHaveBeenCalledTimes(1);

    expect(result.id).toBe(20);
    expect(result.name).toBe("Admin Test Venue");
    expect(result.type).toBe("Corporate");
    expect(result.location).toBe("Melbourne CBD");
    expect(result.capacity).toBe(80);
    expect(result.vendorId).toBe(1);
    expect(result.vendorName).toBe("Luca Bennett");
  });

  test("4. Admin can update an existing venue and change its venue details", async () => {
    // This test covers the Update part of admin venue CRUD.

    const oldVendor = {
      id: 1,
      name: "Luca Bennett",
      email: "luca.vendor@venuevendors.com",
      password: "hashed-password",
      venue: "Riverside Loft",
    };

    const newVendor = {
      id: 2,
      name: "Chloe Adams",
      email: "chloe.vendor@venuevendors.com",
      password: "hashed-password",
      venue: "Garden Pavilion",
    };

    const venueRecord = {
      id: 1,
      name: "Riverside Loft",
      type: "Corporate",
      location: "Southbank",
      capacity: 120,
      recommendedSuitability: "Corporate, Networking",
      blockedDateFrom: null,
      blockedDateTo: null,
      isFeatured: false,
      vendor: oldVendor,
      applications: [],
      preferences: [],
    };

    const venueRepository = {
      findOne: jest.fn(async () => venueRecord),
      save: jest.fn(async (venueData: Record<string, unknown>) => venueData),
    };

    const vendorRepository = {
      findOneBy: jest.fn(async () => newVendor),
    };

    mockRepositories({
      venueRepository,
      vendorRepository,
    });

    const result = await rootValue.updateVenue(
      {
        id: "1",
        input: {
          name: "Riverside Loft Updated",
          type: "Corporate",
          location: "Southbank",
          capacity: 130,
          recommendedSuitability: "Corporate, Networking, Workshop",
          vendorId: 2,
        },
      },
      adminContext
    );

    expect(venueRepository.findOne).toHaveBeenCalledTimes(2);
    expect(vendorRepository.findOneBy).toHaveBeenCalledTimes(1);
    expect(venueRepository.save).toHaveBeenCalledTimes(1);

    expect(result.name).toBe("Riverside Loft Updated");
    expect(result.capacity).toBe(130);
    expect(result.recommendedSuitability).toBe(
      "Corporate, Networking, Workshop"
    );
    expect(result.vendorId).toBe(2);
    expect(result.vendorName).toBe("Chloe Adams");
  });

  test("5. Admin can feature a venue and reassign it to another vendor", async () => {
    // This test covers admin behaviours that touch venue management:

    const oldVendor = {
      id: 1,
      name: "Luca Bennett",
      email: "luca.vendor@venuevendors.com",
      password: "hashed-password",
      venue: "Riverside Loft",
    };

    const newVendor = {
      id: 2,
      name: "Chloe Adams",
      email: "chloe.vendor@venuevendors.com",
      password: "hashed-password",
      venue: "Garden Pavilion",
    };

    const venueRecord = {
      id: 1,
      name: "Riverside Loft",
      type: "Corporate",
      location: "Southbank",
      capacity: 130,
      recommendedSuitability: "Corporate, Networking, Workshop",
      blockedDateFrom: null,
      blockedDateTo: null,
      isFeatured: false,
      vendor: oldVendor,
      applications: [],
      preferences: [],
    };

    const venueRepository = {
      findOne: jest.fn(async () => venueRecord),
      save: jest.fn(async (venueData: Record<string, unknown>) => venueData),
    };

    const vendorRepository = {
      findOneBy: jest.fn(async () => newVendor),
    };

    mockRepositories({
      venueRepository,
      vendorRepository,
    });

    const featuredResult = await rootValue.setFeaturedVenue(
      {
        venueId: "1",
        isFeatured: true,
      },
      adminContext
    );

    const reassignedResult = await rootValue.assignVendorToVenue(
      {
        venueId: "1",
        vendorId: "2",
      },
      adminContext
    );

    expect(venueRepository.findOne).toHaveBeenCalledTimes(4);
    expect(venueRepository.save).toHaveBeenCalledTimes(2);
    expect(vendorRepository.findOneBy).toHaveBeenCalledTimes(1);

    expect(featuredResult.isFeatured).toBe(true);
    expect(reassignedResult.id).toBe(1);
    expect(reassignedResult.name).toBe("Riverside Loft");
    expect(reassignedResult.vendorId).toBe(2);
    expect(reassignedResult.vendorName).toBe("Chloe Adams");
  });

  test("6. Admin delete protects venues with applications but allows clean venues to be deleted", async () => {
    // This test covers the Delete part of venue CRUD.
    // It checks the important safety rule: venues with booking applications should not be deleted
    // because that would damage booking history and reports.
    // It also checks the successful delete path for a venue with no applications.

    const venueWithApplications = {
      id: 1,
      name: "Riverside Loft",
      type: "Corporate",
      location: "Southbank",
      capacity: 130,
      recommendedSuitability: "Corporate, Networking, Workshop",
      blockedDateFrom: null,
      blockedDateTo: null,
      isFeatured: false,
      vendor: {
        id: 2,
        name: "Chloe Adams",
      },
      applications: [{ id: 900 }],
      preferences: [],
    };

    const venueRepositoryBlocked = {
      findOne: jest.fn(async () => venueWithApplications),
      remove: jest.fn(),
      delete: jest.fn(),
    };

    mockRepositories({
      venueRepository: venueRepositoryBlocked,
    });

    await expect(
      Promise.resolve().then(() =>
        rootValue.deleteVenue(
          {
            id: "1",
          },
          adminContext
        )
      )
    ).rejects.toThrow(
      "Cannot delete a venue that already has booking applications."
    );

    expect(venueRepositoryBlocked.remove).not.toHaveBeenCalled();
    expect(venueRepositoryBlocked.delete).not.toHaveBeenCalled();

    jest.restoreAllMocks();

    const cleanVenue = {
      ...venueWithApplications,
      id: 99,
      name: "Clean Test Venue",
      applications: [],
    };

    const venueRepositoryClean = {
      findOne: jest.fn(async () => cleanVenue),
      remove: jest.fn(async () => cleanVenue),
      delete: jest.fn(async () => ({ affected: 1 })),
    };

    mockRepositories({
      venueRepository: venueRepositoryClean,
    });

    const deleteResult = await rootValue.deleteVenue(
      {
        id: "99",
      },
      adminContext
    );

    expect(deleteResult).toBe(true);
    expect(venueRepositoryClean.findOne).toHaveBeenCalledTimes(1);
    expect(venueRepositoryClean.remove).toHaveBeenCalledTimes(1);
  });
});