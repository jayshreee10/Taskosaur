'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasValidTokens } from '@/utils/authFetch';

interface AuthRedirectProps {
  children: React.ReactNode;
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
  const { getCurrentUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowAuthPage, setShouldShowAuthPage] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if we have valid tokens
        const hasTokens = hasValidTokens();
        
        // Check if we have user data
        const currentUser = getCurrentUser();
        
        const isAuthenticated = hasTokens && currentUser;
        
        if (isAuthenticated) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard');
          setShouldShowAuthPage(false);
        } else {
          // User is not authenticated, show auth page
          setShouldShowAuthPage(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, assume not authenticated and show auth page
        setShouldShowAuthPage(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [getCurrentUser, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render auth pages if user is authenticated (they will be redirected)
  if (!shouldShowAuthPage) {
    return null;
  }

  // Render auth pages for unauthenticated users
  return <>{children}</>;
}