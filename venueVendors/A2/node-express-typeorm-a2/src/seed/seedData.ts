import argon2 from "argon2";
import { AppDataSource } from "../data-source";
import { Hirer } from "../entity/hirerEntity";
import { Vendor } from "../entity/vendorEntity";
import { Venue } from "../entity/venueEntity";
import { Application } from "../entity/applicationEntity";
import { VenuePreference } from "../entity/venuePreferenceEntity";

const vendorSeeds = [
  {
    name: "Luca Bennett",
    email: "luca.vendor@venuevendors.com",
    password: "Vendor@123",
    venue: "Riverside Loft",
  },
  {
    name: "Chloe Adams",
    email: "chloe.vendor@venuevendors.com",
    password: "Venue@456",
    venue: "Garden Pavilion",
  },
  {
    name: "Ethan Ali",
    email: "ethan.vendor@venuevendors.com",
    password: "Booking@789",
    venue: "Studio 9 Events",
  },
];

const hirerSeeds = [
  {
    name: "Mia Carter",
    email: "mia.hirer@venuevendors.com",
    password: "Hirer@123",
    phone: "0412000001",
    comments: "Good applicant, very reliable and trustworthy.",
    rating: 5,
    requirements: "large capacity",
    approvalCount: 0,
  },
  {
    name: "Noah Singh",
    email: "noah.hirer@venuevendors.com",
    password: "Secure@456",
    phone: "0412000002",
    comments: "Very reliable, honest, and great communication.",
    rating: 3,
    requirements: "large capacity",
    approvalCount: 5,
  },
  {
    name: "Bryan Hoover",
    email: "bryan.hirer@venuevendors.com",
    password: "Event@789",
    phone: "0412000003",
    comments: "Somewhat reliable, good applicant.",
    rating: 4,
    requirements: "large capacity",
    approvalCount: 7,
  },
  {
    name: "John Nguyen",
    email: "john.hirer@venuevendors.com",
    password: "Event@789",
    phone: "0412000004",
    comments: "Unreliable and left the place messy.",
    rating: 3,
    requirements: "space for lots of tables",
    approvalCount: 8,
  },
];

const venueSeeds = [
  {
    name: "Riverside Loft",
    type: "Corporate",
    location: "Southbank",
    capacity: 120,
    recommendedSuitability:
      "Corporate, Networking, Workshop, Dinner, Tennis",
    vendorEmail: "luca.vendor@venuevendors.com",
  },
  {
    name: "Garden Pavilion",
    type: "Wedding",
    location: "Richmond",
    capacity: 180,
    recommendedSuitability:
      "Wedding, Birthday, Engagement, Dinner, Classical Music",
    vendorEmail: "chloe.vendor@venuevendors.com",
  },
  {
    name: "Studio 9 Events",
    type: "Launch",
    location: "Docklands",
    capacity: 90,
    recommendedSuitability:
      "Rock Concert, Launch, Corporate, Workshop",
    vendorEmail: "ethan.vendor@venuevendors.com",
  },
  {
    name: "Oak Hall",
    type: "Conference",
    location: "Carlton",
    capacity: 250,
    recommendedSuitability:
      "Wedding, Formal, Conference, Dinner, Classical Music",
    vendorEmail: "luca.vendor@venuevendors.com",
  },
  {
    name: "Skyline Terrace",
    type: "Cocktail",
    location: "Melbourne CBD",
    capacity: 140,
    recommendedSuitability:
      "Networking, Cocktail, Corporate, Dinner, Rock Concert",
    vendorEmail: "chloe.vendor@venuevendors.com",
  },
  {
    name: "Harbour Function Room",
    type: "Community",
    location: "Port Melbourne",
    capacity: 200,
    recommendedSuitability:
      "Birthday, Wedding, Community, Dinner",
    vendorEmail: "ethan.vendor@venuevendors.com",
  },
];

const preferenceSeeds = [
  {
    hirerEmail: "mia.hirer@venuevendors.com",
    venueName: "Oak Hall",
    preferenceRank: 1,
  },
  {
    hirerEmail: "mia.hirer@venuevendors.com",
    venueName: "Skyline Terrace",
    preferenceRank: 2,
  },
  {
    hirerEmail: "mia.hirer@venuevendors.com",
    venueName: "Garden Pavilion",
    preferenceRank: 3,
  },
  {
    hirerEmail: "noah.hirer@venuevendors.com",
    venueName: "Studio 9 Events",
    preferenceRank: 1,
  },
  {
    hirerEmail: "noah.hirer@venuevendors.com",
    venueName: "Riverside Loft",
    preferenceRank: 2,
  },
];

const applicationSeeds = [
  {
    hirerEmail: "mia.hirer@venuevendors.com",
    venueName: "Oak Hall",
    eventName: "Winter Gala Dinner",
    expectedGuests: 220,
    bookingStart: "2025-07-14T18:00:00",
    bookingEnd: "2025-07-14T23:00:00",
    durationHours: 5,
    status: "Approved",
    vendorComments: "Well organised and easy to work with.",
    vendorRating: 5,
  },
  {
    hirerEmail: "mia.hirer@venuevendors.com",
    venueName: "Skyline Terrace",
    eventName: "Startup Networking Night",
    expectedGuests: 110,
    bookingStart: "2025-10-22T18:30:00",
    bookingEnd: "2025-10-22T22:30:00",
    durationHours: 4,
    status: "Approved",
    vendorComments: "Smooth booking process and respectful guests.",
    vendorRating: 4,
  },
  {
    hirerEmail: "mia.hirer@venuevendors.com",
    venueName: "Garden Pavilion",
    eventName: "Family Engagement Party",
    expectedGuests: 140,
    bookingStart: "2026-01-18T15:00:00",
    bookingEnd: "2026-01-18T21:00:00",
    durationHours: 6,
    status: "Approved",
    vendorComments: "Good communication from start to finish.",
    vendorRating: 4,
  },
  {
    hirerEmail: "noah.hirer@venuevendors.com",
    venueName: "Studio 9 Events",
    eventName: "Team Planning Workshop",
    expectedGuests: 70,
    bookingStart: "2025-11-05T09:00:00",
    bookingEnd: "2025-11-05T16:00:00",
    durationHours: 7,
    status: "Approved",
    vendorComments: "Professional event team.",
    vendorRating: 4,
  },
  {
    hirerEmail: "noah.hirer@venuevendors.com",
    venueName: "Riverside Loft",
    eventName: "Client Meetup",
    expectedGuests: 80,
    bookingStart: "2026-02-09T17:30:00",
    bookingEnd: "2026-02-09T21:30:00",
    durationHours: 4,
    status: "Approved",
    vendorComments: "Reliable hirer and left the venue in great condition.",
    vendorRating: 5,
  },
];

function isArgonHash(value: string) {
  return value.startsWith("$argon2");
}

export async function seedInitialData() {
  const vendorRepository = AppDataSource.getRepository(Vendor);
  const hirerRepository = AppDataSource.getRepository(Hirer);
  const venueRepository = AppDataSource.getRepository(Venue);
  const preferenceRepository = AppDataSource.getRepository(VenuePreference);
  const applicationRepository = AppDataSource.getRepository(Application);

  for (const vendorSeed of vendorSeeds) {
    const existingVendor = await vendorRepository.findOneBy({
      email: vendorSeed.email,
    });

    const hashedPassword = await argon2.hash(vendorSeed.password);

    if (!existingVendor) {
      const vendor = vendorRepository.create({
        name: vendorSeed.name,
        email: vendorSeed.email,
        password: hashedPassword,
        venue: vendorSeed.venue,
      });

      await vendorRepository.save(vendor);
    } else {
      let shouldSave = false;

      if (existingVendor.name !== vendorSeed.name) {
        existingVendor.name = vendorSeed.name;
        shouldSave = true;
      }

      if (existingVendor.venue !== vendorSeed.venue) {
        existingVendor.venue = vendorSeed.venue;
        shouldSave = true;
      }

      // Repair any old plaintext vendor password rows so shared login keeps working.
      if (!isArgonHash(existingVendor.password)) {
        existingVendor.password = hashedPassword;
        shouldSave = true;
      }

      if (shouldSave) {
        await vendorRepository.save(existingVendor);
      }
    }
  }

  for (const hirerSeed of hirerSeeds) {
    const existingHirer = await hirerRepository.findOneBy({
      email: hirerSeed.email,
    });

    const hashedPassword = await argon2.hash(hirerSeed.password);

    if (!existingHirer) {
      const hirer = hirerRepository.create({
        name: hirerSeed.name,
        email: hirerSeed.email,
        password: hashedPassword,
        phone: hirerSeed.phone,
        comments: hirerSeed.comments,
        rating: hirerSeed.rating,
        requirements: hirerSeed.requirements,
        approvalCount: hirerSeed.approvalCount,
      });

      await hirerRepository.save(hirer);
    } else {
      let shouldSave = false;

      if (existingHirer.name !== hirerSeed.name) {
        existingHirer.name = hirerSeed.name;
        shouldSave = true;
      }

      if (existingHirer.phone !== hirerSeed.phone) {
        existingHirer.phone = hirerSeed.phone;
        shouldSave = true;
      }

      if (existingHirer.comments !== hirerSeed.comments) {
        existingHirer.comments = hirerSeed.comments;
        shouldSave = true;
      }

      if (existingHirer.rating !== hirerSeed.rating) {
        existingHirer.rating = hirerSeed.rating;
        shouldSave = true;
      }

      if (existingHirer.requirements !== hirerSeed.requirements) {
        existingHirer.requirements = hirerSeed.requirements;
        shouldSave = true;
      }

      if (existingHirer.approvalCount !== hirerSeed.approvalCount) {
        existingHirer.approvalCount = hirerSeed.approvalCount;
        shouldSave = true;
      }

      if (!isArgonHash(existingHirer.password)) {
        existingHirer.password = hashedPassword;
        shouldSave = true;
      }

      if (shouldSave) {
        await hirerRepository.save(existingHirer);
      }
    }
  }

  for (const venueSeed of venueSeeds) {
    const existingVenue = await venueRepository.findOne({
      where: { name: venueSeed.name },
      relations: ["vendor"],
    });

    const vendor = await vendorRepository.findOneBy({
      email: venueSeed.vendorEmail,
    });

    if (!vendor) continue;

    if (!existingVenue) {
      const venue = venueRepository.create({
        name: venueSeed.name,
        type: venueSeed.type,
        location: venueSeed.location,
        capacity: venueSeed.capacity,
        recommendedSuitability: venueSeed.recommendedSuitability,
        vendor,
      });

      await venueRepository.save(venue);
    } else {
      let shouldSave = false;

      if (existingVenue.type !== venueSeed.type) {
        existingVenue.type = venueSeed.type;
        shouldSave = true;
      }

      if (existingVenue.location !== venueSeed.location) {
        existingVenue.location = venueSeed.location;
        shouldSave = true;
      }

      if (existingVenue.capacity !== venueSeed.capacity) {
        existingVenue.capacity = venueSeed.capacity;
        shouldSave = true;
      }

      if (
        existingVenue.recommendedSuitability !==
        venueSeed.recommendedSuitability
      ) {
        existingVenue.recommendedSuitability = venueSeed.recommendedSuitability;
        shouldSave = true;
      }

      if (existingVenue.vendor?.id !== vendor.id) {
        existingVenue.vendor = vendor;
        shouldSave = true;
      }

      if (shouldSave) {
        await venueRepository.save(existingVenue);
      }
    }
  }

  for (const preferenceSeed of preferenceSeeds) {
    const hirer = await hirerRepository.findOneBy({
      email: preferenceSeed.hirerEmail,
    });

    const venue = await venueRepository.findOneBy({
      name: preferenceSeed.venueName,
    });

    if (!hirer || !venue) continue;

    const existingPreference = await preferenceRepository
      .createQueryBuilder("preference")
      .leftJoinAndSelect("preference.hirer", "hirer")
      .leftJoinAndSelect("preference.venue", "venue")
      .where("hirer.id = :hirerId", { hirerId: hirer.id })
      .andWhere("venue.id = :venueId", { venueId: venue.id })
      .getOne();

    if (!existingPreference) {
      const preference = preferenceRepository.create({
        hirer,
        venue,
        preferenceRank: preferenceSeed.preferenceRank,
      });

      await preferenceRepository.save(preference);
    } else if (existingPreference.preferenceRank !== preferenceSeed.preferenceRank) {
      existingPreference.preferenceRank = preferenceSeed.preferenceRank;
      await preferenceRepository.save(existingPreference);
    }
  }

  for (const applicationSeed of applicationSeeds) {
    const hirer = await hirerRepository.findOneBy({
      email: applicationSeed.hirerEmail,
    });

    const venue = await venueRepository.findOneBy({
      name: applicationSeed.venueName,
    });

    if (!hirer || !venue) continue;

    const existingApplication = await applicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.hirer", "hirer")
      .leftJoinAndSelect("application.venue", "venue")
      .where("hirer.id = :hirerId", { hirerId: hirer.id })
      .andWhere("venue.id = :venueId", { venueId: venue.id })
      .andWhere("application.eventName = :eventName", {
        eventName: applicationSeed.eventName,
      })
      .getOne();

    if (!existingApplication) {
      const application = applicationRepository.create({
        hirer,
        venue,
        eventName: applicationSeed.eventName,
        expectedGuests: applicationSeed.expectedGuests,
        bookingStart: new Date(applicationSeed.bookingStart),
        bookingEnd: new Date(applicationSeed.bookingEnd),
        durationHours: applicationSeed.durationHours,
        status: applicationSeed.status,
        vendorComments: applicationSeed.vendorComments,
        vendorRating: applicationSeed.vendorRating,
      });

      await applicationRepository.save(application);
    }
  }
}