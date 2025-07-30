'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HiExclamation } from 'react-icons/hi';

interface ProjectDetailErrorProps {
  error: string;
  workspaceSlug: string;
  projectSlug: string;
}

export const ProjectDetailError: React.FC<ProjectDetailErrorProps> = ({
  error,
  workspaceSlug,
  projectSlug,
}) => {
  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)]-dark">
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="flex items-start gap-3 pb-0">
            <HiExclamation className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                {error === 'Project not found' ? 'Project Not Found' : 'Error Loading Project'}
              </CardTitle>
              <CardDescription className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error === 'Project not found' 
                  ? `The project "${projectSlug}" does not exist in workspace "${workspaceSlug}".`
                  : error || 'An unexpected error occurred while loading the project.'
                }
              </CardDescription>
              <Link href={`/${workspaceSlug}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Return to Workspace
              </Link>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};
