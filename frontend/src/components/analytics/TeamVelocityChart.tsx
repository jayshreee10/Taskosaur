'use client';

import React from 'react';

interface VelocityData {
  sprint: string;
  planned: number;
  completed: number;
  velocity: number;
}

interface TeamVelocityChartProps {
  velocityData: VelocityData[];
}

export default function TeamVelocityChart({ velocityData }: TeamVelocityChartProps) {
  const maxValue = Math.max(...velocityData.map(d => Math.max(d.planned, d.completed, d.velocity)));
  const barWidth = 40;
  const barSpacing = 60;
  const chartHeight = 200;
  const chartWidth = velocityData.length * barSpacing + barWidth;

  const getBarHeight = (value: number) => {
    return (value / maxValue) * chartHeight;
  };

  const averageVelocity = velocityData.reduce((sum, d) => sum + d.velocity, 0) / velocityData.length;
  const latestVelocity = velocityData[velocityData.length - 1]?.velocity || 0;
  const velocityTrend = velocityData.length > 1 ? 
    ((latestVelocity - velocityData[velocityData.length - 2].velocity) / velocityData[velocityData.length - 2].velocity) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Team Velocity
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-500">Planned</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-orange-500"></div>
            <span className="text-xs text-gray-500">Velocity</span>
          </div>
        </div>
      </div>

      {/* Velocity Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {latestVelocity.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current Velocity
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {averageVelocity.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Average Velocity
          </div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            velocityTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {velocityTrend >= 0 ? '+' : ''}{velocityTrend.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Trend
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight + 50}
          viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
          className="border border-gray-200 dark:border-gray-700 rounded"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percentage => {
            const y = chartHeight - (percentage / 100) * chartHeight;
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

          {/* Bars and velocity line */}
          {velocityData.map((data, index) => {
            const x = index * barSpacing + barWidth / 2;
            const plannedHeight = getBarHeight(data.planned);
            const completedHeight = getBarHeight(data.completed);
            const velocityY = chartHeight - getBarHeight(data.velocity);

            return (
              <g key={index}>
                {/* Planned bar */}
                <rect
                  x={x - barWidth / 4}
                  y={chartHeight - plannedHeight}
                  width={barWidth / 2}
                  height={plannedHeight}
                  fill="#3b82f6"
                  opacity="0.7"
                />

                {/* Completed bar */}
                <rect
                  x={x + barWidth / 4}
                  y={chartHeight - completedHeight}
                  width={barWidth / 2}
                  height={completedHeight}
                  fill="#10b981"
                  opacity="0.8"
                />

                {/* Velocity point */}
                <circle
                  cx={x}
                  cy={velocityY}
                  r="4"
                  fill="#f59e0b"
                />

                {/* Velocity line to next point */}
                {index < velocityData.length - 1 && (
                  <line
                    x1={x}
                    y1={velocityY}
                    x2={(index + 1) * barSpacing + barWidth / 2}
                    y2={chartHeight - getBarHeight(velocityData[index + 1].velocity)}
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                )}

                {/* Sprint label */}
                <text
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {data.sprint}
                </text>

                {/* Values on bars */}
                <text
                  x={x - barWidth / 4}
                  y={chartHeight - plannedHeight - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#3b82f6"
                >
                  {data.planned}
                </text>
                <text
                  x={x + barWidth / 4}
                  y={chartHeight - completedHeight - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#10b981"
                >
                  {data.completed}
                </text>
                <text
                  x={x}
                  y={velocityY - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#f59e0b"
                >
                  {data.velocity}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detailed Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Sprint Performance
            </h4>
            <div className="space-y-1">
              {velocityData.slice(-3).map((data, index) => {
                const completionRate = (data.completed / data.planned) * 100;
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{data.sprint}</span>
                    <span className={`font-medium ${
                      completionRate >= 100 ? 'text-green-600 dark:text-green-400' :
                      completionRate >= 80 ? 'text-blue-600 dark:text-blue-400' :
                      'text-orange-600 dark:text-orange-400'
                    }`}>
                      {completionRate.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Velocity Insights
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Best Sprint</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {velocityData.reduce((best, current) => 
                    current.velocity > best.velocity ? current : best
                  ).sprint}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Consistency</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {velocityData.length > 1 ? 
                    (100 - (Math.abs(velocityTrend) / 2)).toFixed(1) : '100.0'
                  }%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Improvement</span>
                <span className={`font-medium ${
                  velocityTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {velocityTrend >= 0 ? 'Increasing' : 'Decreasing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}