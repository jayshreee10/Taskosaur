'use client';

import { useState } from 'react';
import { OrganizationMember, OrganizationRole } from '@/types';
import { 
  updateOrganizationMemberRole, 
  removeOrganizationMember, 
  inviteOrganizationMember 
} from '@/utils/apiUtils';
import UserAvatar from '@/components/ui/avatars/UserAvatar';
import { Button } from '@/components/ui';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case OrganizationRole.MANAGER:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case OrganizationRole.MEMBER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case OrganizationRole.VIEWER:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const handleRoleChange = async (memberId: string, newRole: OrganizationRole) => {
    try {
      setIsLoading(true);
      await updateOrganizationMemberRole(memberId, newRole);
      onMembersChange();
    } catch (error) {
      console.error('Error updating member role:', error);
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
      console.error('Error removing member:', error);
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
      console.error('Error inviting member:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Members ({members.length})
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage organization members and their roles
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowInviteModal(true)}>
            Invite Member
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">Member</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member) => (
            <div key={member.id} className="px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4">
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      user={{
                        id: member.user.id,
                        firstName: member.user.firstName,
                        lastName: member.user.lastName,
                        avatar: member.user.avatar,
                      }}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  {canManageMembers && member.role !== OrganizationRole.ADMIN ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as OrganizationRole)}
                      className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={isLoading}
                    >
                      <option value={OrganizationRole.MANAGER}>Manager</option>
                      <option value={OrganizationRole.MEMBER}>Member</option>
                      <option value={OrganizationRole.VIEWER}>Viewer</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                  )}
                </div>
                
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(member.user.status)}`}>
                    {member.user.status}
                  </span>
                </div>
                
                <div className="col-span-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(member.joinedAt)}
                  </span>
                </div>
                
                <div className="col-span-2">
                  {canManageMembers && member.role !== OrganizationRole.ADMIN && (
                    <button
                      onClick={() => setMemberToRemove(member)}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invite Member
            </h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as OrganizationRole }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={OrganizationRole.VIEWER}>Viewer</option>
                  <option value={OrganizationRole.MEMBER}>Member</option>
                  <option value={OrganizationRole.MANAGER}>Manager</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteData.message}
                  onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Personal message for the invitation..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
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