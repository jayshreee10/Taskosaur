"use client";

import { useAuth } from "@/contexts/auth-context";
import { TokenManager } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireOrganization?: boolean;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  requireOrganization = false,
}: ProtectedRouteProps) {
  const {
    getCurrentUser,
    isAuthenticated: contextIsAuthenticated,
    isLoading: authLoading,
    checkOrganizationAndRedirect,
  } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async (): Promise<{ isAuth: boolean; redirectPath?: string }> => {
    try {
      // Check tokens first
      const accessToken = TokenManager.getAccessToken();
      const currentUser = getCurrentUser();
      const contextAuth = contextIsAuthenticated;
      const isAuth = !!(accessToken && currentUser && contextAuth);

      if (!isAuth) {
        return { isAuth: false, redirectPath: redirectTo };
      }

      // Always check organization after auth
      if (typeof checkOrganizationAndRedirect === 'function') {
        const orgRedirect = await checkOrganizationAndRedirect();
        if (orgRedirect === '/organization') {
          return { isAuth: true, redirectPath: '/organization' };
        }
        if (orgRedirect === '/dashboard') {
          return { isAuth: true, redirectPath: '/dashboard' };
        }
      }
      return { isAuth: true };
    } catch (error) {
      console.error("Protected route auth check error:", error);
      return { isAuth: false, redirectPath: redirectTo };
    }
  }, [
    contextIsAuthenticated,
    getCurrentUser,
    redirectTo,
    checkOrganizationAndRedirect,
  ]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const performAuthCheck = async () => {
      try {
        const { isAuth, redirectPath } = await checkAuthStatus();
        setIsAuthenticated(isAuth);

        if (redirectPath) {
          if (redirectPath === redirectTo) {
            TokenManager.clearTokens();
          }
          router.push(redirectPath);
        }
      } catch (error) {
        console.error("Protected route check error:", error);
        setIsAuthenticated(false);
        TokenManager.clearTokens();
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure auth context is fully initialized
    const timeoutId = setTimeout(performAuthCheck, 200);
    return () => clearTimeout(timeoutId);
  }, [authLoading, checkAuthStatus, redirectTo, router]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--border)] border-t-[var(--primary)]"></div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}