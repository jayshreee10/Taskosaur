"use client";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
  HiCog6Tooth,
  HiUser,
  HiEnvelope,
  HiBell,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import '@/app/globals.css';

export default function SettingsPage() {
  const { getCurrentUser, updateUser, updateUserEmail, deleteUser } = useAuth();
  const router = useRouter();
  const currentUser = getCurrentUser();

  // Prevent multiple simultaneous API calls
  const fetchingRef = useRef(false);
  const currentUserRef = useRef<any>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
  });

  // Email form state
  const [emailData, setEmailData] = useState({
    email: '',
  });

  // Preferences form state
  const [preferencesData, setPreferencesData] = useState({
    timezone: '(UTC-08:00) Pacific Time (US & Canada)',
    notifications: {
      comments: true,
      assignments: true,
      updates: true,
    },
  });

  const [loading, setLoading] = useState({
    profile: false,
    email: false,
    preferences: false,
    delete: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data with current user data
  useEffect(() => {
    if (currentUser) {
      // Prevent duplicate initialization for the same user
      if (currentUserRef.current?.id === currentUser.id) {
        return;
      }
      
      currentUserRef.current = currentUser;
      
      setProfileData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
      });
      setEmailData({
        email: currentUser.email || '',
      });
    }
  }, []);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      fetchingRef.current = false;
      currentUserRef.current = null;
    };
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Prevent duplicate submissions
    if (fetchingRef.current) {

      return;
    }

    fetchingRef.current = true;
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      await updateUser(currentUser.id, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
      fetchingRef.current = false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Prevent duplicate submissions
    if (fetchingRef.current) {

      return;
    }

    fetchingRef.current = true;
    setLoading(prev => ({ ...prev, email: true }));
    try {
      await updateUserEmail(currentUser.id, {
        email: emailData.email,
      });
      alert('Email updated successfully!');
    } catch (error) {
      console.error('Error updating email:', error);
      alert('Failed to update email. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
      fetchingRef.current = false;
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Prevent duplicate submissions
    if (fetchingRef.current) {

      return;
    }

    fetchingRef.current = true;
    setLoading(prev => ({ ...prev, preferences: true }));
    try {
      await updateUser(currentUser.id, {
        timezone: preferencesData.timezone,
        preferences: {
          theme: 'light',
          notifications: {
            email: preferencesData.notifications.comments,
            push: preferencesData.notifications.assignments,
          },
        },
      });
      alert('Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update preferences. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, preferences: false }));
      fetchingRef.current = false;
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    // Prevent duplicate submissions
    if (fetchingRef.current) {

      return;
    }

    fetchingRef.current = true;
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      await deleteUser(currentUser.id);
      alert('Account deleted successfully!');
      router.push('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
      setShowDeleteConfirm(false);
      fetchingRef.current = false;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to access settings.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <HiCog6Tooth size={20} />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiUser size={16} className="text-primary" />
                Profile
              </CardTitle>
              <CardDescription>This information will be displayed publicly so be careful what you share.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First name</Label>
                    <Input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Profile picture</Label>
                  <div className="flex items-center gap-4">
                    <UserAvatar firstName={profileData.firstName} lastName={profileData.lastName} />
                    <Button variant="secondary" size="sm">
                      Change
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={loading.profile}
                    size="md"
                  >
                    {loading.profile ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Email Section */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiEnvelope size={16} className="text-primary" />
                Email
              </CardTitle>
              <CardDescription>Update your email address.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="max-w-md">
                  <Label>Email address</Label>
                  <Input
                    type="email"
                    value={emailData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={loading.email}
                    size="md"
                  >
                    {loading.email ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Preferences */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiBell size={16} className="text-primary" />
                Account Preferences
              </CardTitle>
              <CardDescription>Manage your account settings and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                <div className="max-w-md">
                  <Label>Timezone</Label>
                  <Select
                    value={preferencesData.timezone}
                    // onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPreferencesData(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option>(UTC-08:00) Pacific Time (US & Canada)</option>
                    <option>(UTC-05:00) Eastern Time (US & Canada)</option>
                    <option>(UTC+00:00) London</option>
                    <option>(UTC+01:00) Berlin, Paris, Rome</option>
                    <option>(UTC+08:00) Singapore, Hong Kong</option>
                    <option>(UTC+09:00) Tokyo</option>
                  </Select>
                </div>

                <div>
                  <Label>Email notifications</Label>
                  <div className="space-y-4 mt-3">
                    {[
                      { key: 'comments', label: 'Comments', description: 'Get notified when someone comments on your tasks.' },
                      { key: 'assignments', label: 'Assignments', description: "Get notified when you're assigned to a task." },
                      { key: 'updates', label: 'Task Updates', description: "Get notified when tasks you're involved with are updated." }
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-start gap-3">
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            id={notification.key}
                            type="checkbox"
                            checked={preferencesData.notifications[notification.key as keyof typeof preferencesData.notifications]}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferencesData(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, [notification.key]: e.target.checked }
                            }))}
                            className="h-4 w-4 text-amber-600 border-stone-300 dark:border-stone-600 rounded focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                        <div>
                          <label htmlFor={notification.key} className="text-sm font-medium text-foreground">
                            {notification.label}
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={loading.preferences}
                    size="md"
                  >
                    {loading.preferences ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="overflow-hidden border-destructive">
            <CardHeader className="bg-destructive/10 border-b border-destructive">
              <CardTitle className="text-destructive flex items-center gap-2 mb-1">
                <HiExclamationTriangle size={16} />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-xs text-destructive">
                Permanent actions that cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium mb-1">Delete account</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
                  </CardDescription>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading.delete}
                  className="ml-4 flex-shrink-0"
                >
                  {loading.delete ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardContent>
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
                    <HiExclamationTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <CardTitle className="text-lg font-semibold mb-2">Delete Account</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                  </CardDescription>
                </div>
                <CardFooter className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={handleDeleteAccount}
                    disabled={loading.delete}
                    className="flex-1"
                  >
                    {loading.delete ? 'Deleting...' : 'Delete'}
                  </Button>
                </CardFooter>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

const UserAvatar = ({ firstName, lastName }: { firstName: string; lastName: string }) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return (
    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
      {initials}
    </div>
  );
};