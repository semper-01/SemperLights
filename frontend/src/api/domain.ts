import apiClient from "./client";
import type {
  SiteSetting,
  User,
  Project,
  Service,
  PortfolioCategory,
  Technology,
  PaginatedResponse,
  ContactMessageResponse,
  AppointmentRequest,
  AppointmentResponse,
} from "@/types";

const BASE = ""; // apiClient already has /api/v1 prefix

/**
 * Fetch the singleton SiteSetting (first record).
 * The backend returns a paginated response; we extract the first result.
 */
export async function fetchSiteSettings(): Promise<SiteSetting> {
  const response = await apiClient.get<PaginatedResponse<SiteSetting>>(`${BASE}/site-settings/`);
  const { results } = response.data;
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("No site settings found. Ensure a SiteSetting record exists in the database.");
  }
  return results[0] as SiteSetting;
}

/**
 * Fetch the current authenticated user's profile.
 * Returns null if the user is not authenticated (no 401 thrown).
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const response = await apiClient.get<User>(`${BASE}/auth/current-user/`);
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Fetch published, featured projects for the homepage.
 */
export async function fetchFeaturedProjects(): Promise<Project[]> {
  const response = await apiClient.get<PaginatedResponse<Project>>(
    `${BASE}/projects/`,
    { params: { featured: true, status: "published" } }
  );
  return response.data.results;
}

/**
 * Fetch all published projects (for portfolio page).
 */
export async function fetchProjects(params?: Record<string, string | number | boolean>): Promise<PaginatedResponse<Project>> {
  const response = await apiClient.get<PaginatedResponse<Project>>(
    `${BASE}/projects/`,
    { params: { ...params, status: "published" } }
  );
  return response.data;
}

/**
 * Fetch a single project by ID.
 */
export async function fetchProject(id: number): Promise<Project> {
  const response = await apiClient.get<Project>(`${BASE}/projects/${id}/`);
  return response.data;
}

/**
 * Fetch active services.
 */
export async function fetchServices(): Promise<Service[]> {
  const response = await apiClient.get<PaginatedResponse<Service>>(
    `${BASE}/services/`,
    { params: { active: true } }
  );
  return response.data.results;
}

/**
 * Fetch portfolio categories.
 */
export async function fetchCategories(): Promise<PortfolioCategory[]> {
  const response = await apiClient.get<PaginatedResponse<PortfolioCategory>>(`${BASE}/categories/`);
  return response.data.results;
}

/**
 * Fetch technologies.
 */
export async function fetchTechnologies(): Promise<Technology[]> {
  const response = await apiClient.get<PaginatedResponse<Technology>>(`${BASE}/technologies/`);
  return response.data.results;
}

// ─── Contact Messages ───────────────────────────────────────────

/**
 * Submit a contact message.
 */
export async function submitContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessageResponse> {
  const response = await apiClient.post<ContactMessageResponse>(
    `${BASE}/contact-messages/`,
    data
  );
  return response.data;
}

// ─── Appointments ───────────────────────────────────────────────

/**
 * Create a new appointment (booking request).
 */
export async function createAppointment(data: AppointmentRequest): Promise<AppointmentResponse> {
  const response = await apiClient.post<AppointmentResponse>(
    `${BASE}/appointments/`,
    data
  );
  return response.data;
}