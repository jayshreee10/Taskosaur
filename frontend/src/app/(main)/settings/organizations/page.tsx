'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import {
  HiPlus,
  HiExclamationTriangle,
  HiArrowPath,
  HiGlobeAlt,
  HiCalendar,
  HiClock,
  HiRocketLaunch,
  HiCog,
  HiInformationCircle,
  HiUsers,
  HiBriefcase,
  
} from 'react-icons/hi2';
import { HiOfficeBuilding } from "react-icons/hi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Organization } from '@/utils/api';

// Enhanced OrganizationCard component with consistent theming
const OrganizationCard = ({ organization }: { organization: Organization }) => {
  // Check if user can manage the organization
  const canManage = () => {
    return organization.isOwner || organization.userRole === 'ADMIN';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20';
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]';
    }
  };

  return (
    <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none group transition-all duration-200 hover:bg-[var(--primary)]/5">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-semibold text-lg flex-shrink-0">
            {organization.avatar ? (
              <Image
                src={organization.avatar}
                alt={organization.name}
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-lg"
                unoptimized
              />
            ) : (
              organization.name?.charAt(0)?.toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-md font-semibold text-[var(--foreground)] mb-1 truncate group-hover:text-[var(--primary)] transition-colors">
              {organization.name}
            </h3>
            {organization.description && (
              <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                {organization.description}
              </p>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-3 mb-4">
          {organization.slug && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="font-medium">Slug:</span>
              <Badge className="bg-[var(--muted)] text-[var(--muted-foreground)] border-none text-xs">
                {organization.slug}
              </Badge>
            </div>
          )}
          
          {organization.website && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <HiGlobeAlt className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium">Website:</span>
              <a 
                href={organization.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:text-[var(--primary)]/80 truncate max-w-[150px] transition-colors"
              >
                {organization.website}
              </a>
            </div>
          )}
          
          {organization.joinedAt && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <HiCalendar className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium">Joined:</span>
              <span>
                {new Date(organization.joinedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {/* User role */}
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">Your Role:</span>
            <Badge className={`text-xs px-2 py-1 rounded-md border-none ${getRoleColor(organization.userRole)}`}>
              {organization.userRole}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-1">
              <HiUsers className="w-3 h-3" />
              <span>{organization._count.members} members</span>
            </div>
            <div className="flex items-center gap-1">
              <HiBriefcase className="w-3 h-3" />
              <span>{organization._count.workspaces} workspaces</span>
            </div>
          </div>
        </div>
        
        {/* Footer Section */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/50">
          <div className="flex items-center gap-2">
            {organization.settings?.features?.timeTracking && (
              <Badge className="bg-[var(--muted)] text-[var(--muted-foreground)] border-none text-xs">
                <HiClock className="w-3 h-3 mr-1" />
                Time Tracking
              </Badge>
            )}
            {organization.settings?.features?.automation && (
              <Badge className="bg-[var(--muted)] text-[var(--muted-foreground)] border-none text-xs">
                <HiRocketLaunch className="w-3 h-3 mr-1" />
                Automation
              </Badge>
            )}
          </div>
          
          {/* Only show manage button if user can manage */}
          {canManage() && (
            <Link href={`/settings/organizations/${organization.slug}`}>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] transition-all duration-200"
              >
                <HiCog className="w-3 h-3 mr-1" />
                Manage
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// OrganizationForm component with consistent theming
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg">
          <div className="flex items-center gap-3">
            <HiExclamationTriangle className="w-5 h-5 text-[var(--destructive)] flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-[var(--destructive)] mb-1">
                Error creating organization
              </h4>
              <p className="text-sm text-[var(--destructive)]/80">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="org-name" className="text-sm font-medium text-[var(--foreground)]">
            Organization Name *
          </Label>
          <Input
            id="org-name"
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Enter organization name"
            required
            disabled={isSubmitting}
            className="mt-1 border-input bg-background text-[var(--foreground)]"
          />
        </div>
        
        <div>
          <Label htmlFor="org-description" className="text-sm font-medium text-[var(--foreground)]">
            Description
          </Label>
          <Textarea
            id="org-description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Describe your organization..."
            rows={3}
            disabled={isSubmitting}
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
            value={website}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            disabled={isSubmitting}
            className="mt-1 border-input bg-background text-[var(--foreground)]"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] transition-all duration-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-9 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-all duration-200 font-medium"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <HiPlus className="w-4 h-4 mr-2" />
              Create Organization
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Error State Component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border border-[var(--border)]">
    <CardContent className="p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--destructive)]/10 flex items-center justify-center flex-shrink-0">
          <HiExclamationTriangle className="w-5 h-5 text-[var(--destructive)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
            Error loading organizations
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">{error}</p>
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="h-9 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] transition-all duration-200"
          >
            <HiArrowPath className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-6 bg-[var(--muted)] rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-[var(--muted)] rounded w-1/2 mb-6"></div>
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
          <CardContent className="p-6">
            <div className="h-6 bg-[var(--muted)] rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-[var(--muted)] rounded-lg"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="text-center py-12">
    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--muted)] flex items-center justify-center">
      <HiBriefcase className="w-8 h-8 text-[var(--muted-foreground)]" />
    </div>
    <h3 className="text-md font-semibold text-[var(--foreground)] mb-2">
      No organizations found
    </h3>
    <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
      You don't belong to any organizations yet. Create your first organization to get started with managing workspaces and projects.
    </p>
  </div>
);

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
      let organizationsArray: Organization[] = [];
      
      if (Array.isArray(data)) {
        organizationsArray = data;
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
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <ErrorState error={error} onRetry={fetchOrganizations} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HiOfficeBuilding className="w-5 h-5" />
              <h1 className="text-md font-bold text-[var(--foreground)]">
                Organization Management
              </h1>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage your organizations and switch between different tenants
            </p>
          </div>
          {!showCreateForm && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="h-9 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-all duration-200 font-medium flex items-center gap-2 rounded-lg shadow-none border-none"
            >
              <HiPlus className="w-4 h-4" />
              Create Organization
            </Button>
          )}
        </div>

        {/* Create Organization Form */}
        {showCreateForm && (
          <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
                <HiPlus className="w-5 h-5 text-[var(--primary)]" />
                Create New Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationForm
                onSuccess={handleOrganizationCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Organizations List */}
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-md font-semibold text-[var(--foreground)]">
                  Your Organizations
                </CardTitle>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Organizations you belong to or manage
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {organizations.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="mb-6 text-sm text-[var(--muted-foreground)] pb-2">
                  Found {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {organizations.map((organization) => (
                    <OrganizationCard key={organization.id} organization={organization} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-[var(--card)] rounded-[var(--card-radius)] border-none">
          <CardContent className="p-6 bg-[var(--muted)]/10 rounded-b-[var(--card-radius)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                <HiInformationCircle className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  About Organizations
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Organizations are your top-level containers for workspaces, projects, and teams. 
                  Switch between organizations using the selector in the header to work with different 
                  groups or companies. Only owners and administrators can manage organization settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}