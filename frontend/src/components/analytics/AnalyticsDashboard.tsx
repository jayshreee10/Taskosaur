'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskType, TaskPriority, Sprint } from '@/types/tasks';
import { Button } from '@/components/ui';
import MetricCard from './MetricCard';
import TaskDistributionChart from './TaskDistributionChart';
import SprintBurndownChart from './SprintBurndownChart';
import TeamVelocityChart from './TeamVelocityChart';
import WorkloadChart from './WorkloadChart';

interface AnalyticsDashboardProps {
  projectId?: string;
  sprintId?: string;
}

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  averageCompletionTime: number;
  teamVelocity: number;
  bugCount: number;
  storyCount: number;
  tasksByType: Record<TaskType, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByStatus: Record<string, number>;
  sprintProgress: {
    planned: number;
    completed: number;
    remaining: number;
  };
  teamWorkload: Array<{
    userId: string;
    name: string;
    avatar: string;
    assignedTasks: number;
    completedTasks: number;
    capacity: number;
    utilizationRate: number;
  }>;
  burndownData: Array<{
    date: string;
    ideal: number;
    actual: number;
    completed: number;
  }>;
  velocityData: Array<{
    sprint: string;
    planned: number;
    completed: number;
    velocity: number;
  }>;
}

export default function AnalyticsDashboard({ projectId, sprintId }: AnalyticsDashboardProps) {
  const cyrrentOrganization = localStorage.getItem('currentOrganizationId');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'tasks', 'velocity', 'burndown', 'workload'
  ]);

  // Mock analytics data
  const mockData: AnalyticsData = {
    totalTasks: 147,
    completedTasks: 89,
    overdueTasks: 12,
    inProgressTasks: 23,
    averageCompletionTime: 3.2,
    teamVelocity: 32,
    bugCount: 18,
    storyCount: 45,
    tasksByType: {
      [TaskType.TASK]: 65,
      [TaskType.BUG]: 18,
      [TaskType.STORY]: 45,
      [TaskType.EPIC]: 8,
      [TaskType.SUBTASK]: 11
    },
    tasksByPriority: {
      [TaskPriority.HIGHEST]: 5,
      [TaskPriority.HIGH]: 23,
      [TaskPriority.MEDIUM]: 67,
      [TaskPriority.LOW]: 38,
      [TaskPriority.LOWEST]: 14
    },
    tasksByStatus: {
      'To Do': 23,
      'In Progress': 34,
      'Review': 18,
      'Testing': 12,
      'Done': 60
    },
    sprintProgress: {
      planned: 55,
      completed: 42,
      remaining: 13
    },
    teamWorkload: [
      {
        userId: 'user-1',
        name: 'John Doe',
        avatar: '/api/placeholder/40/40',
        assignedTasks: 15,
        completedTasks: 12,
        capacity: 40,
        utilizationRate: 85
      },
      {
        userId: 'user-2',
        name: 'Jane Smith',
        avatar: '/api/placeholder/40/40',
        assignedTasks: 18,
        completedTasks: 14,
        capacity: 40,
        utilizationRate: 92
      },
      {
        userId: 'user-3',
        name: 'Alice Johnson',
        avatar: '/api/placeholder/40/40',
        assignedTasks: 12,
        completedTasks: 10,
        capacity: 35,
        utilizationRate: 76
      }
    ],
    burndownData: [
      { date: '2024-01-01', ideal: 100, actual: 100, completed: 0 },
      { date: '2024-01-02', ideal: 95, actual: 98, completed: 2 },
      { date: '2024-01-03', ideal: 90, actual: 94, completed: 6 },
      { date: '2024-01-04', ideal: 85, actual: 88, completed: 12 },
      { date: '2024-01-05', ideal: 80, actual: 82, completed: 18 },
      { date: '2024-01-06', ideal: 75, actual: 78, completed: 22 },
      { date: '2024-01-07', ideal: 70, actual: 72, completed: 28 },
      { date: '2024-01-08', ideal: 65, actual: 68, completed: 32 },
      { date: '2024-01-09', ideal: 60, actual: 62, completed: 38 },
      { date: '2024-01-10', ideal: 55, actual: 58, completed: 42 }
    ],
    velocityData: [
      { sprint: 'Sprint 1', planned: 45, completed: 42, velocity: 28 },
      { sprint: 'Sprint 2', planned: 52, completed: 48, velocity: 32 },
      { sprint: 'Sprint 3', planned: 38, completed: 35, velocity: 24 },
      { sprint: 'Sprint 4', planned: 55, completed: 52, velocity: 35 },
      { sprint: 'Sprint 5', planned: 48, completed: 45, velocity: 30 }
    ]
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(mockData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [projectId, sprintId, dateRange]);

  const handleExportData = () => {
    // Export analytics data as CSV/PDF
    console.log('Exporting analytics data...');
    // In real app, this would generate and download the report
  };

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const calculateTrends = () => {
    if (!data) return null;
    
    const completionRate = (data.completedTasks / data.totalTasks) * 100;
    const overdueRate = (data.overdueTasks / data.totalTasks) * 100;
    const averageUtilization = data.teamWorkload.reduce((sum, member) => 
      sum + member.utilizationRate, 0) / data.teamWorkload.length;

    return {
      completionRate,
      overdueRate,
      averageUtilization,
      velocityTrend: data.velocityData.length > 1 ? 
        ((data.velocityData[data.velocityData.length - 1].velocity - 
          data.velocityData[data.velocityData.length - 2].velocity) / 
          data.velocityData[data.velocityData.length - 2].velocity) * 100 : 0
    };
  };

  const trends = calculateTrends();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Analytics Data Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          There's not enough data to generate analytics reports yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {sprintId ? 'Sprint Performance' : 'Project Overview'} • Last {dateRange}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={handleExportData}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tasks"
          value={data.totalTasks}
          change={trends ? `${trends.completionRate.toFixed(1)}% complete` : ''}
          icon="📋"
          color="blue"
        />
        <MetricCard
          title="Completed Tasks"
          value={data.completedTasks}
          change={trends ? `${(trends.completionRate - 100).toFixed(1)}% trend` : ''}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Team Velocity"
          value={data.teamVelocity}
          change={trends ? `${trends.velocityTrend.toFixed(1)}% vs last sprint` : ''}
          icon="⚡"
          color="purple"
        />
        <MetricCard
          title="Overdue Tasks"
          value={data.overdueTasks}
          change={trends ? `${trends.overdueRate.toFixed(1)}% of total` : ''}
          icon="⏰"
          color="red"
        />
      </div>

      {/* Chart Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dashboard Widgets
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
            {[
              { id: 'tasks', label: 'Task Distribution' },
              { id: 'velocity', label: 'Velocity' },
              { id: 'burndown', label: 'Burndown' },
              { id: 'workload', label: 'Workload' }
            ].map(metric => (
              <button
                key={metric.id}
                onClick={() => handleMetricToggle(metric.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedMetrics.includes(metric.id)
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        {selectedMetrics.includes('tasks') && (
          <TaskDistributionChart
            tasksByType={data.tasksByType}
            tasksByPriority={data.tasksByPriority}
            tasksByStatus={data.tasksByStatus}
          />
        )}

        {/* Team Velocity */}
        {selectedMetrics.includes('velocity') && (
          <TeamVelocityChart
            velocityData={data.velocityData}
          />
        )}

        {/* Sprint Burndown */}
        {selectedMetrics.includes('burndown') && (
          <SprintBurndownChart
            burndownData={data.burndownData}
            sprintProgress={data.sprintProgress}
          />
        )}

        {/* Team Workload */}
        {selectedMetrics.includes('workload') && (
          <WorkloadChart
            teamWorkload={data.teamWorkload}
            averageUtilization={trends?.averageUtilization || 0}
          />
        )}
      </div>

      {/* Insights */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📈 Performance Trend
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {trends && trends.velocityTrend > 0 
                ? `Team velocity increased by ${trends.velocityTrend.toFixed(1)}% compared to last sprint`
                : `Team velocity needs improvement - consider adjusting sprint planning`
              }
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
              ✅ Completion Rate
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              {trends && trends.completionRate > 75 
                ? `Great job! ${trends.completionRate.toFixed(1)}% of tasks completed on time`
                : `${trends?.completionRate.toFixed(1)}% completion rate - consider reviewing task complexity`
              }
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
              👥 Team Utilization
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {trends && trends.averageUtilization > 80
                ? `Team is highly utilized at ${trends.averageUtilization.toFixed(1)}% capacity`
                : `Team utilization is ${trends?.averageUtilization.toFixed(1)}% - consider optimizing workload distribution`
              }
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
              ⚠️ Risk Factors
            </h4>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              {data.overdueTasks > 0 
                ? `${data.overdueTasks} overdue tasks need immediate attention`
                : `No overdue tasks - team is on track`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Task Types</h4>
            <div className="space-y-2">
              {Object.entries(data.tasksByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{type}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Priority Distribution</h4>
            <div className="space-y-2">
              {Object.entries(data.tasksByPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{priority}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-foreground mb-3">Status Distribution</h4>
            <div className="space-y-2">
              {Object.entries(data.tasksByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{status}</span>
                  <span className="text-sm font-medium text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}