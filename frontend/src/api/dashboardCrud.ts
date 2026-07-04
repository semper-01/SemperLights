import apiClient from "./client";
import type {
  PaginatedResponse,
  Project,
  Service,
  PortfolioCategory,
  Technology,
  ContactMessageResponse,
  AppointmentResponse,
} from "@/types";

const BASE = ""; // apiClient already has /api/v1 prefix

// ────────────────────────────────────────────────────────────────
// Portfolio Projects
// ────────────────────────────────────────────────────────────────

export async function listProjects(
  params?: Record<string, string | number | boolean>
): Promise<PaginatedResponse<Project>> {
  const response = await apiClient.get<PaginatedResponse<Project>>(`${BASE}/projects/`, { params });
  return response.data;
}

export async function createProject(data: FormData | Record<string, unknown>): Promise<Project> {
  const response = await apiClient.post<Project>(`${BASE}/projects/`, data);
  return response.data;
}

export async function getProject(id: number): Promise<Project> {
  const response = await apiClient.get<Project>(`${BASE}/projects/${id}/`);
  return response.data;
}

export async function updateProject(
  id: number,
  data: FormData | Record<string, unknown>
): Promise<Project> {
  const response = await apiClient.put<Project>(`${BASE}/projects/${id}/`, data);
  return response.data;
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/projects/${id}/`);
}

export async function publishProject(id: number): Promise<Project> {
  const response = await apiClient.post<Project>(`${BASE}/projects/${id}/publish/`);
  return response.data;
}

export async function unpublishProject(id: number): Promise<Project> {
  const response = await apiClient.post<Project>(`${BASE}/projects/${id}/unpublish/`);
  return response.data;
}

export async function featureProject(id: number): Promise<Project> {
  const response = await apiClient.post<Project>(`${BASE}/projects/${id}/feature/`);
  return response.data;
}

// ────────────────────────────────────────────────────────────────
// Project Images (nested)
// ────────────────────────────────────────────────────────────────

export async function listProjectImages(projectId: number): Promise<Project["images"]> {
  const response = await apiClient.get<Project["images"]>(`${BASE}/projects/${projectId}/images/`);
  return response.data;
}

export async function createProjectImage(
  projectId: number,
  data: FormData
): Promise<Project["images"][number]> {
  const response = await apiClient.post<Project["images"][number]>(
    `${BASE}/projects/${projectId}/images/`,
    data
  );
  return response.data;
}

export async function deleteProjectImage(projectId: number, imageId: number): Promise<void> {
  await apiClient.delete(`${BASE}/projects/${projectId}/images/${imageId}/`);
}

// ────────────────────────────────────────────────────────────────
// Portfolio Categories
// ────────────────────────────────────────────────────────────────

export async function listCategories(
  params?: Record<string, string | number | boolean>
): Promise<PaginatedResponse<PortfolioCategory>> {
  const response = await apiClient.get<PaginatedResponse<PortfolioCategory>>(`${BASE}/categories/`, { params });
  return response.data;
}

export async function createCategory(data: Record<string, unknown>): Promise<PortfolioCategory> {
  const response = await apiClient.post<PortfolioCategory>(`${BASE}/categories/`, data);
  return response.data;
}

export async function getCategory(id: number): Promise<PortfolioCategory> {
  const response = await apiClient.get<PortfolioCategory>(`${BASE}/categories/${id}/`);
  return response.data;
}

export async function updateCategory(id: number, data: Record<string, unknown>): Promise<PortfolioCategory> {
  const response = await apiClient.put<PortfolioCategory>(`${BASE}/categories/${id}/`, data);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/categories/${id}/`);
}

// ────────────────────────────────────────────────────────────────
// Portfolio Technologies
// ────────────────────────────────────────────────────────────────

export async function listTechnologies(
  params?: Record<string, string | number | boolean>
): Promise<PaginatedResponse<Technology>> {
  const response = await apiClient.get<PaginatedResponse<Technology>>(`${BASE}/technologies/`, { params });
  return response.data;
}

export async function createTechnology(data: FormData | Record<string, unknown>): Promise<Technology> {
  const response = await apiClient.post<Technology>(`${BASE}/technologies/`, data);
  return response.data;
}

export async function getTechnology(id: number): Promise<Technology> {
  const response = await apiClient.get<Technology>(`${BASE}/technologies/${id}/`);
  return response.data;
}

export async function updateTechnology(
  id: number,
  data: FormData | Record<string, unknown>
): Promise<Technology> {
  const response = await apiClient.put<Technology>(`${BASE}/technologies/${id}/`, data);
  return response.data;
}

export async function deleteTechnology(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/technologies/${id}/`);
}

// ────────────────────────────────────────────────────────────────
// Services
// ────────────────────────────────────────────────────────────────

export async function listServices(
  params?: Record<string, string | number | boolean>
): Promise<PaginatedResponse<Service>> {
  const response = await apiClient.get<PaginatedResponse<Service>>(`${BASE}/services/`, { params });
  return response.data;
}

export async function createService(data: FormData | Record<string, unknown>): Promise<Service> {
  const response = await apiClient.post<Service>(`${BASE}/services/`, data);
  return response.data;
}

export async function getService(id: number): Promise<Service> {
  const response = await apiClient.get<Service>(`${BASE}/services/${id}/`);
  return response.data;
}

export async function updateService(
  id: number,
  data: FormData | Record<string, unknown>
): Promise<Service> {
  const response = await apiClient.put<Service>(`${BASE}/services/${id}/`, data);
  return response.data;
}

export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/services/${id}/`);
}

export async function activateService(id: number): Promise<Service> {
  const response = await apiClient.post<Service>(`${BASE}/services/${id}/activate/`);
  return response.data;
}

export async function deactivateService(id: number): Promise<Service> {
  const response = await apiClient.post<Service>(`${BASE}/services/${id}/deactivate/`);
  return response.data;
}

// ────────────────────────────────────────────────────────────────
// Contact Messages
// ────────────────────────────────────────────────────────────────

export async function listContactMessages(
  params?: Record<string, string | number | boolean>
): Promise<PaginatedResponse<ContactMessageResponse>> {
  const response = await apiClient.get<PaginatedResponse<ContactMessageResponse>>(
    `${BASE}/contact-messages/`,
    { params }
  );
  return response.data;
}

export async function getContactMessage(id: number): Promise<ContactMessageResponse> {
  const response = await apiClient.get<ContactMessageResponse>(`${BASE}/contact-messages/${id}/`);
  return response.data;
}

export async function deleteContactMessage(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/contact-messages/${id}/`);
}

export async function markContactMessageRead(id: number, isRead: boolean): Promise<ContactMessageResponse> {
  const response = await apiClient.patch<ContactMessageResponse>(`${BASE}/contact-messages/${id}/`, { is_read: isRead });
  return response.data;
}

// ────────────────────────────────────────────────────────────────
// Appointments
// ────────────────────────────────────────────────────────────────

export async function listAppointments(
  params?: Record<string, string | number | boolean>
): Promise<PaginatedResponse<AppointmentResponse>> {
  const response = await apiClient.get<PaginatedResponse<AppointmentResponse>>(`${BASE}/appointments/`, { params });
  return response.data;
}

export async function getAppointment(id: number): Promise<AppointmentResponse> {
  const response = await apiClient.get<AppointmentResponse>(`${BASE}/appointments/${id}/`);
  return response.data;
}

export async function deleteAppointment(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/appointments/${id}/`);
}

export async function updateAppointmentStatus(id: number, status: string): Promise<AppointmentResponse> {
  const response = await apiClient.post<AppointmentResponse>(`${BASE}/appointments/${id}/update_status/`, { status });
  return response.data;
}

export async function updateAppointmentNotes(id: number, notes: string): Promise<AppointmentResponse> {
  const response = await apiClient.patch<AppointmentResponse>(`${BASE}/appointments/${id}/`, { notes });
  return response.data;
}

// ────────────────────────────────────────────────────────────────
// Site Settings
// ────────────────────────────────────────────────────────────────

export async function updateSiteSetting(id: number, data: Record<string, unknown> | FormData): Promise<void> {
  await apiClient.put(`${BASE}/site-settings/${id}/`, data);
}


