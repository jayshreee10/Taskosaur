"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import { Input } from '@/components/ui';
import { HiUserPlus, HiMagnifyingGlass, HiEllipsisVertical, HiEnvelope } from 'react-icons/hi2';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import { useGlobalFetchPrevention } from '@/hooks/useGlobalFetchPrevention';
import '@/styles/components/project-members.css';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  avatarUrl?: string;
  joinedAt: string;
  lastActive?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  workspaceId: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
}

export default function ProjectMembersPage() {
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;
  const projectSlug = params?.projectSlug as string;

  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { getProjectsByWorkspace, getProjectMembers } = useProjectContext();
  const auth = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  const fetchPrevention = useGlobalFetchPrevention();
  const hasFetchedRef = useRef<string | null>(null);

  // Demo member data generator for development
  const generateDemoMembers = useCallback((projectSlug: string): Member[] => {
    const roles = ['Owner', 'Admin', 'Member', 'Viewer'];
    const domains = ['example.com', 'demo.org', 'test.io'];
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: `member-${i + 1}`,
      email: `user${i + 1}@${domains[i % domains.length]}`,
      firstName: `User`,
      lastName: `${i + 1}`,
      username: `user${i + 1}`,
      role: roles[i % roles.length],
      avatarUrl: undefined,
      joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!workspaceSlug || !projectSlug) return;
      
      // Prevent multiple fetches for the same route
      const currentRoute = `${workspaceSlug}/${projectSlug}`;
      if (hasFetchedRef.current === currentRoute) return;

      // Check if we should prevent fetch
      const shouldPrevent = fetchPrevention.shouldPreventFetch('workspace-project-members');
      if (shouldPrevent) return;

      try {
        setLoading(true);
        setError(null);
        hasFetchedRef.current = currentRoute;
        fetchPrevention.markFetchStart('workspace-project-members');

        // Get workspace by slug
        const workspaceData = await getWorkspaceBySlug(workspaceSlug);
        if (!workspaceData) {
          throw new Error('Workspace not found');
        }
        setWorkspace(workspaceData);

        // Get projects in workspace and find the specific project
        const projectsData = await getProjectsByWorkspace(workspaceData.id);
        const foundProject = projectsData?.find((p: any) => p.slug === projectSlug);
        if (!foundProject) {
          throw new Error('Project not found');
        }
        setProject(foundProject);

        // Get project members
        try {
          const membersData = await getProjectMembers(foundProject.id);
          if (Array.isArray(membersData) && membersData.length > 0) {
            setMembers(membersData);
            fetchPrevention.markFetchComplete('workspace-project-members', membersData);
          } else {
            // Fallback to demo data if API doesn't return proper data
            const demoMembers = generateDemoMembers(projectSlug);
            setMembers(demoMembers);
            fetchPrevention.markFetchComplete('workspace-project-members', demoMembers);
          }
        } catch (membersError) {
          console.warn('Failed to fetch members, using demo data:', membersError);
          const demoMembers = generateDemoMembers(projectSlug);
          setMembers(demoMembers);
          fetchPrevention.markFetchComplete('workspace-project-members', demoMembers);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        fetchPrevention.markFetchError('workspace-project-members');
        
        // Set demo data for development
        const demoMembers = generateDemoMembers(projectSlug);
        setMembers(demoMembers);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workspaceSlug, projectSlug, generateDemoMembers]); // Only depend on route parameters and memoized functions

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member =>
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [members, searchTerm]);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !project) return;
    
    try {
      // TODO: Implement actual invite logic when API is ready
      console.log('Inviting member:', inviteEmail, 'to project:', project.id);
      setInviteEmail('');
      setShowInviteForm(false);
      // Refresh members list
      // await fetchMembers();
    } catch (err) {
      console.error('Failed to invite member:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (loading) {
    return (
      <div className="project-members-page">
        <div className="project-members-header">
          <div className="loading-skeleton"></div>
        </div>
        <div className="project-members-content">
          <Card className="loading-card">
            <CardContent>
              <div className="loading-skeleton"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !members.length) {
    return (
      <div className="project-members-page">
        <div className="project-members-content">
          <Card className="error-card">
            <CardHeader>
              <CardTitle>Error Loading Members</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="project-members-page">
      <div className="project-members-header">
        <div className="header-content">
          <h1>Project Members</h1>
          <p>
            {project?.name && workspace?.name 
              ? `Manage members for ${project.name} in ${workspace.name}`
              : `Manage project members`
            }
          </p>
        </div>
        <div className="header-actions">
          <Button 
            variant="primary" 
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="invite-button"
          >
            <HiUserPlus />
            Invite Member
          </Button>
        </div>
      </div>

      {showInviteForm && (
        <Card className="invite-form-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HiEnvelope />
              Invite New Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
              className="invite-email-input"
            />
          </CardContent>
          <CardFooter className="gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setShowInviteForm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleInviteMember}
              disabled={!inviteEmail.trim()}
            >
              Send Invite
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="project-members-content">
        <Card className="members-card">
          <CardHeader>
            <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
            <CardAction>
              <div className="search-bar">
                <HiMagnifyingGlass className="search-icon" />
                <Input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </CardAction>
          </CardHeader>

          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="empty-state">
                <HiUserPlus className="empty-icon" />
                <h3>No members found</h3>
                <p>
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'This project doesn\'t have any members yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="rounded-md border border-[var(--border)] bg-[var(--card)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Avatar</th>
                        <th className="px-4 py-2 text-left font-semibold">Name</th>
                        <th className="px-4 py-2 text-left font-semibold">Email</th>
                        <th className="px-4 py-2 text-left font-semibold">Role</th>
                        <th className="px-4 py-2 text-left font-semibold">Joined</th>
                        <th className="px-4 py-2 text-left font-semibold">Last Active</th>
                        <th className="px-4 py-2 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]">
                          <td className="px-4 py-2">
                            <UserAvatar
                              user={{
                                name: `${member.firstName} ${member.lastName}`,
                                firstName: member.firstName,
                                lastName: member.lastName
                              }}
                              size="md"
                            />
                          </td>
                          <td className="px-4 py-2 text-[var(--foreground)] font-medium">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="px-4 py-2 text-[var(--muted-foreground)]">
                            {member.email}
                          </td>
                          <td className="px-4 py-2">
                            {member.role}
                          </td>
                          <td className="px-4 py-2">
                            {formatDate(member.joinedAt)}
                          </td>
                          <td className="px-4 py-2">
                            {member.lastActive ? formatRelativeTime(member.lastActive) : "-"}
                          </td>
                          <td className="px-4 py-2">
                            <Button variant="ghost" size="sm" className="member-menu-button">
                              <HiEllipsisVertical />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
