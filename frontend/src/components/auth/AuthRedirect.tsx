'use client';

import { useAuth } from '@/contexts/auth-context';
import { TokenManager } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string; // Allow custom redirect destination
  requireAuth?: boolean; // Allow pages that don't require auth
}

export default function AuthRedirect({ 
  children, 
  redirectTo = '/dashboard',
  requireAuth = true 
}: AuthRedirectProps) {
  const { getCurrentUser, isAuthenticated: contextIsAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowChildren, setShouldShowChildren] = useState(false);

  const checkAuthStatus = useCallback(() => {
    try {
      // Use the context's isAuthenticated method which is more reliable
      const isAuth = contextIsAuthenticated();
      
      // Double-check with tokens and user data
      const hasTokens = !!TokenManager.getAccessToken();
      const currentUser = getCurrentUser();
      
      const isFullyAuthenticated = isAuth && hasTokens && currentUser;
      
      return isFullyAuthenticated;
    } catch (error) {
      console.error('Auth status check error:', error);
      return false;
    }
  }, [contextIsAuthenticated, getCurrentUser]);

  useEffect(() => {
    // Don't check auth while the auth context is still loading
    if (authLoading) {
      return;
    }

    const performAuthCheck = async () => {
      try {
        const isAuthenticated = checkAuthStatus();
        
        if (requireAuth) {
          if (isAuthenticated) {
            
            router.push(redirectTo);
            setShouldShowChildren(false);
          } else {
            // User is not authenticated but page requires auth - show auth page
            console.log('User not authenticated, showing auth page');
            setShouldShowChildren(true);
          }
        } else {
          // Page doesn't require auth - always show content
          setShouldShowChildren(true);
        }
      } catch (error) {
        console.error('Auth redirect error:', error);
        // On error, show auth page if auth is required, otherwise show content
        setShouldShowChildren(!requireAuth);
      } finally {
        setIsLoading(false);
      }
    };

    performAuthCheck();
  }, [authLoading, checkAuthStatus, requireAuth, redirectTo, router]);

  // Show loading spinner while checking authentication
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--border)] border-t-[var(--primary)]"></div>
          <p className="text-sm text-[var(--muted-foreground)]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if we're redirecting authenticated users
  if (!shouldShowChildren) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--border)] border-t-[var(--primary)]"></div>
          <p className="text-sm text-[var(--muted-foreground)]">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render children (auth pages for unauthenticated users or any content for non-auth pages)
  return <>{children}</>;
}
