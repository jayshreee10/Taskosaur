'use client';
import React from 'react';
import Link from 'next/link';

interface ViewTab {
  name: string;
  key: string;
  icon: React.ReactNode;
  href: string;
}

interface ViewTabsProps {
  tabs: ViewTab[];
  currentView: string;
  variant?: 'cards' | 'bordered';
  className?: string;
}

const ViewTabs: React.FC<ViewTabsProps> = ({ 
  tabs, 
  currentView, 
  variant = 'bordered',
  className = '' 
}) => {
  const baseClasses = variant === 'cards' 
    ? 'flex gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg'
    : 'flex border-b border-stone-200 dark:border-stone-700';

  const tabClasses = variant === 'cards'
    ? 'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors'
    : 'flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors';

  const activeClasses = variant === 'cards'
    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
    : 'border-amber-500 text-amber-600 dark:text-amber-400';

  const inactiveClasses = variant === 'cards'
    ? 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600';

  return (
    <div className={`${baseClasses} ${className}`}>
      {tabs.map((tab) => {
        const isActive = currentView === tab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`${tabClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default ViewTabs;
