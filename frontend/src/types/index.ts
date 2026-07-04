export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: "client" | "admin" | "photographer";
  avatar?: string;
  phone?: string;
  bio?: string;
  profile_image?: string | null;
  is_active?: boolean;
  is_staff?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: "success" | "error";
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ─── Backend Domain Types ───────────────────────────────────────

/** Core / SiteSetting */
export interface SiteSetting {
  id: number;
  site_name: string;
  tagline: string;
  logo: string | null;
  favicon: string | null;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  instagram: string;
  x: string;
  youtube: string;
  footer_text: string;
  created_at: string;
  updated_at: string;
}

/** Portfolio Category */
export interface PortfolioCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

/** Portfolio Technology */
export interface Technology {
  id: number;
  name: string;
  icon: string | null;
  website: string;
}

/** Portfolio ProjectImage (nested) */
export interface ProjectImage {
  id: number;
  image: string;
  caption: string;
  display_order: number;
  project: number;
}

/** Portfolio Project */
export interface Project {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  thumbnail: string | null;
  cover_image: string | null;
  featured: boolean;
  display_order: number;
  status: "draft" | "published" | "archived";
  live_demo: string;
  github_url: string;
  started_at: string | null;
  completed_at: string | null;
  category: number;
  technologies: number[];
  images: ProjectImage[];
  created_at: string;
  updated_at: string;
}

/** Service */
export interface Service {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string | null;
  starting_price: string;
  estimated_duration: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** ContactMessage — request body for POST /api/v1/contact-messages/ */
export interface ContactMessageRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** ContactMessage — response shape */
export interface ContactMessageResponse {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Appointment — request body for POST /api/v1/appointments/ */
export interface AppointmentRequest {
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  service: number;
  preferred_date: string;       // YYYY-MM-DD
  preferred_time?: string;      // HH:MM:SS
  budget_range: string;
  project_summary?: string;
}

/** Appointment — response shape */
export interface AppointmentResponse {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  service: number;
  preferred_date: string;
  preferred_time: string | null;
  budget_range: string;
  project_summary: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}