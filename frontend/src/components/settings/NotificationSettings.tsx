'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export default function NotificationSettings() {

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'task-assigned',
      title: 'Task Assigned',
      description: 'When a task is assigned to you',
      email: true,
      push: true,
      inApp: true
    },
    {
      id: 'task-completed',
      title: 'Task Completed',
      description: 'When a task you created is completed',
      email: true,
      push: false,
      inApp: true
    },
    {
      id: 'task-commented',
      title: 'Task Comments',
      description: 'When someone comments on your task',
      email: false,
      push: true,
      inApp: true
    },
    {
      id: 'task-due',
      title: 'Due Date Reminders',
      description: 'Reminders for upcoming due dates',
      email: true,
      push: true,
      inApp: true
    },
    {
      id: 'task-overdue',
      title: 'Overdue Tasks',
      description: 'When tasks become overdue',
      email: true,
      push: true,
      inApp: true
    },
    {
      id: 'mention',
      title: 'Mentions',
      description: 'When you are mentioned in comments',
      email: true,
      push: true,
      inApp: true
    },
    {
      id: 'sprint-started',
      title: 'Sprint Started',
      description: 'When a new sprint begins',
      email: true,
      push: false,
      inApp: true
    },
    {
      id: 'sprint-completed',
      title: 'Sprint Completed',
      description: 'When a sprint is completed',
      email: true,
      push: false,
      inApp: true
    },
    {
      id: 'project-updates',
      title: 'Project Updates',
      description: 'Important project announcements',
      email: true,
      push: false,
      inApp: true
    },
    {
      id: 'team-updates',
      title: 'Team Updates',
      description: 'Updates from your team members',
      email: false,
      push: false,
      inApp: true
    },
    {
      id: 'system-maintenance',
      title: 'System Maintenance',
      description: 'Scheduled maintenance notifications',
      email: true,
      push: false,
      inApp: true
    },
    {
      id: 'security-alerts',
      title: 'Security Alerts',
      description: 'Important security notifications',
      email: true,
      push: true,
      inApp: true
    }
  ]);

  const [emailSettings, setEmailSettings] = useState({
    frequency: 'immediate',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    },
    weekends: false,
    summary: {
      enabled: true,
      frequency: 'daily'
    }
  });

  const handleSettingChange = (id: string, type: 'email' | 'push' | 'inApp', value: boolean) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id 
        ? { ...setting, [type]: value }
        : setting
    ));
  };

  const handleEmailSettingChange = (field: string, value: any) => {
    setEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // In real app, this would save to backend
    console.log('Saving notification settings:', { settings, emailSettings });
  };

  const handleTestNotification = () => {
    // Send test notification
    console.log('Sending test notification...');
  };

  const categories = [
    {
      id: 'tasks',
      title: 'Tasks & Work',
      description: 'Notifications about task assignments, completions, and updates',
      settings: settings.filter(s => s.id.startsWith('task-'))
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      description: 'Notifications about mentions, comments, and team activities',
      settings: settings.filter(s => ['mention', 'task-commented', 'team-updates'].includes(s.id))
    },
    {
      id: 'project',
      title: 'Project & Sprint',
      description: 'Notifications about project and sprint activities',
      settings: settings.filter(s => s.id.startsWith('sprint-') || s.id.startsWith('project-'))
    },
    {
      id: 'system',
      title: 'System & Security',
      description: 'System maintenance and security notifications',
      settings: settings.filter(s => ['system-maintenance', 'security-alerts'].includes(s.id))
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Notification Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage how and when you receive notifications
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleTestNotification}>
            Send Test
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Email Settings */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Email Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Frequency
              </label>
              <select
                value={emailSettings.frequency}
                onChange={(e) => handleEmailSettingChange('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Daily Summary
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailSettings.summary.enabled}
                    onChange={(e) => handleEmailSettingChange('summary', {
                      ...emailSettings.summary,
                      enabled: e.target.checked
                    })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Send daily summary
                  </span>
                </label>
                {emailSettings.summary.enabled && (
                  <select
                    value={emailSettings.summary.frequency}
                    onChange={(e) => handleEmailSettingChange('summary', {
                      ...emailSettings.summary,
                      frequency: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quiet Hours
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailSettings.quietHours.enabled}
                    onChange={(e) => handleEmailSettingChange('quietHours', {
                      ...emailSettings.quietHours,
                      enabled: e.target.checked
                    })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enable quiet hours
                  </span>
                </label>
                {emailSettings.quietHours.enabled && (
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      value={emailSettings.quietHours.start}
                      onChange={(e) => handleEmailSettingChange('quietHours', {
                        ...emailSettings.quietHours,
                        start: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 py-2">to</span>
                    <input
                      type="time"
                      value={emailSettings.quietHours.end}
                      onChange={(e) => handleEmailSettingChange('quietHours', {
                        ...emailSettings.quietHours,
                        end: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.weekends}
                  onChange={(e) => handleEmailSettingChange('weekends', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Send notifications on weekends
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Categories */}
        {categories.map((category) => (
          <div key={category.id}>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {category.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Header */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Notification Type
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Email
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Push
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        In-App
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                {category.settings.map((setting) => (
                  <div key={setting.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {setting.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {setting.description}
                        </div>
                      </div>
                      <div className="flex items-center space-x-8">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={setting.email}
                            onChange={(e) => handleSettingChange(setting.id, 'email', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={setting.push}
                            onChange={(e) => handleSettingChange(setting.id, 'push', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={setting.inApp}
                            onChange={(e) => handleSettingChange(setting.id, 'inApp', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setSettings(prev => prev.map(s => ({ ...s, email: false, push: false })));
              }}
            >
              Disable All
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setSettings(prev => prev.map(s => ({ ...s, email: true, push: false, inApp: true })));
              }}
            >
              Email Only
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSettings(prev => prev.map(s => ({ ...s, email: false, push: true, inApp: true })));
              }}
            >
              Push Only
            </Button>
            <Button
              onClick={() => {
                setSettings(prev => prev.map(s => ({ ...s, email: true, push: true, inApp: true })));
              }}
            >
              Enable All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}