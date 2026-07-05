"use client";

import { getSession, signIn, signOut } from "@/lib/auth-client";
import type { User } from "better-auth";
import { createContext, useContext, useEffect, useState } from "react";

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await getSession();
      setUser(session?.user || null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await signIn.email({ email, password });
    if (error) throw new Error(error.message);
    if (!data?.user) throw new Error("Login failed, no user returned");
    await fetchUser();
    return data.user;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, isLoading, login, logout, refetchUser: fetchUser };
};

const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuthContext must be used within an AuthProvider");
  return context;
};
