'use client';

import React from 'react';

interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
  completed: number;
}

interface SprintProgress {
  planned: number;
  completed: number;
  remaining: number;
}

interface SprintBurndownChartProps {
  burndownData: BurndownData[];
  sprintProgress: SprintProgress;
}

export default function SprintBurndownChart({ 
  burndownData, 
  sprintProgress 
}: SprintBurndownChartProps) {
  const maxValue = Math.max(...burndownData.map(d => Math.max(d.ideal, d.actual)));
  const chartHeight = 200;
  const chartWidth = 400;

  const getYPosition = (value: number) => {
    return chartHeight - (value / maxValue) * chartHeight;
  };

  const getXPosition = (index: number) => {
    return (index / (burndownData.length - 1)) * chartWidth;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const createPath = (data: number[]) => {
    return data
      .map((value, index) => {
        const x = getXPosition(index);
        const y = getYPosition(value);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const idealPath = createPath(burndownData.map(d => d.ideal));
  const actualPath = createPath(burndownData.map(d => d.actual));

  const completionRate = (sprintProgress.completed / sprintProgress.planned) * 100;
  const isOnTrack = burndownData.length > 0 && 
    burndownData[burndownData.length - 1].actual <= burndownData[burndownData.length - 1].ideal;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sprint Burndown
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-gray-400"></div>
            <span className="text-xs text-gray-500">Ideal</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-xs text-gray-500">Actual</span>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sprint Progress</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {completionRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              completionRate >= 100 ? 'bg-green-500' : 
              completionRate >= 75 ? 'bg-blue-500' : 
              completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Completed: {sprintProgress.completed}</span>
          <span>Planned: {sprintProgress.planned}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          width="100%"
          height="250"
          viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
          className="border border-gray-200 dark:border-gray-700 rounded"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percentage => {
            const y = getYPosition((percentage / 100) * maxValue);
            return (
              <g key={percentage}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x="-5"
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {((percentage / 100) * maxValue).toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Ideal line */}
          <path
            d={idealPath}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Actual line */}
          <path
            d={actualPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
          />

          {/* Data points */}
          {burndownData.map((point, index) => (
            <g key={index}>
              {/* Ideal point */}
              <circle
                cx={getXPosition(index)}
                cy={getYPosition(point.ideal)}
                r="3"
                fill="#9ca3af"
              />
              {/* Actual point */}
              <circle
                cx={getXPosition(index)}
                cy={getYPosition(point.actual)}
                r="4"
                fill="#3b82f6"
              />
            </g>
          ))}

          {/* X-axis labels */}
          {burndownData.map((point, index) => {
            if (index % 2 === 0) { // Show every other label to avoid crowding
              return (
                <text
                  key={index}
                  x={getXPosition(index)}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {formatDate(point.date)}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center justify-between">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
          isOnTrack 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isOnTrack ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium">
            {isOnTrack ? 'On Track' : 'Behind Schedule'}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {sprintProgress.remaining} tasks remaining
        </div>
      </div>

      {/* Latest Data Points */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {burndownData[burndownData.length - 1]?.ideal || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Ideal Remaining
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {burndownData[burndownData.length - 1]?.actual || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Actual Remaining
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {burndownData[burndownData.length - 1]?.completed || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Completed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}