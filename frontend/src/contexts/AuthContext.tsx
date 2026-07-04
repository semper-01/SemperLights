import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import type { User, AuthState } from "@/types";
import { storage } from "@/utils/storage";
import { fetchCurrentUser } from "@/api/auth";

interface AuthContextType extends AuthState {
  isAdmin: boolean;
  login: (user: User, accessToken: string, refreshToken: string, isAdmin?: boolean) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function decodeTokenClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isAdminUser(user: User | null, accessToken: string | null): boolean {
  if (!user && !accessToken) return false;

  const claims = accessToken ? decodeTokenClaims(accessToken) : null;
  const claimValue = claims?.is_staff ?? claims?.is_superuser;

  return Boolean(
    user?.is_staff ||
      user?.role === "admin" ||
      claimValue === true
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [isAdmin, setIsAdmin] = useState(false);

  const login = useCallback((user: User, accessToken: string, refreshToken: string, admin = false) => {
    const normalizedUser = {
      ...user,
      role: admin ? "admin" : user.role || "client",
      is_staff: admin || user.is_staff,
    } as User;

    storage.setToken(accessToken);
    storage.setRefreshToken(refreshToken);
    storage.setUser(normalizedUser as unknown as Record<string, unknown>);
    setState({ user: normalizedUser, isAuthenticated: true, isLoading: false });
    setIsAdmin(admin || normalizedUser.role === "admin" || Boolean(normalizedUser.is_staff));
  }, []);

  const logout = useCallback(() => {
    storage.clearAuth();
    setState({ user: null, isAuthenticated: false, isLoading: false });
    setIsAdmin(false);
  }, []);

  const updateUser = useCallback((user: User) => {
    const normalizedUser = {
      ...user,
      role: isAdmin ? "admin" : user.role || "client",
    } as User;

    storage.setUser(normalizedUser as unknown as Record<string, unknown>);
    setState((prev) => ({ ...prev, user: normalizedUser }));
    setIsAdmin(Boolean(normalizedUser.is_staff) || normalizedUser.role === "admin" || isAdmin);
  }, [isAdmin]);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = storage.getToken();
      if (!token) {
        if (isMounted) {
          setState({ user: null, isAuthenticated: false, isLoading: false });
          setIsAdmin(false);
        }
        return;
      }

      try {
        const user = await fetchCurrentUser();
        const admin = isAdminUser(user, token);
        const normalizedUser = {
          ...user,
          role: admin ? "admin" : user.role || "client",
          is_staff: admin || user.is_staff,
        } as User;

        if (isMounted) {
          storage.setUser(normalizedUser as unknown as Record<string, unknown>);
          setState({ user: normalizedUser, isAuthenticated: true, isLoading: false });
          setIsAdmin(admin);
        }
      } catch {
        if (isMounted) {
          storage.clearAuth();
          setState({ user: null, isAuthenticated: false, isLoading: false });
          setIsAdmin(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAdmin,
        login,
        logout,
        updateUser,
        setLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}