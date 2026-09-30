import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Vendor } from "../entity/vendorEntity";
import { Venue } from "../entity/venueEntity";
import { Application } from "../entity/applicationEntity";

const vendorRepository = AppDataSource.getRepository(Vendor);
const venueRepository = AppDataSource.getRepository(Venue);

function mapVendor(vendor: Vendor) {
  return {
    id: vendor.id,
    name: vendor.name,
    email: vendor.email,
    venue: vendor.venue,
  };
}

function mapVendorVenue(venue: Venue) {
  return {
    venueId: venue.id,
    venueName: venue.name,
    type: venue.type,
    location: venue.location,
    capacity: venue.capacity,
    blockedDateFrom: venue.blockedDateFrom,
    blockedDateTo: venue.blockedDateTo,
    recommendedSuitability: venue.recommendedSuitability,
    isFeatured: venue.isFeatured,
  };
}

export const getAllVendors = async (_req: Request, res: Response) => {
  try {
    const vendors = await vendorRepository.find({
      order: { name: "ASC" },
    });

    return res.json(vendors.map(mapVendor));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch vendors.",
      error,
    });
  }
};

const applicationRepository = AppDataSource.getRepository(Application);

export const getVendorAnalytics = async (req: Request, res: Response) => {
  try {
    const vendorId = Number(req.params.vendorId);
    const timeRange = String(req.query.timeRange || "all");

    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor id." });
    }

    const now = new Date();
    let startDate: Date | null = null;

    if (timeRange === "week") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    }

    if (timeRange === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (timeRange === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    const allBookings = await applicationRepository.find({
      relations: {
        venue: {
          vendor: true,
        },
        hirer: true,
      },
      order: {
        bookingStart: "ASC",
      },
    });

    let vendorBookings = allBookings.filter(
      (booking) => booking.venue.vendor?.id === vendorId
    );

    if (startDate) {
      vendorBookings = vendorBookings.filter(
        (booking) => new Date(booking.bookingStart) >= startDate
      );
    }

    if (timeRange === "lastMonth") {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      vendorBookings = vendorBookings.filter((booking) => {
        const bookingDate = new Date(booking.bookingStart);
        return bookingDate >= lastMonthStart && bookingDate < thisMonthStart;
      });
    }

    const venueHirerMap = new Map<string, any>();

    vendorBookings.forEach((booking) => {
      const key = `${booking.venue.name}-${booking.hirer.name}`;

      if (!venueHirerMap.has(key)) {
        venueHirerMap.set(key, {
          venueName: booking.venue.name,
          hirerName: booking.hirer.name,
          tally: 0,
        });
      }

      venueHirerMap.get(key).tally += 1;
    });

    const venueHirerTallies = Array.from(venueHirerMap.values());

    const combinedMap = new Map<string, any>();

    vendorBookings.forEach((booking) => {
      const hirerName = booking.hirer.name;

      if (!combinedMap.has(hirerName)) {
        combinedMap.set(hirerName, {
          hirerName,
          tally: 0,
        });
      }

      combinedMap.get(hirerName).tally += 1;
    });

    const combinedHirerTallies = Array.from(combinedMap.values());

    const sortedHirers = [...combinedHirerTallies].sort(
      (a, b) => b.tally - a.tally
    );

    const mostActiveHirer = sortedHirers[0] || null;
    const leastActiveHirer = sortedHirers[sortedHirers.length - 1] || null;

    const utilisationMap = new Map<string, number>();

    vendorBookings.forEach((booking) => {
      const date = new Date(booking.bookingStart).toISOString().split("T")[0];

      utilisationMap.set(date, (utilisationMap.get(date) || 0) + 1);
    });

    const utilisationOverTime = Array.from(utilisationMap.entries()).map(
      ([date, bookings]) => ({
        date,
        bookings,
      })
    );

    return res.json({
      venueHirerTallies,
      combinedHirerTallies,
      mostActiveHirer,
      leastActiveHirer,
      utilisationOverTime,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load vendor analytics.",
      error,
    });
  }
};

export const getVendorByName = async (req: Request, res: Response) => {
  try {
    const nameQuery = String(req.query.name ?? "").trim();

    if (!nameQuery) {
      return res.status(400).json({
        message: "Please provide a vendor name to search.",
      });
    }

    const vendors = await vendorRepository
      .createQueryBuilder("vendor")
      .where("LOWER(vendor.name) LIKE LOWER(:name)", {
        name: `%${nameQuery}%`,
      })
      .orderBy("vendor.name", "ASC")
      .getMany();

    return res.json(vendors.map(mapVendor));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to search vendors.",
      error,
    });
  }
};

export const getVendorVenues = async (req: Request, res: Response) => {
  try {
    const vendorId = Number(req.params.vendorId);

    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor id." });
    }

    const venues = await venueRepository.find({
      where: {
        vendor: {
          id: vendorId,
        },
      },
      relations: ["vendor"],
      order: { name: "ASC" },
    });

    return res.json(venues.map(mapVendorVenue));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch vendor venues.",
      error,
    });
  }
};
