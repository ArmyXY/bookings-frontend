"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

type AuthContextType = {
  user: AuthUser | null;
  token: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setToken("");
    setUser(null);
    router.replace("/login");
  }, [router]);

  const setSession = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem("auth_token", nextToken);
    localStorage.setItem("user_data", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem("auth_token") ?? "";
    if (!storedToken) {
      setUser(null);
      setToken("");
      return;
    }

    setToken(storedToken);
    const currentUser = await getCurrentUser();
    localStorage.setItem("user_data", JSON.stringify(currentUser));
    setUser(currentUser);
  };

  useEffect(() => {
    async function bootstrapSession() {
      const storedToken = localStorage.getItem("auth_token") ?? "";
      const storedUser = localStorage.getItem("user_data");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as AuthUser);
        } catch {
          localStorage.removeItem("user_data");
        }
      }

      try {
        const currentUser = await getCurrentUser();
        localStorage.setItem("user_data", JSON.stringify(currentUser));
        setUser(currentUser);
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        setToken("");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrapSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      setSession,
      logout,
      refreshUser,
    }),
    [isLoading, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
