export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  PORTFOLIO: "/portfolio",
  SERVICES: "/services",
  CONTACT: "/contact",
  APPOINTMENT: "/appointment",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;