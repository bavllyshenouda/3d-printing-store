"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n/context";

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    [key: string]: any;
  };
}

export interface CustomerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  profile: CustomerProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    emailConfirmationRequired?: boolean;
  }>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const { t } = useTranslation();

  const fetchSessionData = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setUser(json.data.user);
          setIsAdmin(Boolean(json.data.is_admin));

          // Fetch profile details
          try {
            const profileRes = await fetch("/api/profile");
            if (profileRes.ok) {
              const profileJson = await profileRes.json();
              if (profileJson.success && profileJson.data?.profile) {
                setProfile(profileJson.data.profile);
              }
            }
          } catch {
            // Profile fetch optional fallback
          }
          return;
        }
      }
      // If unauthenticated or 401
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } catch {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial session check and subscribe to browser Supabase auth events
  useEffect(() => {
    fetchSessionData();

    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
          await fetchSessionData();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error("Supabase client auth listener setup failed:", err);
    }
  }, [fetchSessionData]);

  // Login handler
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || "Invalid email or password",
        };
      }

      setUser(json.data.user);
      if (json.data.profile) {
        setProfile(json.data.profile);
      }

      await fetchSessionData();

      toast.success(t("auth.loginSuccessTitle"), t("auth.loginSuccessDesc"));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler
  const register = async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        let errorMsg = json.error || "Registration failed";
        if (json.details) {
          const firstDetail = Object.values(json.details)[0];
          if (Array.isArray(firstDetail) && firstDetail[0]) {
            errorMsg = firstDetail[0];
          }
        }
        return { success: false, error: errorMsg };
      }

      const emailConfirmationRequired = Boolean(json.data?.email_confirmation_required);

      if (!emailConfirmationRequired) {
        await fetchSessionData();
        toast.success(t("auth.registerSuccessTitle"), t("auth.registerSuccessDesc"));
      } else {
        toast.info(t("auth.registerSuccessTitle"), t("auth.confirmEmailDesc"));
      }

      return {
        success: true,
        emailConfirmationRequired,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Fallback
      }

      setUser(null);
      setProfile(null);
      setIsAdmin(false);

      toast.info(t("auth.logout"), t("auth.logoutSuccess"));
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile handler
  const updateProfile = async (data: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
  }) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || "Failed to update profile",
        };
      }

      setProfile(json.data.profile);
      toast.success(t("profile.updateSuccessTitle"), t("profile.updateSuccessDesc"));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        updateProfile,
        refreshSession: fetchSessionData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

