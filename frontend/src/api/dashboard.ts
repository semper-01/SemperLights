import apiClient from "./client";
import type { PaginatedResponse, AppointmentResponse, ContactMessageResponse, Project, Service } from "@/types";

const BASE = ""; // apiClient already has /api/v1 prefix

/**
 * Fetch all appointments (staff view).
 */
export async function fetchAllAppointments(params?: Record<string, string | number | boolean>): Promise<PaginatedResponse<AppointmentResponse>> {
  const response = await apiClient.get<PaginatedResponse<AppointmentResponse>>(
    `${BASE}/appointments/`,
    { params }
  );
  return response.data;
}

/**
 * Fetch all contact messages (staff view).
 */
export async function fetchAllContactMessages(params?: Record<string, string | number | boolean>): Promise<PaginatedResponse<ContactMessageResponse>> {
  const response = await apiClient.get<PaginatedResponse<ContactMessageResponse>>(
    `${BASE}/contact-messages/`,
    { params }
  );
  return response.data;
}

/**
 * Fetch all projects (staff view — includes all statuses).
 */
export async function fetchAllProjects(params?: Record<string, string | number | boolean>): Promise<PaginatedResponse<Project>> {
  const response = await apiClient.get<PaginatedResponse<Project>>(
    `${BASE}/projects/`,
    { params }
  );
  return response.data;
}

/**
 * Fetch all services (staff view — includes inactive).
 */
export async function fetchAllServices(): Promise<PaginatedResponse<Service>> {
  const response = await apiClient.get<PaginatedResponse<Service>>(`${BASE}/services/`);
  return response.data;
}

/**
 * Fetch all newsletter subscribers (staff view).
 */
export async function fetchAllSubscribers(): Promise<PaginatedResponse<{ id: number; email: string; is_active: boolean; subscribed_at: string }>> {
  const response = await apiClient.get<PaginatedResponse<{ id: number; email: string; is_active: boolean; subscribed_at: string }>>(
    `${BASE}/newsletter-subscribers/`
  );
  return response.data;
}

/**
 * Fetch all blog posts (staff view — includes all statuses).
 */
export async function fetchAllBlogPosts(): Promise<PaginatedResponse<{ id: number; title: string; status: string }>> {
  const response = await apiClient.get<PaginatedResponse<{ id: number; title: string; status: string }>>(
    `${BASE}/posts/`
  );
  return response.data;
}

// Re-export CRUD endpoints used by dashboard CMS pages.
export * from "./dashboardCrud";

