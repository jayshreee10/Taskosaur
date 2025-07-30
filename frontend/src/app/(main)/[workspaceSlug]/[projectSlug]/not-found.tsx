import Link from 'next/link';

export default function ProjectNotFound() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-red-700 dark:text-red-300 mb-2">Project Not Found</h1>
        <p className="text-red-600 dark:text-red-400 mb-4">
          The project you are looking for doesn't exist or has been deleted.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Go to Dashboard
          </Link>
          <Link href="/workspaces" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            View All Workspaces
          </Link>
        </div>
      </div>
    </div>
  );
}