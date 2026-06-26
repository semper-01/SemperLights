const config = {
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL as string ?? "http://localhost:8000/api/v1",
    timeout: 15000,
  },
  app: {
    name: import.meta.env.VITE_APP_NAME as string ?? "Semper Lights",
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
  },
} as const;

export default config;