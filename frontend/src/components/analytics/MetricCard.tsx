'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'gray';
  onClick?: () => void;
  className?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  onClick, 
  className = "" 
}: MetricCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-600 dark:text-blue-400',
      value: 'text-blue-900 dark:text-blue-100'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-600 dark:text-green-400',
      value: 'text-green-900 dark:text-green-100'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'bg-purple-100 dark:bg-purple-900/40',
      text: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-900 dark:text-purple-100'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-600 dark:text-red-400',
      value: 'text-red-900 dark:text-red-100'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'bg-orange-100 dark:bg-orange-900/40',
      text: 'text-orange-600 dark:text-orange-400',
      value: 'text-orange-900 dark:text-orange-100'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      icon: 'bg-gray-100 dark:bg-gray-900/40',
      text: 'text-gray-600 dark:text-gray-400',
      value: 'text-gray-900 dark:text-gray-100'
    }
  };

  const classes = colorClasses[color];

  return (
    <div 
      className={`${classes.bg} rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className={`text-2xl font-semibold ${classes.value} mt-1`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <p className={`text-xs ${classes.text} mt-1`}>
              {change}
            </p>
          )}
        </div>
        <div className={`${classes.icon} p-3 rounded-full`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}