'use client';

import { useState } from 'react';
import { 
  updateOrganizationMemberRole, 
  removeOrganizationMember, 
  inviteOrganizationMember 
} from '@/utils/apiUtils';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { OrganizationMember, OrganizationRole } from '@/types/organizations';
import {
  HiPlus,
  HiUsers,
  HiTrash,
  
} from 'react-icons/hi2';
import { HiMail } from "react-icons/hi";
interface OrganizationMembersProps {
  organizationId: string;
  members: OrganizationMember[];
  currentUserRole: OrganizationRole;
  onMembersChange: () => void;
}

export default function OrganizationMembers({ 
  organizationId, 
  members, 
  currentUserRole,
  onMembersChange 
}: OrganizationMembersProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: OrganizationRole.MEMBER,
    message: '',
  });

  const canManageMembers = currentUserRole === OrganizationRole.ADMIN || currentUserRole === OrganizationRole.MANAGER;

  const getRoleBadgeClass = (role: OrganizationRole) => {
    switch (role) {
      case OrganizationRole.ADMIN:
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case OrganizationRole.MANAGER:
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case OrganizationRole.MEMBER:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case OrganizationRole.VIEWER:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'INACTIVE':
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]';
    }
  };

  const handleRoleChange = async (memberId: string, newRole: OrganizationRole) => {
    try {
      setIsLoading(true);
      await updateOrganizationMemberRole(memberId, newRole);
      onMembersChange();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (member: OrganizationMember) => {
    try {
      setIsLoading(true);
      await removeOrganizationMember(member.id);
      setMemberToRemove(null);
      onMembersChange();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await inviteOrganizationMember(organizationId, inviteData);
      setInviteData({ email: '', role: OrganizationRole.MEMBER, message: '' });
      setShowInviteModal(false);
      onMembersChange();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-md font-semibold text-[var(--foreground)] flex items-center gap-2">
              <HiUsers className="w-5 h-5 text-[var(--primary)]" />
              Members ({members.length})
            </CardTitle>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage organization members and their roles
            </p>
          </div>
          {canManageMembers && (
            <Button 
              onClick={() => setShowInviteModal(true)}
              className="h-8 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium flex items-center gap-2"
            >
              <HiPlus className="w-4 h-4" />
              Invite Member
            </Button>
          )}
        </div>
      </CardHeader>

      <div className="bg-[var(--card)] rounded-[var(--card-radius)] border-none shadow-sm">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="grid grid-cols-12 gap-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            <div className="col-span-4">Member</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>
        
        <div className="divide-y divide-[var(--border)]">
          {members.map((member) => (
            <div key={member.id} className="px-4 py-3">
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={{
                        id: member.user.id,
                        firstName: member.user.firstName,
                        lastName: member.user.lastName,
                        avatar: member.user.avatar,
                      }}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] truncate">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  {canManageMembers && member.role !== OrganizationRole.ADMIN ? (
                    <Select 
                      value={member.role} 
                      onValueChange={(value) => handleRoleChange(member.id, value as OrganizationRole)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-7 text-xs border-input bg-background text-[var(--foreground)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-none bg-[var(--card)]">
                        <SelectItem value={OrganizationRole.MANAGER}>Manager</SelectItem>
                        <SelectItem value={OrganizationRole.MEMBER}>Member</SelectItem>
                        <SelectItem value={OrganizationRole.VIEWER}>Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`text-xs px-2 py-1 rounded-md border-none ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </Badge>
                  )}
                </div>
                
                <div className="col-span-2">
                  <Badge className={`text-xs px-2 py-1 rounded-md border-none ${getStatusBadgeClass(member.user.status)}`}>
                    {member.user.status}
                  </Badge>
                </div>
                
                <div className="col-span-2">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {formatDate(member.joinedAt)}
                  </span>
                </div>
                
                <div className="col-span-2">
                  {canManageMembers && member.role !== OrganizationRole.ADMIN && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMemberToRemove(member)}
                      disabled={isLoading}
                      className="h-7 border-none bg-[var(--destructive)]/10 hover:bg-[var(--destructive)]/20 text-[var(--destructive)] transition-all duration-200"
                    >
                      <HiTrash className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {members.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                <HiUsers className="w-6 h-6 text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-md font-semibold text-[var(--foreground)] mb-2">
                No members found
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Start by inviting team members to your organization.
              </p>
              {canManageMembers && (
                <Button 
                  onClick={() => setShowInviteModal(true)}
                  className="h-8 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <HiPlus className="w-4 h-4" />
                  Invite Member
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-[var(--card)] border-none rounded-[var(--card-radius)] shadow-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)] flex items-center gap-2">
              <HiMail className="w-5 h-5 text-[var(--primary)]" />
              Invite Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div>
              <Label htmlFor="invite-email" className="text-sm font-medium text-[var(--foreground)]">
                Email Address
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 border-input bg-background text-[var(--foreground)]"
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Role
              </Label>
              <Select 
                value={inviteData.role} 
                onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value as OrganizationRole }))}
              >
                <SelectTrigger className="mt-1 border-input bg-background text-[var(--foreground)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-none bg-[var(--card)]">
                  <SelectItem value={OrganizationRole.VIEWER}>Viewer</SelectItem>
                  <SelectItem value={OrganizationRole.MEMBER}>Member</SelectItem>
                  <SelectItem value={OrganizationRole.MANAGER}>Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="invite-message" className="text-sm font-medium text-[var(--foreground)]">
                Message (Optional)
              </Label>
              <Textarea
                id="invite-message"
                value={inviteData.message}
                onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="mt-1 border-input bg-background text-[var(--foreground)]"
                placeholder="Personal message for the invitation..."
              />
            </div>
            
            <DialogFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                className="h-8 border-none bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--foreground)] transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-8 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {memberToRemove && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setMemberToRemove(null)}
          onConfirm={() => handleRemoveMember(memberToRemove)}
          title="Remove Member"
          message={`Are you sure you want to remove ${memberToRemove.user.firstName} ${memberToRemove.user.lastName} from the organization?`}
          confirmText="Remove"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}