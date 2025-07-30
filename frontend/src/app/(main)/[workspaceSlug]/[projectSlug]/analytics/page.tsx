'use client';

import { useParams } from 'next/navigation';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function ProjectAnalyticsPage() {
  const params = useParams();
  
  const workspaceSlug = params?.workspaceSlug as string;
  const projectSlug = params?.projectSlug as string;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Project Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Insights and metrics for {projectSlug} project
        </p>
      </div>
      
      <AnalyticsDashboard />
    </div>
  );
}