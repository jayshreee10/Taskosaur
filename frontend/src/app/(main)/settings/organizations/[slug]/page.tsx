'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Organization, OrganizationMember, OrganizationRole } from '@/types';
import { 
  getOrganizationBySlug, 
  getOrganizationMembers 
} from '@/utils/apiUtils';

import OrganizationSettingsComponent from '@/components/organizations/OrganizationSettings';
import OrganizationMembers from '@/components/organizations/OrganizationMembers';

export default function OrganizationManagePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;


  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'members'>('settings');

  // Mock current user role - in a real app, this would come from auth
  const currentUserRole = OrganizationRole.ADMIN;

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const orgData = await getOrganizationBySlug(slug);
      if (!orgData) {
        setError('Organization not found');
        return;
      }

      const membersData = await getOrganizationMembers(orgData.id);
      
      setOrganization(orgData);
      setMembers(membersData);
    } catch (err) {
      setError('Failed to load organization data');
      console.error('Error loading organization:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  const handleOrganizationUpdate = async (updatedOrganization: Organization) => {
    setOrganization(updatedOrganization);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {error || 'Organization not found'}
          </h3>
          <button
            onClick={() => router.push('/settings/organizations')}
            className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/settings/organizations')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 mb-2"
          >
            ← Back to Organizations
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {organization.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage organization settings and members
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Members ({members.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' ? (
        <OrganizationSettingsComponent
          organization={organization}
          onUpdate={handleOrganizationUpdate}
        />
      ) : (
        <OrganizationMembers
          organizationId={organization.id}
          members={members}
          currentUserRole={currentUserRole}
          onMembersChange={loadData}
        />
      )}
    </div>
  );
}