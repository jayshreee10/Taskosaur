"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import {
  HiPlus,
  HiExclamationTriangle,
  HiArrowPath,
  HiBuildingOffice2,
  HiCheck,
  HiInformationCircle,
  HiSparkles,
  HiUsers,
  HiRocketLaunch
} from 'react-icons/hi2';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Organization } from '@/utils/api';
import OrganizationSelectionCard from './OrganizationSelectionCard';
import OrganizationCreationForm from './OrganizationCreationForm';

export default function OrganizationSelectionPage() {
  const router = useRouter();
  const { 
    organizations, 
    isLoading, 
    error, 
    getOrganizationsByUser, 
    setCurrentOrganization,
    clearError 
  } = useOrganization();
  const { getCurrentUser } = useAuth();
  
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeTab, setActiveTab] = useState("select");

  const fetchOrganizations = useCallback(async () => {
    try {
      clearError();
      
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      await getOrganizationsByUser(currentUser.id);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  }, [getCurrentUser, getOrganizationsByUser, clearError]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleOrganizationSelect = async (organization: Organization) => {
    try {
      setIsSelecting(true);
      setSelectedOrganization(organization);
      
      setCurrentOrganization(organization);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error selecting organization:', error);
      setIsSelecting(false);
    }
  };

  const handleOrganizationCreated = async (organization: Organization) => {
    await handleOrganizationSelect(organization);
  };

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--primary)]/5 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/60 rounded-2xl animate-pulse"></div>
              <div className="absolute inset-2 bg-[var(--background)] rounded-xl flex items-center justify-center">
                <HiBuildingOffice2 size={24} className="text-[var(--primary)] animate-bounce" />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Loading your organizations
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            This won't take long...
          </p>
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--destructive)]/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-[var(--destructive)]/20 bg-[var(--destructive)]/5 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-[var(--destructive)]/10 rounded-2xl flex items-center justify-center">
              <HiExclamationTriangle className="w-8 h-8 text-[var(--destructive)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
              Something went wrong
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6 leading-relaxed">
              We couldn't load your organizations. This might be a temporary issue.
            </p>
            <div className="bg-[var(--muted)] p-3 rounded-lg mb-6">
              <p className="text-sm text-[var(--muted-foreground)] font-mono">{error}</p>
            </div>
            <Button onClick={fetchOrganizations} variant="outline" className="min-w-[120px]">
              <HiArrowPath size={16} className="mr-2" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--primary)]/3">
      <div className="max-w-5xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-12 pt-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <HiBuildingOffice2 size={36} className="text-[var(--primary-foreground)]" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
              <HiSparkles size={16} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4 tracking-tight">
            Welcome to <span className="text-[var(--primary)]">Taskosaur</span>
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-3xl mx-auto leading-relaxed">
            Your journey to better project management starts here. Choose an organization to continue, or create your first one to get started.
          </p>
        </div>

        {/* Enhanced Main Content */}
        <Card className="w-full shadow-xl border-[var(--border)]/50 bg-[var(--card)]/80 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Enhanced Tab Header */}
            <div className="border-b border-[var(--border)]/30 px-8 pt-8 bg-gradient-to-r from-[var(--muted)]/20 to-[var(--muted)]/5">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-[var(--muted)]/50 p-1 rounded-xl">
                <TabsTrigger value="select" className="flex items-center gap-2 rounded-lg py-3 px-4 data-[state=active]:bg-[var(--background)] data-[state=active]:shadow-sm">
                  <HiCheck size={18} />
                  <span className="font-medium">Select Organization</span>
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2 rounded-lg py-3 px-4 data-[state=active]:bg-[var(--background)] data-[state=active]:shadow-sm">
                  <HiPlus size={18} />
                  <span className="font-medium">Create New</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Select Organization Tab */}
            <TabsContent value="select" className="p-8">
              {organizations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-[var(--muted)] to-[var(--muted)]/60 rounded-3xl flex items-center justify-center mx-auto">
                      <HiBuildingOffice2 size={32} className="text-[var(--muted-foreground)]" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 rounded-full flex items-center justify-center shadow-lg">
                      <HiPlus size={18} className="text-[var(--primary-foreground)]" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                    Ready to get started?
                  </h3>
                  <p className="text-[var(--muted-foreground)] mb-8 max-w-md mx-auto leading-relaxed">
                    You don't belong to any organizations yet. Create your first organization and invite your team to collaborate.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("create")} 
                    size="lg" 
                    className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 hover:from-[var(--primary)]/90 hover:to-[var(--primary)]/70 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                  >
                    <HiPlus size={20} className="mr-2" />
                    Create Your First Organization
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Enhanced Header */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                        <HiUsers className="text-[var(--primary)]" size={24} />
                        Your Organizations
                      </h3>
                      <p className="text-[var(--muted-foreground)]">
                        Select an organization to access your workspaces and projects
                      </p>
                    </div>
                    <Badge variant="secondary" className="px-4 py-2 text-sm bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                      {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Enhanced Organization Grid */}
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {organizations.map((organization) => (
                      <OrganizationSelectionCard
                        key={organization.id}
                        organization={organization}
                        isSelected={selectedOrganization?.id === organization.id}
                        onSelect={handleOrganizationSelect}
                      />
                    ))}
                  </div>

                  {/* Enhanced Selection Feedback */}
                  {selectedOrganization && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
                          <HiCheck size={16} className="text-[var(--primary-foreground)]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--primary)]">
                            Organization Selected
                          </p>
                          <p className="text-[var(--foreground)] font-medium">
                            {selectedOrganization.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Create Organization Tab */}
            <TabsContent value="create" className="p-8">
              <div className="max-w-2xl mx-auto">
                {/* Enhanced Create Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <HiRocketLaunch size={24} className="text-[var(--primary-foreground)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                    Create New Organization
                  </h3>
                  <p className="text-[var(--muted-foreground)] leading-relaxed">
                    Set up a new organization to manage your team, projects, and collaborate effectively
                  </p>
                </div>

                <OrganizationCreationForm
                  onSuccess={handleOrganizationCreated}
                  onCancel={() => setActiveTab("select")}
                  isSubmitting={isSelecting}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Enhanced Help Section */}
        <Card className="mt-8 border-[var(--primary)]/20 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <HiInformationCircle className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-[var(--foreground)]">
                  💡 What are Organizations?
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Organizations are your top-level workspace for managing teams, projects, and resources. 
                  Think of them as your company or team space where all collaboration happens. You can 
                  switch between organizations anytime using the selector in the header.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Loading Overlay */}
      {isSelecting && (
        <div className="fixed inset-0 bg-[var(--background)]/90 backdrop-blur-md flex items-center justify-center z-50">
          <Card className="p-8 w-full max-w-sm shadow-2xl border-[var(--border)]/50">
            <CardContent className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/60 rounded-2xl animate-spin"></div>
                  <div className="absolute inset-2 bg-[var(--background)] rounded-xl flex items-center justify-center">
                    <HiBuildingOffice2 size={24} className="text-[var(--primary)]" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Setting up your workspace
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  We're preparing everything for you. This will only take a moment...
                </p>
              </div>
              <div className="flex items-center justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
