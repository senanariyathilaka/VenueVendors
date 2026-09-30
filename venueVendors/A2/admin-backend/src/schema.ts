import { buildSchema } from "graphql";
import { AdminDataSource } from "./data-source";
import { Vendor } from "./entity/vendorEntity";
import { Venue } from "./entity/venueEntity";
import { Application } from "./entity/applicationEntity";
import { Hirer } from "./entity/hirerEntity";
import { GraphQLContext, requireAdmin, validateAdminCredentials } from "./auth";

const vendorRepository = () => AdminDataSource.getRepository(Vendor);
const venueRepository = () => AdminDataSource.getRepository(Venue);
const applicationRepository = () => AdminDataSource.getRepository(Application);
const hirerRepository = () => AdminDataSource.getRepository(Hirer);

function safeText(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function formatNullableDate(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsedDate = new Date(String(value));

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function mapVenue(venue: Venue) {
  return {
    id: venue.id,
    name: safeText(venue.name, "Untitled venue"),
    type: safeText(venue.type, "General venue"),
    location: safeText(venue.location, "Not provided"),
    capacity: Number(venue.capacity ?? 0),
    blockedDateFrom: formatNullableDate(venue.blockedDateFrom),
    blockedDateTo: formatNullableDate(venue.blockedDateTo),
    recommendedSuitability: safeText(
      venue.recommendedSuitability,
      "General events"
    ),
    isFeatured: Boolean(venue.isFeatured),
    vendorId: venue.vendor?.id ?? null,
    vendorName: safeText(venue.vendor?.name, ""),
  };
}

function mapVendor(vendor: Vendor) {
  return {
    id: vendor.id,
    name: safeText(vendor.name, "Unnamed vendor"),
    email: safeText(vendor.email, "No email"),
    venue: safeText(vendor.venue, ""),
  };
}

function formatHour(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date
    .toLocaleTimeString("en-AU", {
      hour: "numeric",
      hour12: true,
    })
    .replace(" ", "")
    .toLowerCase();
}

function formatTimeSlot(start: Date, durationHours: number) {
  const safeDuration = Number(durationHours ?? 0);
  const end = new Date(start.getTime() + safeDuration * 60 * 60 * 1000);

  return `${formatHour(start)}-${formatHour(end)}`;
}

function getSuccessfulStatus(status: string | null | undefined) {
  const normalised = String(status ?? "").trim().toLowerCase();
  return normalised === "approved" || normalised === "accepted";
}

export const schema = buildSchema(`
  type AdminLoginResult {
    success: Boolean!
    message: String!
    token: String
  }

  type Vendor {
    id: ID!
    name: String!
    email: String!
    venue: String!
  }

  type Venue {
    id: ID!
    name: String!
    type: String!
    location: String!
    capacity: Int!
    blockedDateFrom: String
    blockedDateTo: String
    recommendedSuitability: String!
    isFeatured: Boolean!
    vendorId: Int
    vendorName: String
  }

  input VenueInput {
    name: String!
    type: String!
    location: String!
    capacity: Int!
    recommendedSuitability: String!
    vendorId: Int!
  }

  type PopularVenueReport {
    venueId: ID!
    venueName: String!
    bookingCount: Int!
    mostPopularDay: String!
    mostPopularTimeSlot: String!
  }

  type ActiveApplicantReport {
    hirerId: ID!
    hirerName: String!
    totalApplications: Int!
    successfulBookings: Int!
    successRate: Float!
  }

  type Query {
    health: String!
    vendors: [Vendor!]!
    venues: [Venue!]!
    featuredVenues: [Venue!]!
    topPopularVenues: [PopularVenueReport!]!
    topActiveApplicants: [ActiveApplicantReport!]!
  }

  type Mutation {
    adminLogin(username: String!, password: String!): AdminLoginResult!
    createVenue(input: VenueInput!): Venue!
    updateVenue(id: ID!, input: VenueInput!): Venue!
    deleteVenue(id: ID!): Boolean!
    assignVendorToVenue(venueId: ID!, vendorId: ID!): Venue!
    setFeaturedVenue(venueId: ID!, isFeatured: Boolean!): Venue!
  }
`);

export const rootValue = {
  health: () => "Admin GraphQL backend is running.",

  adminLogin: async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    const valid = validateAdminCredentials(username, password);

    if (!valid) {
      return {
        success: false,
        message: "Invalid admin credentials.",
        token: null,
      };
    }

    return {
      success: true,
      message: "Admin login successful.",
      token: process.env.ADMIN_TOKEN || "admin-static-token",
    };
  },

  vendors: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);

    const vendors = await vendorRepository().find({
      order: { name: "ASC" },
    });

    return vendors.map(mapVendor);
  },

  venues: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);

    const venues = await venueRepository().find({
      relations: { vendor: true },
      order: { name: "ASC" },
    });

    return venues.map(mapVenue);
  },

  featuredVenues: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);

    const venues = await venueRepository().find({
      where: {
        isFeatured: true,
      },
      relations: { vendor: true },
      order: { name: "ASC" },
    });

    return venues.map(mapVenue);
  },

  createVenue: async (
    {
      input,
    }: {
      input: {
        name: string;
        type: string;
        location: string;
        capacity: number;
        recommendedSuitability: string;
        vendorId: number;
      };
    },
    context: GraphQLContext
  ) => {
    requireAdmin(context);

    const vendor = await vendorRepository().findOneBy({
      id: Number(input.vendorId),
    });

    if (!vendor) {
      throw new Error("Vendor not found.");
    }

    const venue = venueRepository().create({
      name: safeText(input.name, "Untitled venue"),
      type: safeText(input.type, "General venue"),
      location: safeText(input.location, "Not provided"),
      capacity: Number(input.capacity),
      recommendedSuitability: safeText(
        input.recommendedSuitability,
        "General events"
      ),
      blockedDateFrom: null,
      blockedDateTo: null,
      isFeatured: false,
      vendor,
    });

    const savedVenue = await venueRepository().save(venue);

    const loadedVenue = await venueRepository().findOne({
      where: { id: savedVenue.id },
      relations: { vendor: true },
    });

    if (!loadedVenue) {
      throw new Error("Unable to load created venue.");
    }

    return mapVenue(loadedVenue);
  },

  updateVenue: async (
    {
      id,
      input,
    }: {
      id: string;
      input: {
        name: string;
        type: string;
        location: string;
        capacity: number;
        recommendedSuitability: string;
        vendorId: number;
      };
    },
    context: GraphQLContext
  ) => {
    requireAdmin(context);

    const venue = await venueRepository().findOne({
      where: { id: Number(id) },
      relations: { vendor: true },
    });

    if (!venue) {
      throw new Error("Venue not found.");
    }

    const vendor = await vendorRepository().findOneBy({
      id: Number(input.vendorId),
    });

    if (!vendor) {
      throw new Error("Vendor not found.");
    }

    venue.name = safeText(input.name, "Untitled venue");
    venue.type = safeText(input.type, "General venue");
    venue.location = safeText(input.location, "Not provided");
    venue.capacity = Number(input.capacity);
    venue.recommendedSuitability = safeText(
      input.recommendedSuitability,
      "General events"
    );
    venue.vendor = vendor;

    const savedVenue = await venueRepository().save(venue);

    const loadedVenue = await venueRepository().findOne({
      where: { id: savedVenue.id },
      relations: { vendor: true },
    });

    if (!loadedVenue) {
      throw new Error("Unable to load updated venue.");
    }

    return mapVenue(loadedVenue);
  },

  deleteVenue: async (
    { id }: { id: string },
    context: GraphQLContext
  ) => {
    requireAdmin(context);

    const venue = await venueRepository().findOne({
      where: { id: Number(id) },
      relations: { applications: true },
    });

    if (!venue) {
      throw new Error("Venue not found.");
    }

    if ((venue.applications ?? []).length > 0) {
      throw new Error(
        "Cannot delete a venue that already has booking applications."
      );
    }

    await venueRepository().remove(venue);
    return true;
  },

  assignVendorToVenue: async (
    { venueId, vendorId }: { venueId: string; vendorId: string },
    context: GraphQLContext
  ) => {
    requireAdmin(context);

    const venue = await venueRepository().findOne({
      where: { id: Number(venueId) },
      relations: { vendor: true },
    });

    if (!venue) {
      throw new Error("Venue not found.");
    }

    const vendor = await vendorRepository().findOneBy({
      id: Number(vendorId),
    });

    if (!vendor) {
      throw new Error("Vendor not found.");
    }

    venue.vendor = vendor;

    const savedVenue = await venueRepository().save(venue);

    const loadedVenue = await venueRepository().findOne({
      where: { id: savedVenue.id },
      relations: { vendor: true },
    });

    if (!loadedVenue) {
      throw new Error("Unable to load reassigned venue.");
    }

    return mapVenue(loadedVenue);
  },

  setFeaturedVenue: async (
    { venueId, isFeatured }: { venueId: string; isFeatured: boolean },
    context: GraphQLContext
  ) => {
    requireAdmin(context);

    const venue = await venueRepository().findOne({
      where: { id: Number(venueId) },
      relations: { vendor: true },
    });

    if (!venue) {
      throw new Error("Venue not found.");
    }

    venue.isFeatured = Boolean(isFeatured);

    const savedVenue = await venueRepository().save(venue);

    const loadedVenue = await venueRepository().findOne({
      where: { id: savedVenue.id },
      relations: { vendor: true },
    });

    if (!loadedVenue) {
      throw new Error("Unable to load featured venue.");
    }

    return mapVenue(loadedVenue);
  },

  topPopularVenues: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);

    const applications = await applicationRepository().find({
      relations: { venue: true },
      order: { createdAt: "DESC" },
    });

    if (applications.length === 0) {
      return [];
    }

    const successfulApplications = applications.filter((application) =>
      getSuccessfulStatus(application.status)
    );

    const sourceApplications = (
      successfulApplications.length > 0 ? successfulApplications : applications
    ).filter((application) => application.venue);

    const groupedByVenue = new Map<
      number,
      {
        venueName: string;
        bookingCount: number;
        dayCounts: Map<string, number>;
        slotCounts: Map<string, number>;
      }
    >();

    for (const application of sourceApplications) {
      const venueId = application.venue?.id;

      if (!venueId) {
        continue;
      }

      const bookingStart =
        application.bookingStart instanceof Date
          ? application.bookingStart
          : new Date(application.bookingStart);

      if (Number.isNaN(bookingStart.getTime())) {
        continue;
      }

      const weekday = bookingStart.toLocaleDateString("en-AU", {
        weekday: "long",
      });

      const slot = formatTimeSlot(
        bookingStart,
        Number(application.durationHours ?? 0)
      );

      if (!groupedByVenue.has(venueId)) {
        groupedByVenue.set(venueId, {
          venueName: safeText(application.venue?.name, "Unknown venue"),
          bookingCount: 0,
          dayCounts: new Map<string, number>(),
          slotCounts: new Map<string, number>(),
        });
      }

      const venueStats = groupedByVenue.get(venueId)!;

      venueStats.bookingCount += 1;
      venueStats.dayCounts.set(
        weekday,
        (venueStats.dayCounts.get(weekday) ?? 0) + 1
      );
      venueStats.slotCounts.set(
        slot,
        (venueStats.slotCounts.get(slot) ?? 0) + 1
      );
    }

    const reports = Array.from(groupedByVenue.entries()).map(
      ([venueId, stats]) => {
        const mostPopularDay =
          Array.from(stats.dayCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
          "N/A";

        const mostPopularTimeSlot =
          Array.from(stats.slotCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
          "N/A";

        return {
          venueId,
          venueName: stats.venueName || "Unknown venue",
          bookingCount: stats.bookingCount,
          mostPopularDay,
          mostPopularTimeSlot,
        };
      }
    );

    return reports
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 3);
  },

  topActiveApplicants: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);

    const hirers = await hirerRepository().find({
      relations: { applications: true },
      order: { name: "ASC" },
    });

    const reports = hirers
      .map((hirer) => {
        const applications = hirer.applications ?? [];
        const totalApplications = applications.length;

        const successfulBookings = applications.filter((application) =>
          getSuccessfulStatus(application.status)
        ).length;

        const successRate =
          totalApplications === 0
            ? 0
            : Number(
                ((successfulBookings / totalApplications) * 100).toFixed(2)
              );

        return {
          hirerId: hirer.id,
          hirerName: safeText(hirer.name, "Unnamed hirer"),
          totalApplications,
          successfulBookings,
          successRate,
        };
      })
      .filter((hirer) => hirer.totalApplications > 0)
      .sort((a, b) => {
        if (b.successfulBookings !== a.successfulBookings) {
          return b.successfulBookings - a.successfulBookings;
        }

        return b.totalApplications - a.totalApplications;
      })
      .slice(0, 3);

    return reports;
  },
};