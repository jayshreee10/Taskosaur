'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import {
  HiPlus,
  HiExclamationTriangle,
  HiArrowPath,
  // HiBuilding,
  HiGlobeAlt,
  HiCalendar,
  HiClock,
  HiRocketLaunch,
  HiCog,
  HiInformationCircle
} from 'react-icons/hi2';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Organization {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  website?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  settings?: {
    allowInvites?: boolean;
    requireEmailVerification?: boolean;
    defaultRole?: string;
    features?: {
      timeTracking?: boolean;
      customFields?: boolean;
      automation?: boolean;
      integrations?: boolean;
    };
  };
}

// Enhanced OrganizationCard component
const OrganizationCard = ({ organization }: { organization: Organization }) => (
  <Card className="p-6 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
    <CardHeader className="mb-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-medium">
          {organization.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <CardTitle className="font-semibold text-lg text-stone-900 dark:text-stone-100 mb-1">
            {organization.name}
          </CardTitle>
          {organization.description && (
            <CardDescription className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
              {organization.description}
            </CardDescription>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3 mb-4">
        {organization.slug && (
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            {/* <HiBuilding size={14} /> */}
            <span className="font-medium">Slug:</span>
            <Badge>
              {organization.slug}
            </Badge>
          </div>
        )}
        {organization.website && (
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <HiGlobeAlt size={14} />
            <span className="font-medium">Website:</span>
            <a 
              href={organization.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              {organization.website}
            </a>
          </div>
        )}
        {organization.createdAt && (
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <HiCalendar size={14} />
            <span className="font-medium">Created:</span>
            <span>
              {new Date(organization.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {organization.settings?.features?.timeTracking && (
            <Badge>
              <HiClock size={12} className="mr-1" />
              Time Tracking
            </Badge>
          )}
          {organization.settings?.features?.automation && (
            <Badge>
              <HiRocketLaunch size={12} className="mr-1" />
              Automation
            </Badge>
          )}
        </div>
        <Link href={`/settings/organizations/${organization.slug}`}>
          <Button variant="secondary" size="sm">
            <HiCog size={14} />
            Manage
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

// OrganizationForm component
const OrganizationForm = ({ 
  onSuccess, 
  onCancel 
}: { 
  onSuccess: (org: Organization) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createOrganization } = useOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const organizationData = {
        name,
        description: description || undefined,
        website: website || undefined,
      };

      const newOrg = await createOrganization(organizationData);
      onSuccess(newOrg);
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <HiExclamationTriangle className="w-5 h-5" />
              Error creating organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</CardDescription>
          </CardContent>
        </Card>
      )}
      <div>
        <Label aria-required>Organization Name</Label>
        <Input
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Enter organization name"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Describe your organization..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label>Website</Label>
        <Input
          type="url"
          value={website}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
          placeholder="https://example.com"
          disabled={isSubmitting}
        />
      </div>
      <CardFooter className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            <>
              <HiPlus size={14} />
              Create Organization
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

export default function OrganizationSettingsPage() {
  const { getOrganizationsByUser } = useOrganization();
  const { getCurrentUser } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentUser = getCurrentUser();
      
      if (!currentUser?.id) {
        setError('User not authenticated');
        return;
      }

      const data = await getOrganizationsByUser(currentUser.id);
      
      // Handle different possible response structures
      let organizationsArray = [];
      
      if (Array.isArray(data)) {
        organizationsArray = data;
      } else if (data && Array.isArray(data.organizations)) {
        organizationsArray = data.organizations;
      } else if (data && Array.isArray(data.data)) {
        organizationsArray = data.data;
      } else if (data && data.organization) {
        organizationsArray = Array.isArray(data.organization) ? data.organization : [data.organization];
      } else {
        organizationsArray = [];
      }
      
      setOrganizations(organizationsArray);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleOrganizationCreated = async (organization: Organization) => {
    setOrganizations(prev => [...prev, organization]);
    setShowCreateForm(false);
    await fetchOrganizations();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded w-1/3"></div>
            <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/2"></div>
            <Card className="p-6">
              <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-stone-200 dark:bg-stone-700 rounded"></div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
        <div className="max-w-6xl mx-auto p-6">
          <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                  Error loading organizations
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button
                  onClick={fetchOrganizations}
                  variant="secondary"
                  className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-600"
                >
                  <HiArrowPath size={16} />
                  Try again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Organization Management
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Manage your organizations and switch between different tenants
          </p>
        </div>

        {/* Create Organization Form */}
        {showCreateForm && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              {/* <HiBuilding size={20} className="text-amber-600" /> */}
              Create New Organization
            </h2>
            <OrganizationForm
              onSuccess={handleOrganizationCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </Card>
        )}

        {/* Organizations List */}
        <Card>
          <div className="p-6 border-b border-stone-200 dark:border-stone-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Your Organizations
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Organizations you belong to or manage
                </p>
              </div>
              {!showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <HiPlus size={16} />
                  Create Organization
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            {organizations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  {/* <HiBuilding size={32} className="text-stone-400" /> */}
                </div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  No organizations found
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                  You don't belong to any organizations yet. Create your first organization to get started.
                </p>
               
              </div>
            ) : (
              <>
                <div className="mb-6 text-sm text-stone-600 dark:text-stone-400">
                  Found {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {organizations.map((organization) => (
                    <OrganizationCard key={organization.id} organization={organization} />
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <HiInformationCircle className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                About Organizations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Organizations are your top-level containers for workspaces, projects, and teams. 
                Switch between organizations using the selector in the header to work with different 
                groups or companies.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}