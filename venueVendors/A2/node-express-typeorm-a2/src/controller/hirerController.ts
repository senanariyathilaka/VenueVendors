import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Hirer } from "../entity/hirerEntity";
import { Venue } from "../entity/venueEntity";
import { VenuePreference } from "../entity/venuePreferenceEntity";
import { Application } from "../entity/applicationEntity";

const NAME_REGEX = /^[A-Za-z\s'-]{2,}$/;
const PHONE_REGEX = /^[\d\s()+-]{8,20}$/;

function mapHirerProfile(hirer: Hirer) {
  return {
    id: hirer.id,
    name: hirer.name,
    email: hirer.email,
    phone: hirer.phone,
    role: "hirer",
    comments: hirer.comments,
    rating: hirer.rating,
    requirements: hirer.requirements,
    approvalCount: hirer.approvalCount,
    dateJoined: hirer.dateJoined,
  };
}

function mapVenue(venue: Venue) {
  return {
    id: venue.id,
    name: venue.name,
    type: venue.type,
    location: venue.location,
    capacity: venue.capacity,
    recommendedSuitability: venue.recommendedSuitability,
    blockedDateFrom: venue.blockedDateFrom,
    blockedDateTo: venue.blockedDateTo,
    isFeatured: venue.isFeatured,
    managedBy: venue.vendor?.name ?? "Unknown vendor",
  };
}

function normaliseBlockedDateRange(venue: Venue) {
  if (!venue.blockedDateFrom || !venue.blockedDateTo) {
    return null;
  }

  const blockedStart = new Date(venue.blockedDateFrom);
  blockedStart.setHours(0, 0, 0, 0);

  const blockedEnd = new Date(venue.blockedDateTo);
  blockedEnd.setHours(23, 59, 59, 999);

  return { blockedStart, blockedEnd };
}

function bookingOverlapsBlockedPeriod(
  venue: Venue,
  bookingStart: Date,
  bookingEnd: Date
) {
  const range = normaliseBlockedDateRange(venue);

  if (!range) {
    return false;
  }

  return bookingStart <= range.blockedEnd && bookingEnd >= range.blockedStart;
}

export const getHirerProfile = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    const hirerRepository = AppDataSource.getRepository(Hirer);
    const hirer = await hirerRepository.findOneBy({ id: hirerId });

    if (!hirer) {
      return res.status(404).json({ message: "Hirer not found." });
    }

    return res.json(mapHirerProfile(hirer));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch hirer profile.",
      error,
    });
  }
};

export const updateHirerProfile = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);
    const { name, phone } = req.body as {
      name?: string;
      phone?: string;
    };

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!NAME_REGEX.test(name.trim())) {
      return res.status(400).json({ message: "Enter a valid name." });
    }

    if (phone?.trim() && !PHONE_REGEX.test(phone.trim())) {
      return res.status(400).json({ message: "Enter a valid phone number." });
    }

    const hirerRepository = AppDataSource.getRepository(Hirer);
    const hirer = await hirerRepository.findOneBy({ id: hirerId });

    if (!hirer) {
      return res.status(404).json({ message: "Hirer not found." });
    }

    hirer.name = name.trim();
    hirer.phone = phone?.trim() ?? "";

    const savedHirer = await hirerRepository.save(hirer);

    return res.json({
      message: "Profile updated successfully.",
      profile: mapHirerProfile(savedHirer),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update hirer profile.",
      error,
    });
  }
};

export const getVenues = async (req: Request, res: Response) => {
  try {
    const nameQuery = String(req.query.name ?? "").trim().toLowerCase();
    const locationQuery = String(req.query.location ?? "").trim().toLowerCase();
    const suitabilityQuery = String(req.query.suitability ?? "")
      .trim()
      .toLowerCase();
    const capacityQuery = Number(req.query.capacity ?? 0);

    const venueRepository = AppDataSource.getRepository(Venue);
    const venues = await venueRepository.find({
      relations: ["vendor"],
      order: { name: "ASC" },
    });

    const filteredVenues = venues.filter((venue) => {
      const matchesName = !nameQuery
        ? true
        : venue.name.toLowerCase().includes(nameQuery);

      const matchesLocation = !locationQuery
        ? true
        : venue.location.toLowerCase().includes(locationQuery);

      const matchesSuitability = !suitabilityQuery
        ? true
        : venue.recommendedSuitability
            .toLowerCase()
            .includes(suitabilityQuery);

      const matchesCapacity =
        !capacityQuery || Number.isNaN(capacityQuery)
          ? true
          : venue.capacity >= capacityQuery;

      return (
        matchesName &&
        matchesLocation &&
        matchesSuitability &&
        matchesCapacity
      );
    });

    return res.json(filteredVenues.map((venue) => mapVenue(venue)));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch venues.",
      error,
    });
  }
};

export const getHirerPreferences = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    const preferenceRepository = AppDataSource.getRepository(VenuePreference);
    const preferences = await preferenceRepository.find({
      where: {
        hirer: {
          id: hirerId,
        },
      },
      relations: ["venue", "venue.vendor"],
      order: { preferenceRank: "ASC" },
    });

    return res.json(
      preferences.map((preference) => ({
        id: preference.id,
        venueId: preference.venue.id,
        venueName: preference.venue.name,
        location: preference.venue.location,
        preferenceRank: preference.preferenceRank,
      }))
    );
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch preferred venues.",
      error,
    });
  }
};

export const saveHirerPreferences = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);
    const { venueIds } = req.body as { venueIds?: number[] };

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    if (!Array.isArray(venueIds)) {
      return res
        .status(400)
        .json({ message: "Venue preference list must be an array." });
    }

    const uniqueVenueIds = [...new Set(venueIds)];

    const hirerRepository = AppDataSource.getRepository(Hirer);
    const venueRepository = AppDataSource.getRepository(Venue);
    const preferenceRepository = AppDataSource.getRepository(VenuePreference);

    const hirer = await hirerRepository.findOneBy({ id: hirerId });

    if (!hirer) {
      return res.status(404).json({ message: "Hirer not found." });
    }

    const existingPreferences = await preferenceRepository.find({
      where: {
        hirer: {
          id: hirerId,
        },
      },
      relations: ["hirer"],
    });

    if (existingPreferences.length > 0) {
      await preferenceRepository.remove(existingPreferences);
    }

    const savedPreferences = [];

    for (let index = 0; index < uniqueVenueIds.length; index += 1) {
      const venue = await venueRepository.findOneBy({ id: uniqueVenueIds[index] });

      if (!venue) continue;

      const preference = preferenceRepository.create({
        hirer,
        venue,
        preferenceRank: index + 1,
      });

      savedPreferences.push(await preferenceRepository.save(preference));
    }

    return res.json({
      message: "Preferred venues updated successfully.",
      preferences: savedPreferences.map((preference) => ({
        id: preference.id,
        venueId: preference.venue.id,
        preferenceRank: preference.preferenceRank,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to save preferred venues.",
      error,
    });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);
    const {
      venueId,
      eventName,
      expectedGuests,
      eventDate,
      eventTime,
      durationHours,
    } = req.body as {
      venueId?: number;
      eventName?: string;
      expectedGuests?: number | string;
      eventDate?: string;
      eventTime?: string;
      durationHours?: number | string;
    };

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    if (!venueId) {
      return res.status(400).json({ message: "Please select a venue." });
    }

    if (!eventName?.trim()) {
      return res.status(400).json({ message: "Please enter an event name." });
    }

    const guestCount = Number(expectedGuests);
    if (!guestCount || guestCount <= 0) {
      return res
        .status(400)
        .json({ message: "Please enter the expected number of guests." });
    }

    if (!eventDate) {
      return res.status(400).json({ message: "Please select a date." });
    }

    if (!eventTime) {
      return res.status(400).json({ message: "Please select a time." });
    }

    const durationValue = Number(durationHours);
    if (!durationValue || durationValue <= 0) {
      return res.status(400).json({ message: "Please enter the duration." });
    }

    const hirerRepository = AppDataSource.getRepository(Hirer);
    const venueRepository = AppDataSource.getRepository(Venue);
    const applicationRepository = AppDataSource.getRepository(Application);

    const hirer = await hirerRepository.findOneBy({ id: hirerId });
    const venue = await venueRepository.findOne({
      where: { id: Number(venueId) },
      relations: ["vendor"],
    });

    if (!hirer) {
      return res.status(404).json({ message: "Hirer not found." });
    }

    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }

    if (guestCount > venue.capacity) {
      return res.status(400).json({
        message: `Guest count exceeds the venue capacity of ${venue.capacity}.`,
      });
    }

    const bookingStart = new Date(`${eventDate}T${eventTime}:00`);
    const bookingEnd = new Date(
      bookingStart.getTime() + durationValue * 60 * 60 * 1000
    );

    if (bookingOverlapsBlockedPeriod(venue, bookingStart, bookingEnd)) {
      return res.status(400).json({
        message:
          "This venue is blocked by the vendor during the selected date range. Please choose another date or venue.",
      });
    }

    const application = applicationRepository.create({
      hirer,
      venue,
      eventName: eventName.trim(),
      expectedGuests: guestCount,
      bookingStart,
      bookingEnd,
      durationHours: durationValue,
      status: "Pending",
      vendorComments: null,
      vendorRating: null,
    });

    const savedApplication = await applicationRepository.save(application);

    return res.status(201).json({
      message: "Application submitted successfully.",
      application: {
        id: savedApplication.id,
        venueName: venue.name,
        location: venue.location,
        eventName: savedApplication.eventName,
        expectedGuests: savedApplication.expectedGuests,
        eventDate,
        eventTime,
        durationHours: savedApplication.durationHours,
        status: savedApplication.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to submit application.",
      error,
    });
  }
};

export const getHirerApplications = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    const applicationRepository = AppDataSource.getRepository(Application);
    const applications = await applicationRepository.find({
      where: {
        hirer: {
          id: hirerId,
        },
      },
      relations: ["venue"],
      order: { createdAt: "DESC" },
    });

    return res.json(
      applications.map((application) => ({
        id: application.id,
        venueId: application.venue.id,
        venueName: application.venue.name,
        location: application.venue.location,
        eventName: application.eventName,
        expectedGuests: application.expectedGuests,
        eventDate: application.bookingStart.toISOString().split("T")[0],
        eventTime: application.bookingStart.toTimeString().slice(0, 5),
        durationHours: application.durationHours,
        status: application.status,
      }))
    );
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch applications.",
      error,
    });
  }
};

export const getHirerHistory = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    const applicationRepository = AppDataSource.getRepository(Application);
    const historyItems = await applicationRepository.find({
      where: {
        hirer: {
          id: hirerId,
        },
      },
      relations: ["venue"],
      order: { bookingStart: "DESC" },
    });

    const ratedHistory = historyItems.filter(
      (item) => item.vendorRating !== null && item.vendorRating !== undefined
    );

    return res.json(
      ratedHistory.map((item) => ({
        id: item.id,
        venueName: item.venue.name,
        location: item.venue.location,
        eventName: item.eventName,
        hireDate: item.bookingStart.toISOString().split("T")[0],
        rating: item.vendorRating,
      }))
    );
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch hiring history.",
      error,
    });
  }
};

function mapVendorFacingHirer(hirer: Hirer) {
  return {
    id: hirer.id,
    name: hirer.name,
    email: hirer.email,
    comments: hirer.comments ?? "",
    rating: hirer.rating ?? 0,
    approvalCount: hirer.approvalCount ?? 0,
    requirements: hirer.requirements ?? "",
  };
}

export const getAllHirers = async (_req: Request, res: Response) => {
  try {
    const hirerRepository = AppDataSource.getRepository(Hirer);
    const hirers = await hirerRepository.find({
      order: { name: "ASC" },
    });

    return res.json(hirers.map(mapVendorFacingHirer));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch hirers.",
      error,
    });
  }
};

export const approveHirer = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    const hirerRepository = AppDataSource.getRepository(Hirer);
    const hirer = await hirerRepository.findOneBy({ id: hirerId });

    if (!hirer) {
      return res.status(404).json({ message: "Hirer not found." });
    }

    hirer.approvalCount += 1;
    const savedHirer = await hirerRepository.save(hirer);

    return res.json({
      message: "Hirer approved successfully.",
      hirer: mapVendorFacingHirer(savedHirer),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to approve hirer.",
      error,
    });
  }
};

export const addVendorComment = async (req: Request, res: Response) => {
  try {
    const hirerId = Number(req.params.id);
    const { comment } = req.body as { comment?: string };

    if (Number.isNaN(hirerId)) {
      return res.status(400).json({ message: "Invalid hirer id." });
    }

    if (!comment?.trim()) {
      return res.status(400).json({ message: "Please enter a comment." });
    }

    const hirerRepository = AppDataSource.getRepository(Hirer);
    const hirer = await hirerRepository.findOneBy({ id: hirerId });

    if (!hirer) {
      return res.status(404).json({ message: "Hirer not found." });
    }

    hirer.comments = hirer.comments?.trim()
      ? `${hirer.comments} | ${comment.trim()}`
      : comment.trim();

    const savedHirer = await hirerRepository.save(hirer);

    return res.json({
      message: "Comment saved successfully.",
      hirer: mapVendorFacingHirer(savedHirer),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to save comment.",
      error,
    });
  }
};
