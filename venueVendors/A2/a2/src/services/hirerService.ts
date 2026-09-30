import axios from "axios";
import api from "./api";

export interface HirerProfileApi {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "hirer";
  comments: string;
  rating: number;
  requirements: string;
  approvalCount: number;
  dateJoined?: string;
}

export interface VenueApi {
  id: number;
  name: string;
  type: string;
  location: string;
  capacity: number;
  recommendedSuitability: string;
  managedBy: string;
  blockedDateFrom: string | null;
  blockedDateTo: string | null;
  isFeatured: boolean;
}

export interface VenuePreferenceApi {
  id: number;
  venueId: number;
  venueName: string;
  location: string;
  preferenceRank: number;
}

export interface SavedApplicationApi {
  id: number;
  venueId: number;
  venueName: string;
  location: string;
  eventName: string;
  expectedGuests: number;
  eventDate: string;
  eventTime: string;
  durationHours: number;
  status: string;
}

export interface HiringHistoryItemApi {
  id: number;
  venueName: string;
  location: string;
  eventName: string;
  hireDate: string;
  rating: number;
}

interface ProfileUpdateResponse {
  message: string;
  profile: HirerProfileApi;
}

interface PreferenceSaveResponse {
  message: string;
  preferences: {
    id: number;
    venueId: number;
    preferenceRank: number;
  }[];
}

interface ApplicationCreateResponse {
  message: string;
  application: SavedApplicationApi;
}

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export async function fetchHirerProfile(hirerId: number) {
  try {
    const response = await api.get<HirerProfileApi>(`/hirers/${hirerId}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to fetch profile."));
  }
}

export async function updateHirerProfile(
  hirerId: number,
  payload: { name: string; phone: string }
) {
  try {
    const response = await api.put<ProfileUpdateResponse>(
      `/hirers/${hirerId}`,
      payload
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update profile."));
  }
}

export async function fetchVenues(filters?: {
  name?: string;
  location?: string;
  suitability?: string;
  capacity?: string;
}) {
  try {
    const response = await api.get<VenueApi[]>("/venues", {
      params: {
        name: filters?.name || "",
        location: filters?.location || "",
        suitability: filters?.suitability || "",
        capacity: filters?.capacity || "",
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to fetch venues."));
  }
}

export async function fetchHirerPreferences(hirerId: number) {
  try {
    const response = await api.get<VenuePreferenceApi[]>(
      `/hirers/${hirerId}/preferences`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Unable to fetch preferred venues.")
    );
  }
}

export async function saveHirerPreferences(
  hirerId: number,
  venueIds: number[]
) {
  try {
    const response = await api.put<PreferenceSaveResponse>(
      `/hirers/${hirerId}/preferences`,
      { venueIds }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Unable to save preferred venues.")
    );
  }
}

export async function createHirerApplication(
  hirerId: number,
  payload: {
    venueId: number;
    eventName: string;
    expectedGuests: number;
    eventDate: string;
    eventTime: string;
    durationHours: number;
  }
) {
  try {
    const response = await api.post<ApplicationCreateResponse>(
      `/hirers/${hirerId}/applications`,
      payload
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to submit application."));
  }
}

export async function fetchHirerApplications(hirerId: number) {
  try {
    const response = await api.get<SavedApplicationApi[]>(
      `/hirers/${hirerId}/applications`
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to fetch applications."));
  }
}

export async function fetchHirerHistory(hirerId: number) {
  try {
    const response = await api.get<HiringHistoryItemApi[]>(
      `/hirers/${hirerId}/history`
    );

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to fetch history."));
  }
}
