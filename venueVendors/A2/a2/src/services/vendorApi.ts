import type { Venue } from "@/interfaces/Venue";
import api from "./api";

export interface VendorHirer {
  id: number;
  name: string;
  email: string;
  comments: string;
  rating: number;
  approvalCount: number;
  requirements: string;
}

export const vendorApi = {
  getVenues: async (vendorId: number) => {
    const response = await api.get<Venue[]>(`/vendors/${vendorId}/venues`);
    return response.data;
  },

  getHirers: async () => {
    const response = await api.get<VendorHirer[]>("/hirers");
    return response.data;
  },

  blockVenueDates: async (
    venueId: number,
    blockedDateFrom: Date,
    blockedDateTo: Date
  ) => {
    const response = await api.put<Venue>(`/venues/${venueId}/block`, {
      blockedDateFrom,
      blockedDateTo,
    });

    return response.data;
  },

  approveHirer: async (hirerId: number) => {
    const response = await api.put(`/hirers/${hirerId}/approve`);
    return response.data;
  },

  addHirerComment: async (hirerId: number, comment: string) => {
    const response = await api.post(`/hirers/${hirerId}/comments`, {
      comment,
    });

    return response.data;
  },

  getVendorAnalytics: async (vendorId: number, timeRange: string) => {
    const response = await api.get(
      `/vendors/${vendorId}/analytics?timeRange=${timeRange}`
    );

    return response.data;
  },
};
