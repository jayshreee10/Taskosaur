'use client';

import React from 'react';
import UserAvatar from '@/components/ui/avatars/UserAvatar';

interface TeamMember {
  userId: string;
  name: string;
  avatar: string;
  assignedTasks: number;
  completedTasks: number;
  capacity: number;
  utilizationRate: number;
}

interface WorkloadChartProps {
  teamWorkload: TeamMember[];
  averageUtilization: number;
}

export default function WorkloadChart({ teamWorkload, averageUtilization }: WorkloadChartProps) {
  const maxCapacity = Math.max(...teamWorkload.map(member => member.capacity));
  
  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 80) return 'bg-orange-500';
    if (rate >= 60) return 'bg-yellow-500';
    if (rate >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getUtilizationStatus = (rate: number) => {
    if (rate >= 95) return { text: 'Overloaded', color: 'text-red-600 dark:text-red-400' };
    if (rate >= 85) return { text: 'High Load', color: 'text-orange-600 dark:text-orange-400' };
    if (rate >= 65) return { text: 'Optimal', color: 'text-green-600 dark:text-green-400' };
    if (rate >= 40) return { text: 'Light Load', color: 'text-blue-600 dark:text-blue-400' };
    return { text: 'Underutilized', color: 'text-gray-600 dark:text-gray-400' };
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Team Workload
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Avg Utilization: {averageUtilization.toFixed(1)}%
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {teamWorkload.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Team Members
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {teamWorkload.reduce((sum, member) => sum + member.assignedTasks, 0)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Tasks
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {teamWorkload.reduce((sum, member) => sum + member.capacity, 0)}h
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Capacity
          </div>
        </div>
      </div>

      {/* Workload Bars */}
      <div className="space-y-4">
        {teamWorkload.map((member) => {
          const completionRate = (member.completedTasks / member.assignedTasks) * 100;
          const status = getUtilizationStatus(member.utilizationRate);
          
          return (
            <div key={member.userId} className="space-y-2">
              {/* Member Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    user={{
                      id: member.userId,
                      firstName: member.name.split(' ')[0],
                      lastName: member.name.split(' ')[1] || '',
                      avatar: member.avatar
                    }}
                    size="sm"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {member.assignedTasks} tasks • {member.capacity}h capacity
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${status.color}`}>
                    {status.text}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {member.utilizationRate.toFixed(1)}% utilized
                  </div>
                </div>
              </div>

              {/* Workload Bar */}
              <div className="space-y-2">
                {/* Capacity Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-300 ${getUtilizationColor(member.utilizationRate)}`}
                      style={{ width: `${Math.min(100, member.utilizationRate)}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {member.utilizationRate.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Task Completion Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {member.completedTasks} completed
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {completionRate.toFixed(1)}% done
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workload Distribution */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Workload Distribution
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Overloaded', color: 'bg-red-500', count: teamWorkload.filter(m => m.utilizationRate >= 90).length },
            { label: 'High Load', color: 'bg-orange-500', count: teamWorkload.filter(m => m.utilizationRate >= 80 && m.utilizationRate < 90).length },
            { label: 'Optimal', color: 'bg-green-500', count: teamWorkload.filter(m => m.utilizationRate >= 60 && m.utilizationRate < 80).length },
            { label: 'Light Load', color: 'bg-blue-500', count: teamWorkload.filter(m => m.utilizationRate < 60).length }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className={`w-8 h-8 ${item.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">{item.count}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Recommendations
        </h4>
        <div className="space-y-2">
          {teamWorkload.filter(m => m.utilizationRate >= 90).length > 0 && (
            <div className="flex items-start space-x-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Redistribute tasks:</span> {teamWorkload.filter(m => m.utilizationRate >= 90).map(m => m.name).join(', ')} are overloaded
              </div>
            </div>
          )}
          {teamWorkload.filter(m => m.utilizationRate < 60).length > 0 && (
            <div className="flex items-start space-x-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Assign more tasks:</span> {teamWorkload.filter(m => m.utilizationRate < 60).map(m => m.name).join(', ')} have available capacity
              </div>
            </div>
          )}
          {averageUtilization > 85 && (
            <div className="flex items-start space-x-2 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Consider hiring:</span> Team utilization is high at {averageUtilization.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}