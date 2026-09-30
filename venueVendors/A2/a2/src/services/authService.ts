import axios from "axios";
import api from "./api";

export type UserRole = "hirer" | "vendor";

export interface AuthApiUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  comments: string;
  rating: number;
  requirements: string;
  approvalCount: number;
  dateJoined?: string;
  venue?: string;
}

export interface SignupPayload {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface AuthApiResponse {
  message: string;
  user: AuthApiUser;
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

export async function signupUser(payload: SignupPayload) {
  try {
    const response = await api.post<AuthApiResponse>("/auth/signup", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to create account."));
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const response = await api.post<AuthApiResponse>("/auth/login", {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Unable to process sign-in request.")
    );
  }
}

export async function fetchProfile(role: UserRole, id: number) {
  try {
    const response = await api.get<AuthApiUser>(`/auth/profile/${role}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to fetch profile."));
  }
}
