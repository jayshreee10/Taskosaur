import ProtectedRoute from '@/components/auth/ProtectedRoute';
import OrganizationProvider from '@/contexts/organization-context';
import WorkspaceProvider from '@/contexts/workspace-context';
import ProjectProvider from '@/contexts/project-context';
import SprintProvider from '@/contexts/sprint-context';
import TaskProvider from '@/contexts/task-context';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import { Button } from '@/components/ui';
function TimeTrackingPageContent() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'reports'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getAllTimeEntries = () => {
    return []
  };

  const getTimeStats = () => {
    const allEntries = getAllTimeEntries();
    const filteredEntries = allEntries.filter((entry: any) => {
      const entryDate = new Date(entry.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const totalTime = filteredEntries.reduce((sum: number, entry: any) => sum + entry.timeSpent, 0);
    const totalEntries = filteredEntries.length;
    const uniqueUsers = new Set(filteredEntries.map((entry: any) => entry.userId)).size;
    const uniqueTasks = new Set(filteredEntries.map((entry: any) => entry.taskId)).size;

    return {
      totalTime,
      totalEntries,
      uniqueUsers,
      uniqueTasks,
      entries: filteredEntries
    };
  };

  const getUserTimeStats = () => {
    const stats = getTimeStats();
    const userStats = new Map();

    stats.entries.forEach((entry: any) => {
      if (!userStats.has(entry.userId)) {
        userStats.set(entry.userId, {
          user: entry.user,
          totalTime: 0,
          entries: 0,
          tasks: new Set()
        });
      }
      
      const userStat = userStats.get(entry.userId);
      userStat.totalTime += entry.timeSpent;
      userStat.entries += 1;
      userStat.tasks.add(entry.taskId);
    });

    return Array.from(userStats.values()).map((stat: any) => ({
      ...stat,
      taskCount: stat.tasks.size
    }));
  };

  const getTaskTimeStats = () => {
    const stats = getTimeStats();
    const taskStats = new Map();

    stats.entries.forEach((entry: any) => {
      if (!taskStats.has(entry.taskId)) {
        taskStats.set(entry.taskId, {
          task: entry.task,
          totalTime: 0,
          entries: 0,
          users: new Set()
        });
      }
      
      const taskStat = taskStats.get(entry.taskId);
      taskStat.totalTime += entry.timeSpent;
      taskStat.entries += 1;
      taskStat.users.add(entry.userId);
    });

    return Array.from(taskStats.values()).map((stat: any) => ({
      ...stat,
      userCount: stat.users.size
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const stats = getTimeStats();
  const userStats = getUserTimeStats();
  const taskStats = getTaskTimeStats();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Time Tracking
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track and analyze time spent on project tasks
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatTime(stats.totalTime)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Time Logged
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalEntries}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Time Entries
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.uniqueUsers}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Active Users
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.uniqueTasks}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tasks Worked On
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'entries', label: 'Time Entries', icon: '📝' },
            { id: 'reports', label: 'Reports', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time by User */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Time by User
              </h3>
              <div className="space-y-3">
                {userStats.map((user: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserAvatar user={user.user} size="sm" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.user.firstName} {user.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.entries} entries • {user.taskCount} tasks
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatTime(user.totalTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time by Task */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Time by Task
              </h3>
              <div className="space-y-3">
                {taskStats.slice(0, 10).map((task: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {task.task.key}: {task.task.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {task.entries} entries • {task.userCount} users
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatTime(task.totalTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Time Entries
              </h3>
              <div className="space-y-3">
                {stats.entries.slice(0, 20).map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserAvatar user={entry.user} size="sm" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {entry.task.key}: {entry.task.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {entry.user.firstName} {entry.user.lastName} • {new Date(entry.date).toLocaleDateString()}
                        </div>
                        {entry.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {entry.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatTime(entry.timeSpent)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Time Reports
              </h3>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h4 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  Detailed Reports
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Advanced reporting features will be available here including charts, exports, and detailed analytics.
                </p>
                <div className="mt-6">
                  <Button variant="outline">
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimeTrackingPage() {
  return (
    <ProtectedRoute>
      <OrganizationProvider>
        <WorkspaceProvider>
          <ProjectProvider>
            <SprintProvider>
              <TaskProvider>
                <div className="min-h-screen bg-[var(--background)]">
                  <div className="flex h-screen">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header />
                      <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                          <Breadcrumb />
                          <TimeTrackingPageContent />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Toaster />
                </div>
              </TaskProvider>
            </SprintProvider>
          </ProjectProvider>
        </WorkspaceProvider>
      </OrganizationProvider>
    </ProtectedRoute>
  );
}