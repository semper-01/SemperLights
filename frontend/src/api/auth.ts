import apiClient from "./client";
import type { User } from "@/types";

interface AuthTokensResponse {
  access: string;
  refresh: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthTokensResponse> {
  const response = await apiClient.post<AuthTokensResponse>("/auth/login/", credentials);
  return response.data;
}

export async function registerUser(payload: RegisterPayload): Promise<Record<string, unknown>> {
  const response = await apiClient.post<Record<string, unknown>>("/auth/register/", payload);
  return response.data;
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/auth/current-user/");
  return response.data;
}

export async function logoutUser(): Promise<void> {
  try {
    await apiClient.post("/auth/logout/");
  } catch {
    // ignore logout errors and clear client state locally
  }
}
