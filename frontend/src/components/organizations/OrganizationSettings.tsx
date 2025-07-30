'use client';

import { useState } from 'react';
import { Organization, OrganizationSettings } from '@/types';
import { updateOrganization } from '@/utils/apiUtils';
import { Button } from '@/components/ui';

interface OrganizationSettingsProps {
  organization: Organization;
  onUpdate: (organization: Organization) => void;
}

export default function OrganizationSettingsComponent({ 
  organization, 
  onUpdate 
}: OrganizationSettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<OrganizationSettings>({
    general: {
      name: organization.name,
      slug: organization.slug,
      description: organization.description || '',
      avatar: organization.avatar || '',
      website: organization.website || '',
    },
    preferences: {
      timezone: 'UTC',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    },
    features: {
      enableTimeTracking: true,
      enableAutomation: true,
      enableCustomFields: true,
      enableIntegrations: true,
    },
    notifications: {
      emailNotifications: true,
      slackNotifications: false,
      webhookUrl: '',
    },
    security: {
      requireTwoFactor: false,
      allowGuestAccess: false,
      sessionTimeout: 30,
    },
  });

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'preferences', name: 'Preferences', icon: '🎛️' },
    { id: 'features', name: 'Features', icon: '🚀' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔐' },
  ];

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const updatedOrg = await updateOrganization(organization.id, {
        ...settings.general,
        settings: {
          ...settings.preferences,
          ...settings.features,
          ...settings.notifications,
          ...settings.security,
        },
      });
      onUpdate(updatedOrg);
    } catch (error) {
      console.error('Error updating organization settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Organization Name
        </label>
        <input
          type="text"
          value={settings.general.name}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, name: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Slug
        </label>
        <input
          type="text"
          value={settings.general.slug}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, slug: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={settings.general.description}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, description: e.target.value }
          }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Website
        </label>
        <input
          type="url"
          value={settings.general.website}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, website: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Timezone
        </label>
        <select
          value={settings.preferences.timezone}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, timezone: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Language
        </label>
        <select
          value={settings.preferences.language}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, language: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ja">Japanese</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date Format
        </label>
        <select
          value={settings.preferences.dateFormat}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, dateFormat: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Time Format
        </label>
        <select
          value={settings.preferences.timeFormat}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, timeFormat: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="12h">12 Hour</option>
          <option value="24h">24 Hour</option>
        </select>
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="space-y-6">
      {Object.entries(settings.features).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getFeatureDescription(key)}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                features: { ...prev.features, [key]: e.target.checked }
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const getFeatureDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      enableTimeTracking: 'Allow time tracking for tasks and projects',
      enableAutomation: 'Enable automation rules and workflows',
      enableCustomFields: 'Allow custom fields for tasks and projects',
      enableIntegrations: 'Enable third-party integrations',
    };
    return descriptions[key] || '';
  };

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Notifications
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send notifications via email
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifications.emailNotifications}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              notifications: { ...prev.notifications, emailNotifications: e.target.checked }
            }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Slack Notifications
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send notifications to Slack
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.notifications.slackNotifications}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              notifications: { ...prev.notifications, slackNotifications: e.target.checked }
            }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Webhook URL
        </label>
        <input
          type="url"
          value={settings.notifications.webhookUrl}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, webhookUrl: e.target.value }
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="https://hooks.slack.com/services/..."
        />
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Require Two-Factor Authentication
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Require 2FA for all organization members
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.security.requireTwoFactor}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              security: { ...prev.security, requireTwoFactor: e.target.checked }
            }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Allow Guest Access
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Allow external users to access shared resources
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.security.allowGuestAccess}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              security: { ...prev.security, allowGuestAccess: e.target.checked }
            }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Session Timeout (minutes)
        </label>
        <input
          type="number"
          value={settings.security.sessionTimeout}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
          }))}
          min="5"
          max="1440"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'features':
        return renderFeaturesTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      default:
        return renderGeneralTab();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Organization Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure your organization preferences and settings
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button onClick={handleSave} loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}