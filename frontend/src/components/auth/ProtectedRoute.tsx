'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasValidTokens } from '@/utils/authFetch';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { getCurrentUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if we have valid tokens
        const hasTokens = hasValidTokens();
        
        // Check if we have user data
        const currentUser = getCurrentUser();
        
        const authenticated = hasTokens && currentUser;
        
        setIsAuthenticated(!!authenticated);
        
        if (!authenticated) {
          // Redirect to login page
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        router.push('/login');
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

  // Don't render children if not authenticated (user will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}