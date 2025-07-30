"use client";

import { useAuth } from "@/contexts/auth-context";
import { TokenManager } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireOrganization?: boolean; // Add this prop to control organization requirement
}

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  requireOrganization = true, // Default to requiring organization
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

  const checkAuthStatus = useCallback((): {
    isAuth: boolean;
    redirectPath?: string;
  } => {
    try {
      console.log("=== PROTECTED ROUTE AUTH CHECK ===");

      // Check tokens first
      const accessToken = TokenManager.getAccessToken();
      const currentUser = getCurrentUser();
      const contextAuth = contextIsAuthenticated;

      console.log("Access Token:", !!accessToken);
      console.log("Current User:", !!currentUser);
      console.log("Context Auth:", contextAuth);

      const isAuth = !!(accessToken && currentUser && contextAuth);
      console.log("Basic Auth Status:", isAuth);

      if (!isAuth) {
        return { isAuth: false, redirectPath: redirectTo };
      }

      // If organization is required, check for it
      if (requireOrganization) {
        const orgRedirectPath = checkOrganizationAndRedirect();
        console.log("Organization check result:", orgRedirectPath);

        // If orgRedirectPath is '/organizations', it means user needs to select organization
        if (!orgRedirectPath) {
          return { isAuth: false, redirectPath: "/organizations" };
        }
      }

      console.log("Final Auth Status: Fully authenticated");
      return { isAuth: true };
    } catch (error) {
      console.error("Protected route auth check error:", error);
      return { isAuth: false, redirectPath: redirectTo };
    }
  }, [
    contextIsAuthenticated,
    getCurrentUser,
    checkOrganizationAndRedirect,
    requireOrganization,
    redirectTo,
  ]);

  useEffect(() => {
    if (authLoading) {
      console.log("Auth context is still loading...");
      return;
    }

    const performAuthCheck = () => {
      console.log("Performing auth check...");

      try {
        const { isAuth, redirectPath } = checkAuthStatus();
        setIsAuthenticated(isAuth);

        if (!isAuth && redirectPath) {
          console.log(
            "User not authenticated/authorized, redirecting to:",
            redirectPath
          );

          // Only clear tokens if redirecting to login (not organization page)
          if (redirectPath === redirectTo) {
            TokenManager.clearTokens();
          }

          router.push(redirectPath);
        } else {
          console.log(
            "User authenticated and authorized, showing protected content"
          );
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
    console.log("Not authenticated/authorized, not rendering children");
    return null;
  }

  console.log("Rendering protected content");
  return <>{children}</>;
}
