export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "client" | "admin" | "photographer";
  avatar?: string;
  phone?: string;
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