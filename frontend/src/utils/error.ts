import { AxiosError } from "axios";
import type { ApiError } from "@/types";
import { HTTP_STATUS } from "@/constants";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data?.detail) return data.detail as string;
    if (data?.message) return data.message as string;
    if (error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      return "An unexpected error occurred. Please try again later.";
    }
    if (error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      return "Too many requests. Please try again later.";
    }
    if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
      return "The requested resource was not found.";
    }
    if (error.code === "ERR_NETWORK") {
      return "Unable to connect to the server. Please check your connection.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export function getApiError(error: unknown): ApiError {
  const defaultError: ApiError = {
    message: "An unexpected error occurred.",
    status: 0,
  };

  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    return {
      message: getErrorMessage(error),
      status: error.response?.status ?? 0,
      errors: data?.errors as Record<string, string[]> | undefined,
    };
  }

  return defaultError;
}

export function isUnauthorized(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === HTTP_STATUS.UNAUTHORIZED;
  }
  return false;
}

export function isForbidden(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === HTTP_STATUS.FORBIDDEN;
  }
  return false;
}

export function isNotFound(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === HTTP_STATUS.NOT_FOUND;
  }
  return false;
}

export function isValidationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === HTTP_STATUS.UNPROCESSABLE_ENTITY;
  }
  return false;
}