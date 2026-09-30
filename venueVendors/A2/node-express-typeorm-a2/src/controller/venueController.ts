import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Venue } from "../entity/venueEntity";
import { Vendor } from "../entity/vendorEntity";
import { Application } from "../entity/applicationEntity";

const venueRepository = AppDataSource.getRepository(Venue);
const vendorRepository = AppDataSource.getRepository(Vendor);
const applicationRepository = AppDataSource.getRepository(Application);

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

export const createVenue = async (req: Request, res: Response) => {
  try {
    const vendorId = Number(req.params.vendorId);
    const { name, type, location, capacity, recommendedSuitability } = req.body;

    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor id." });
    }

    const vendor = await vendorRepository.findOneBy({ id: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    const venue = venueRepository.create({
      name,
      type,
      location,
      capacity,
      recommendedSuitability,
      vendor,
    });

    const savedVenue = await venueRepository.save(venue);

    return res.status(201).json(mapVendorVenue(savedVenue));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create venue.",
      error,
    });
  }
};

export const updateVenue = async (req: Request, res: Response) => {
  try {
    const venueId = Number(req.params.venueId);
    const {
      name,
      type,
      location,
      capacity,
      recommendedSuitability,
    } = req.body;

    const venue = await venueRepository.findOneBy({ id: venueId });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }

    venue.name = name;
    venue.type = type;
    venue.location = location;
    venue.capacity = capacity;
    venue.recommendedSuitability = recommendedSuitability;

    const savedVenue = await venueRepository.save(venue);

    return res.json(mapVendorVenue(savedVenue));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update venue.",
      error,
    });
  }
};

export const getVenueBookings = async (req: Request, res: Response) => {
  try {
    const venueId = Number(req.params.venueId);

    if (Number.isNaN(venueId)) {
      return res.status(400).json({ message: "Invalid venue id." });
    }

    const bookings = await applicationRepository.find({
      where: {
        venue: {
          id: venueId,
        },
      },
      relations: {
        venue: true,
        hirer: true,
      },
      order: {
        bookingStart: "ASC",
      },
    });

    const mappedBookings = bookings.map((booking) => ({
      id: booking.id,
      eventName: booking.eventName,
      expectedGuests: booking.expectedGuests,
      bookingStart: booking.bookingStart,
      bookingEnd: booking.bookingEnd,
      durationHours: booking.durationHours,
      status: booking.status,
      vendorComments: booking.vendorComments,
      vendorRating: booking.vendorRating,

      hirerId: booking.hirer.id,
      hirerName: booking.hirer.name,
      hirerEmail: booking.hirer.email,

      venueId: booking.venue.id,
      venueName: booking.venue.name,
    }));

    return res.json(mappedBookings);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load venue bookings.",
      error,
    });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const venueId = Number(req.params.venueId);
    const bookingId = Number(req.params.bookingId);
    const { status } = req.body;

    if (Number.isNaN(venueId) || Number.isNaN(bookingId)) {
      return res.status(400).json({ message: "Invalid venue or booking id." });
    }

    if (status !== "Approved" && status !== "Rejected") {
      return res.status(400).json({ message: "Invalid booking status." });
    }

    const booking = await applicationRepository.findOne({
      where: {
        id: bookingId,
        venue: {
          id: venueId,
        },
      },
      relations: {
        venue: true,
        hirer: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    booking.status = status;

    const savedBooking = await applicationRepository.save(booking);

    return res.json(savedBooking);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update booking status.",
      error,
    });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const venueId = Number(req.params.venueId);
    const bookingId = Number(req.params.bookingId);

    const booking = await applicationRepository.findOne({
      where: {
        id: bookingId,
        venue: {
          id: venueId,
        },
      },
      relations: {
        venue: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    await applicationRepository.remove(booking);

    return res.json({
      message: "Booking removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to remove booking.",
      error,
    });
  }
};

export const deleteVenue = async (req: Request, res: Response) => {
  try {
    const venueId = Number(req.params.venueId);

    if (Number.isNaN(venueId)) {
      return res.status(400).json({ message: "Invalid venue id." });
    }

    const venue = await venueRepository.findOne({
      where: { id: venueId },
      relations: { applications: true },
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }

    if (venue.applications.length > 0) {
      return res.status(400).json({
        message: "Cannot delete a venue that already has booking applications.",
      });
    }

    await venueRepository.remove(venue);

    return res.json({
      message: "Venue deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete venue.",
      error,
    });
  }
};

export const blockVenueDates = async (req: Request, res: Response) => {
  try {
    const venueId = Number(req.params.venueId);
    const { blockedDateFrom, blockedDateTo } = req.body as {
      blockedDateFrom?: string;
      blockedDateTo?: string;
    };

    if (Number.isNaN(venueId)) {
      return res.status(400).json({ message: "Invalid venue id." });
    }

    if (!blockedDateFrom || !blockedDateTo) {
      return res.status(400).json({
        message: "Please provide both blocked start and end dates.",
      });
    }

    const startDate = new Date(blockedDateFrom);
    const endDate = new Date(blockedDateTo);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        message: "Please provide valid blocked date values.",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        message: "Blocked start date cannot be after the end date.",
      });
    }

    const venue = await venueRepository.findOneBy({ id: venueId });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }

    venue.blockedDateFrom = startDate;
    venue.blockedDateTo = endDate;

    const savedVenue = await venueRepository.save(venue);

    return res.json(mapVendorVenue(savedVenue));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to block venue dates.",
      error,
    });
  }
};
