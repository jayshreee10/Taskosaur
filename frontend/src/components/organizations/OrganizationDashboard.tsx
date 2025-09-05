import { Organization, OrganizationStats, OrganizationActivity } from '@/types';
import { StatCard } from '@/components/ui';
import Image from 'next/image'

interface OrganizationDashboardProps {
  organization: Organization;
  stats: OrganizationStats;
  activities: OrganizationActivity[];
}

export default function OrganizationDashboard({ 
  organization, 
  stats, 
  activities 
}: OrganizationDashboardProps) {
  const statsData = [
    {
      name: 'Total Members',
      value: stats.totalMembers.toString(),
    },
    {
      name: 'Workspaces',
      value: stats.totalWorkspaces.toString(),
    },
    {
      name: 'Projects',
      value: stats.totalProjects.toString(),
    },
    {
      name: 'Completion Rate',
      value: `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`,
    },
  ];

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {organization.avatar ? (
              <Image
                src={organization.avatar}
                alt={organization.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-2xl">
                  {organization.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {organization.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {organization.slug}
              </p>
              {organization.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {organization.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
              Edit
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <StatCard 
            key={stat.name} 
            title={stat.name}
            value={stat.value}
            icon={<div className="w-4 h-4 bg-amber-500 rounded" />}
          />
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                {/* TODO: Replace with migrated UserAvatar component */}
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-amber-700">
                    {activity.user.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatActivityTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Stats
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active Members
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.activeMembers}/{stats.totalMembers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Tasks This Week
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.tasksThisWeek}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Projects This Month
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.projectsThisMonth}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Completion Rate
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}