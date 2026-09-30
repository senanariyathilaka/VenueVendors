import api from "@/services/api";

interface VenueData {
  name: string;
  type: string;
  location: string;
  capacity: number;
  recommendedSuitability: string;
}

export const venueApi = {
  createVenue: async (vendorId: number, venueData: VenueData) => {
    const res = await api.post(`/vendors/${vendorId}/venues`, venueData);
    return res.data;
  },


  updateVenue: async (venueId: number, venueData: VenueData) => {
    const res = await api.put(`/venues/${venueId}`, venueData);
    return res.data;
  },

  deleteVenue: async (venueId: number) => {
    const res = await api.delete(`/venues/${venueId}`);
    return res.data;
  },

getVenueBookings: async (venueId: number) => {
  const res = await api.get(`/venues/${venueId}/bookings`);
  return res.data;
},

  updateBookingStatus: async (
    venueId: number,
    bookingId: number,
    status: string
  ) => {
    const res = await api.put(
      `/venues/${venueId}/bookings/${bookingId}/status`,
      { status }
    );

    return res.data;
  },

  deleteBooking: async (
    venueId: number,
    bookingId: number
  ) => {
    const res = await api.delete(
      `/venues/${venueId}/bookings/${bookingId}`
    );

    return res.data;
  },
};