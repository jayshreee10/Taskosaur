'use client';

import { useParams } from 'next/navigation';
import { useRef, useEffect } from 'react';

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function WorkspaceAnalyticsPage() {
  const params = useParams();
  
  // Prevent multiple simultaneous API calls
  const fetchingRef = useRef(false);
  const currentSlugRef = useRef<string>('');
  
  const currentOrganization = localStorage.getItem('currentOrganizationId');
  const workspaceSlug = params?.workspaceSlug as string;

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      fetchingRef.current = false;
      currentSlugRef.current = '';
    };
  }, []);

  if (!currentOrganization) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Workspace Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Insights and metrics for {workspaceSlug} workspace
        </p>
      </div>
      
      <AnalyticsDashboard />
    </div>
  );
}