'use client';

import { useState } from 'react';
import { OrganizationSettings } from '@/types';
import { updateOrganization } from '@/utils/apiUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Organization } from '@/utils/api';
import {
  HiCog,
  HiGlobeAlt,
  HiRocketLaunch,
  HiBell,
  HiShieldCheck,
} from 'react-icons/hi2';

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
    { id: 'general', name: 'General', icon: HiCog },
    { id: 'preferences', name: 'Preferences', icon: HiGlobeAlt },
    { id: 'features', name: 'Features', icon: HiRocketLaunch },
    { id: 'notifications', name: 'Notifications', icon: HiBell },
    { id: 'security', name: 'Security', icon: HiShieldCheck },
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
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-[var(--muted)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
    </label>
  );

  const renderGeneralTab = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="org-name" className="text-sm font-medium text-[var(--foreground)]">
          Organization Name
        </Label>
        <Input
          id="org-name"
          type="text"
          value={settings.general.name}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, name: e.target.value }
          }))}
          className="mt-1 border-input bg-background text-[var(--foreground)]"
        />
      </div>

      <div>
        <Label htmlFor="org-slug" className="text-sm font-medium text-[var(--foreground)]">
          Slug
        </Label>
        <Input
          id="org-slug"
          type="text"
          value={settings.general.slug}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, slug: e.target.value }
          }))}
          className="mt-1 border-input bg-background text-[var(--foreground)]"
        />
      </div>

      <div>
        <Label htmlFor="org-description" className="text-sm font-medium text-[var(--foreground)]">
          Description
        </Label>
        <Textarea
          id="org-description"
          value={settings.general.description}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, description: e.target.value }
          }))}
          rows={3}
          className="mt-1 border-input bg-background text-[var(--foreground)]"
        />
      </div>

      <div>
        <Label htmlFor="org-website" className="text-sm font-medium text-[var(--foreground)]">
          Website
        </Label>
        <Input
          id="org-website"
          type="url"
          value={settings.general.website}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, website: e.target.value }
          }))}
          className="mt-1 border-input bg-background text-[var(--foreground)]"
          placeholder="https://example.com"
        />
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-[var(--foreground)]">
          Timezone
        </Label>
        <Select 
          value={settings.preferences.timezone} 
          onValueChange={(value) => setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, timezone: value }
          }))}
        >
          <SelectTrigger className="mt-1 border-input bg-background text-[var(--foreground)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-none bg-[var(--card)]">
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">Eastern Time</SelectItem>
            <SelectItem value="America/Chicago">Central Time</SelectItem>
            <SelectItem value="America/Denver">Mountain Time</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
            <SelectItem value="Europe/London">London</SelectItem>
            <SelectItem value="Europe/Paris">Paris</SelectItem>
            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-[var(--foreground)]">
          Language
        </Label>
        <Select 
          value={settings.preferences.language} 
          onValueChange={(value) => setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, language: value }
          }))}
        >
          <SelectTrigger className="mt-1 border-input bg-background text-[var(--foreground)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-none bg-[var(--card)]">
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-[var(--foreground)]">
          Date Format
        </Label>
        <Select 
          value={settings.preferences.dateFormat} 
          onValueChange={(value) => setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, dateFormat: value }
          }))}
        >
          <SelectTrigger className="mt-1 border-input bg-background text-[var(--foreground)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-none bg-[var(--card)]">
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-[var(--foreground)]">
          Time Format
        </Label>
        <Select 
          value={settings.preferences.timeFormat} 
          onValueChange={(value) => setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, timeFormat: value }
          }))}
        >
          <SelectTrigger className="mt-1 border-input bg-background text-[var(--foreground)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-none bg-[var(--card)]">
            <SelectItem value="12h">12 Hour</SelectItem>
            <SelectItem value="24h">24 Hour</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="space-y-4">
      {Object.entries(settings.features).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/30">
          <div>
            <Label className="text-sm font-medium text-[var(--foreground)]">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Label>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {getFeatureDescription(key)}
            </p>
          </div>
          <ToggleSwitch
            checked={value}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              features: { ...prev.features, [key]: checked }
            }))}
          />
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
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/30">
        <div>
          <Label className="text-sm font-medium text-[var(--foreground)]">
            Email Notifications
          </Label>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Send notifications via email
          </p>
        </div>
        <ToggleSwitch
          checked={settings.notifications.emailNotifications}
          onChange={(checked) => setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, emailNotifications: checked }
          }))}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/30">
        <div>
          <Label className="text-sm font-medium text-[var(--foreground)]">
            Slack Notifications
          </Label>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Send notifications to Slack
          </p>
        </div>
        <ToggleSwitch
          checked={settings.notifications.slackNotifications}
          onChange={(checked) => setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, slackNotifications: checked }
          }))}
        />
      </div>

      <div>
        <Label htmlFor="webhook-url" className="text-sm font-medium text-[var(--foreground)]">
          Webhook URL
        </Label>
        <Input
          id="webhook-url"
          type="url"
          value={settings.notifications.webhookUrl}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, webhookUrl: e.target.value }
          }))}
          className="mt-1 border-input bg-background text-[var(--foreground)]"
          placeholder="https://hooks.slack.com/services/..."
        />
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/30">
        <div>
          <Label className="text-sm font-medium text-[var(--foreground)]">
            Require Two-Factor Authentication
          </Label>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Require 2FA for all organization members
          </p>
        </div>
        <ToggleSwitch
          checked={settings.security.requireTwoFactor}
          onChange={(checked) => setSettings(prev => ({
            ...prev,
            security: { ...prev.security, requireTwoFactor: checked }
          }))}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/30">
        <div>
          <Label className="text-sm font-medium text-[var(--foreground)]">
            Allow Guest Access
          </Label>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Allow external users to access shared resources
          </p>
        </div>
        <ToggleSwitch
          checked={settings.security.allowGuestAccess}
          onChange={(checked) => setSettings(prev => ({
            ...prev,
            security: { ...prev.security, allowGuestAccess: checked }
          }))}
        />
      </div>

      <div>
        <Label htmlFor="session-timeout" className="text-sm font-medium text-[var(--foreground)]">
          Session Timeout (minutes)
        </Label>
        <Input
          id="session-timeout"
          type="number"
          value={settings.security.sessionTimeout}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
          }))}
          min="5"
          max="1440"
          className="mt-1 border-input bg-background text-[var(--foreground)]"
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
    <div className="space-y-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-semibold text-[var(--foreground)]">
          Organization Settings
        </CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Configure your organization preferences and settings
        </p>
      </CardHeader>

      <div className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
        <div className="border-b border-[var(--border)]">
          <nav className="flex gap-1 px-4">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 border-b-2 border-transparent text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <CardContent className="p-4">
          {renderTabContent()}
        </CardContent>

        <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="h-8 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90  transition-all duration-200 font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}