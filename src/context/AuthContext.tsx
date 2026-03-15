"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthUser,
  getAuthenticatedUser,
  loginUser,
  logoutUser,
  registerUser,
} from "@/lib/auth";

type PublicUser = Omit<AuthUser, "password">;

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: PublicUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (payload: SignupInput) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toPublicUser(user: AuthUser): PublicUser {
  return {
    name: user.name,
    email: user.email,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      const currentUser = getAuthenticatedUser();

      if (currentUser) {
        setUser(toPublicUser(currentUser));
      }

      setLoading(false);
    });
  }, []);

  const signup = useCallback(async (payload: SignupInput) => {
    const result = registerUser(payload);

    if (!result.success) {
      return { success: false, message: result.message };
    }
    return { success: true };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = loginUser(email, password);

    if (!result.success || !result.user) {
      return { success: false, message: result.message };
    }

    setUser(toPublicUser(result.user));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signup,
      login,
      logout,
    }),
    [loading, login, logout, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
