import { useAuth } from "@/contexts/auth-context";
import { TokenManager } from "@/lib/api";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import AppProviders from "./AppProviders";
import OrgProviders from "./OrgProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  publicRoutes?: string[];
}

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"],
}: ProtectedRouteProps) {
  const {
    getCurrentUser,
    isAuthenticated: contextIsAuthenticated,
    isLoading: authLoading,
    checkOrganizationAndRedirect,
  } = useAuth();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isPublicRoute = publicRoutes.includes(router.pathname);

  const checkAuthStatus = useCallback(async (): Promise<{
    isAuth: boolean;
    redirectPath?: string;
    isOrg: boolean;
  }> => {
    try {
      const accessToken = TokenManager.getAccessToken();
      const currentOrgId = TokenManager.getCurrentOrgId();
      const currentUser = getCurrentUser();
      const contextAuth = contextIsAuthenticated;

      const isAuth = !!(accessToken && currentUser && contextAuth);
      if (!isAuth) {
        if (isPublicRoute) {
          return { isAuth: false, isOrg: false };
        }
        return { isAuth: false, redirectPath: redirectTo, isOrg: false };
      }

      if (isPublicRoute) {
        if (typeof checkOrganizationAndRedirect === "function") {
          const orgRedirect = await checkOrganizationAndRedirect();
          if (!currentOrgId && orgRedirect === "/organization") {
            return {
              isAuth: true,
              redirectPath: "/organization",
              isOrg: false,
            };
          }
          if (!currentOrgId && orgRedirect === "/dashboard") {
            return { isAuth: true, redirectPath: "/dashboard", isOrg: true };
          }
        }
        return { isAuth: true, redirectPath: "/dashboard", isOrg: true };
      }

      if (typeof checkOrganizationAndRedirect === "function") {
        const orgRedirect = await checkOrganizationAndRedirect();
        if (currentOrgId && router.pathname === "/organization") {
          return { isAuth: true, redirectPath: "/dashboard", isOrg: true };
        }
        if (!currentOrgId && orgRedirect === "/organization") {
          return { isAuth: true, redirectPath: "/organization", isOrg: false };
        }
        if (!currentOrgId && orgRedirect === "/dashboard") {
          return { isAuth: true, redirectPath: "/dashboard", isOrg: true };
        }
      }
      return { isAuth: true, isOrg: true };
    } catch (error) {
      console.error(
        "[checkAuthStatus] Protected route auth check error:",
        error
      );
      return { isAuth: false, redirectPath: redirectTo, isOrg: false };
    }
  }, [
    contextIsAuthenticated,
    getCurrentUser,
    redirectTo,
    checkOrganizationAndRedirect,
    isPublicRoute,
  ]);

  useEffect(() => {
    if (authLoading) return;

    const performAuthCheck = async () => {
      const { isAuth, redirectPath, isOrg } = await checkAuthStatus();
      setIsAuthenticated(isAuth);
      setHasOrganization(isOrg);
      setIsInitializing(false);
      if (redirectPath && redirectPath !== router.pathname) {
        setIsRedirecting(true);
        if (!isAuth && redirectPath === redirectTo) {
          TokenManager.clearTokens();
        }
        await router.replace(redirectPath);
        setIsRedirecting(false);
      }
    };

    performAuthCheck();
    // no router in deps: replace is stable, avoids extra reruns
    // eslint-disable-next-line
  }, [authLoading, checkAuthStatus, redirectTo]);

  if (authLoading || isInitializing || isRedirecting) {
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

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isAuthenticated && hasOrganization) {
    return <AppProviders>{children}</AppProviders>;
  }

  if (isAuthenticated && !hasOrganization) {
    return <OrgProviders>{children}</OrgProviders>;
  }

  return null;
}
