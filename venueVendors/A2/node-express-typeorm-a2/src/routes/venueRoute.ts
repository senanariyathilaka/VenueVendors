import { Router } from "express";
import {
  blockVenueDates, createVenue, updateVenue, getVenueBookings, deleteVenue, updateBookingStatus, deleteBooking,
 } from "../controller/venueController";

const venueRoute = Router();

venueRoute.post("/vendors/:vendorId/venues", createVenue);

venueRoute.put("/venues/:venueId/block", blockVenueDates);

venueRoute.put("/venues/:venueId", updateVenue);

venueRoute.delete("/venues/:venueId", deleteVenue);

venueRoute.get("/venues/:venueId/bookings", getVenueBookings);

venueRoute.put(
  "/venues/:venueId/bookings/:bookingId/status",
  updateBookingStatus
);

venueRoute.delete(
  "/venues/:venueId/bookings/:bookingId",
  deleteBooking
);


venueRoute.put("/venues/:venueId/blocked-dates", blockVenueDates);

export default venueRoute;