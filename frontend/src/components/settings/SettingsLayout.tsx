'use client';

import React, { useState, useEffect } from 'react';

interface Organization {
  id: string;
  name: string;
  plan?: string;
}

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function SettingsLayout({ 
  children, 
  activeSection, 
  onSectionChange 
}: SettingsLayoutProps) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const getOrganizationData = () => {
      try {
        const orgId = localStorage.getItem('currentOrganizationId');
        const currentOrg = localStorage.getItem('currentOrganizationId');
        
        if (currentOrg) {
          try {
            const parsedOrg = JSON.parse(currentOrg);
            setCurrentOrganization({
              id: parsedOrg.id,
              name: parsedOrg.name,
              plan: parsedOrg.plan || 'Free'
            });
          } catch {
            if (orgId) {
              setCurrentOrganization({
                id: orgId,
                name: 'Selected Organization',
                plan: 'Free'
              });
            }
          }
        } else if (orgId) {
          setCurrentOrganization({
            id: orgId,
            name: 'Selected Organization',
            plan: 'Free'
          });
        }
      } catch (error) {
        console.error('Error getting organization from localStorage:', error);
      }
    };

    getOrganizationData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentOrganizationId' || e.key === 'currentOrganization') {
        getOrganizationData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile',
      icon: '👤',
      description: 'Personal information and preferences'
    },
    {
      id: 'account',
      title: 'Account',
      icon: '⚙️',
      description: 'Account settings and security'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      description: 'Email and push notification preferences'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: '🎨',
      description: 'Theme and display preferences'
    },
    {
      id: 'organization',
      title: 'Organization',
      icon: '🏢',
      description: 'Organization settings and members'
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: '📁',
      description: 'Project configuration and defaults'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: '🔌',
      description: 'Third-party integrations and APIs'
    },
    {
      id: 'security',
      title: 'Security',
      icon: '🔒',
      description: 'Security and privacy settings'
    },
    {
      id: 'billing',
      title: 'Billing',
      icon: '💳',
      description: 'Subscription and billing information'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      icon: '⚡',
      description: 'Advanced configuration options'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account, organization, and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{section.icon}</span>
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {section.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Organization Context */}
            {currentOrganization && (
              <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Current Organization
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {currentOrganization.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentOrganization.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {currentOrganization.plan} Plan
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}