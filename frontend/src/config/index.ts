const buildApiUrl = (url: string): string => {
  // If it already starts with http, it's an absolute URL (e.g. local dev)
  if (url.startsWith("http")) {
    return url;
  }
  // Otherwise it's a relative URL (e.g. /api/v1 in production behind Nginx)
  return url;
};

const config = {
  api: {
    baseURL: buildApiUrl(
      (import.meta.env.VITE_API_BASE_URL as string) || "/api/v1"
    ),
    timeout: 15000,
  },
  app: {
    name: (import.meta.env.VITE_APP_NAME as string) || "Semper Lights",
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
  },
} as const;

export default config;
